/**
 * Notifications Router
 * User notifications
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';
import { queryItems } from '../lib/db.js';

export const notificationsRouter = router({
  // Get my notifications
  getMyNotifications: protectedProcedure
    .query(async ({ ctx }) => {
      const notifications = await queryItems({
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk AND userId = :userId',
        ExpressionAttributeValues: {
          ':prefix': 'NOTIFICATION#',
          ':sk': 'METADATA',
          ':userId': ctx.user!.userId
        }
      });

      return notifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    })
});
