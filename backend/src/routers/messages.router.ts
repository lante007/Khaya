/**
 * Messages Router
 * In-app messaging between clients and workers
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc.js';
import { putItem, getItem, updateItem, queryItems } from '../lib/db.js';
import { v4 as uuidv4 } from 'uuid';

export const messagesRouter = router({
  // Send message
  send: protectedProcedure
    .input(z.object({
      recipientId: z.string(),
      jobId: z.string().optional(),
      content: z.string().min(1).max(5000),
      attachments: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.recipientId === ctx.user!.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot send message to yourself'
        });
      }

      // Verify recipient exists
      const recipient = await getItem({
        PK: `USER#${input.recipientId}`,
        SK: 'PROFILE'
      });

      if (!recipient) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Recipient not found'
        });
      }

      const messageId = uuidv4();
      const now = new Date().toISOString();

      // Create conversation ID (sorted user IDs for consistency)
      const conversationId = [ctx.user!.userId, input.recipientId].sort().join('#');

      const message = {
        PK: `CONVERSATION#${conversationId}`,
        SK: `MESSAGE#${now}#${messageId}`,
        messageId,
        conversationId,
        senderId: ctx.user!.userId,
        recipientId: input.recipientId,
        jobId: input.jobId,
        content: input.content,
        attachments: input.attachments || [],
        read: false,
        createdAt: now,
        GSI1PK: `USER#${input.recipientId}`,
        GSI1SK: now
      };

      await putItem(message);

      // Update or create conversation metadata
      const conversation = await getItem({
        PK: `CONVERSATION#${conversationId}`,
        SK: 'METADATA'
      });

      if (conversation) {
        await updateItem(
          { PK: `CONVERSATION#${conversationId}`, SK: 'METADATA' },
          {
            lastMessageAt: now,
            lastMessageContent: input.content.substring(0, 100),
            lastMessageSenderId: ctx.user!.userId,
            unreadCount: {
              [input.recipientId]: (conversation.unreadCount?.[input.recipientId] || 0) + 1
            }
          }
        );
      } else {
        await putItem({
          PK: `CONVERSATION#${conversationId}`,
          SK: 'METADATA',
          conversationId,
          participants: [ctx.user!.userId, input.recipientId],
          jobId: input.jobId,
          createdAt: now,
          lastMessageAt: now,
          lastMessageContent: input.content.substring(0, 100),
          lastMessageSenderId: ctx.user!.userId,
          unreadCount: {
            [input.recipientId]: 1,
            [ctx.user!.userId]: 0
          }
        });
      }

      return { messageId, success: true };
    }),

  // Get conversation messages
  getConversation: protectedProcedure
    .input(z.object({
      otherUserId: z.string(),
      limit: z.number().default(50),
      cursor: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const conversationId = [ctx.user!.userId, input.otherUserId].sort().join('#');

      const messages = await queryItems({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `CONVERSATION#${conversationId}`,
          ':sk': 'MESSAGE#'
        },
        ScanIndexForward: false, // Newest first
        Limit: input.limit
      });

      // Get other user details
      const otherUser = await getItem({
        PK: `USER#${input.otherUserId}`,
        SK: 'PROFILE'
      });

      return {
        messages: messages.reverse(), // Oldest first for display
        otherUser: otherUser ? {
          userId: otherUser.userId,
          name: otherUser.name,
          userType: otherUser.userType,
          verified: otherUser.verified
        } : null
      };
    }),

  // Get all conversations
  getConversations: protectedProcedure
    .query(async ({ ctx }) => {
      // Find all conversations where user is a participant
      const allConversations = await queryItems({
        FilterExpression: 'contains(participants, :userId)',
        ExpressionAttributeValues: {
          ':userId': ctx.user!.userId
        }
      });

      const conversations = allConversations.filter(c => c.SK === 'METADATA');

      // Fetch other participant details
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conv) => {
          const otherUserId = conv.participants.find((p: string) => p !== ctx.user!.userId);
          
          const otherUser = await getItem({
            PK: `USER#${otherUserId}`,
            SK: 'PROFILE'
          });

          return {
            conversationId: conv.conversationId,
            otherUser: otherUser ? {
              userId: otherUser.userId,
              name: otherUser.name,
              userType: otherUser.userType,
              verified: otherUser.verified
            } : null,
            lastMessageAt: conv.lastMessageAt,
            lastMessageContent: conv.lastMessageContent,
            unreadCount: conv.unreadCount?.[ctx.user!.userId] || 0,
            jobId: conv.jobId
          };
        })
      );

      return conversationsWithDetails.sort((a, b) => 
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
    }),

  // Mark messages as read
  markAsRead: protectedProcedure
    .input(z.object({
      otherUserId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const conversationId = [ctx.user!.userId, input.otherUserId].sort().join('#');

      // Get all unread messages
      const messages = await queryItems({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: 'recipientId = :userId AND #read = :false',
        ExpressionAttributeNames: {
          '#read': 'read'
        },
        ExpressionAttributeValues: {
          ':pk': `CONVERSATION#${conversationId}`,
          ':sk': 'MESSAGE#',
          ':userId': ctx.user!.userId,
          ':false': false
        }
      });

      // Mark all as read
      await Promise.all(
        messages.map(msg => 
          updateItem(
            { PK: msg.PK, SK: msg.SK },
            { read: true, readAt: new Date().toISOString() }
          )
        )
      );

      // Reset unread count
      await updateItem(
        { PK: `CONVERSATION#${conversationId}`, SK: 'METADATA' },
        {
          unreadCount: {
            [ctx.user!.userId]: 0
          }
        }
      );

      return { success: true, markedCount: messages.length };
    }),

  // Get unread count
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const conversations = await queryItems({
        FilterExpression: 'contains(participants, :userId) AND SK = :metadata',
        ExpressionAttributeValues: {
          ':userId': ctx.user!.userId,
          ':metadata': 'METADATA'
        }
      });

      const totalUnread = conversations.reduce((sum, conv) => 
        sum + (conv.unreadCount?.[ctx.user!.userId] || 0), 0
      );

      return { totalUnread };
    }),

  // Delete message (soft delete)
  deleteMessage: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      messageId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Find the message
      const messages = await queryItems({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: 'messageId = :messageId',
        ExpressionAttributeValues: {
          ':pk': `CONVERSATION#${input.conversationId}`,
          ':sk': 'MESSAGE#',
          ':messageId': input.messageId
        }
      });

      if (messages.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found'
        });
      }

      const message = messages[0];

      // Only sender can delete
      if (message.senderId !== ctx.user!.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Can only delete your own messages'
        });
      }

      await updateItem(
        { PK: message.PK, SK: message.SK },
        {
          deleted: true,
          deletedAt: new Date().toISOString(),
          content: '[Message deleted]'
        }
      );

      return { success: true };
    })
});
