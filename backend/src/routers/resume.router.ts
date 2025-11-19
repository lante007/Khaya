/**
 * Resume Router
 * Auto-updating digital résumés for workers
 * Ubuntu principle: Building trust through verified work
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { getItem, putItem, updateItem } from '../lib/db.js';
import {
  calculateStrength,
  getTier,
  getEarnedBadges,
  inferSkills,
  calculateAverageRating,
  countProofPhotos,
  extractUniqueSkills,
  TRUST_BADGES,
  WorkerResume,
  ResumeProject
} from '../lib/resume.js';

export const resumeRouter = router({
  /**
   * Get worker's résumé
   * Public endpoint - anyone can view worker résumés
   */
  getWorkerResume: publicProcedure
    .input(z.object({
      workerId: z.string()
    }))
    .query(async ({ input }) => {
      // Yebo! Fetching worker's trust profile 📋
      const resume = await getItem({
        PK: `WORKER#${input.workerId}`,
        SK: 'RESUME'
      });

      if (!resume) {
        // Create empty résumé if doesn't exist
        const emptyResume: WorkerResume = {
          workerId: input.workerId,
          strength: 0,
          tier: 'Bronze',
          badges: [],
          totalJobs: 0,
          avgRating: 0,
          skills: [],
          projects: [],
          updatedAt: new Date().toISOString()
        };

        await putItem({
          PK: `WORKER#${input.workerId}`,
          SK: 'RESUME',
          ...emptyResume
        });

        return emptyResume;
      }

      return resume as WorkerResume;
    }),

  /**
   * Get my résumé (authenticated worker)
   */
  getMyResume: protectedProcedure
    .query(async ({ ctx }) => {
      const resume = await getItem({
        PK: `WORKER#${ctx.user!.userId}`,
        SK: 'RESUME'
      });

      if (!resume) {
        // Create empty résumé
        const emptyResume: WorkerResume = {
          workerId: String(ctx.user!.userId),
          strength: 0,
          tier: 'Bronze',
          badges: [],
          totalJobs: 0,
          avgRating: 0,
          skills: [],
          projects: [],
          updatedAt: new Date().toISOString()
        };

        await putItem({
          PK: `WORKER#${ctx.user!.userId}`,
          SK: 'RESUME',
          ...emptyResume
        });

        return emptyResume;
      }

      return resume as WorkerResume;
    }),

  /**
   * Add completed job to résumé
   * Called automatically when job is completed
   */
  addCompletedJob: protectedProcedure
    .input(z.object({
      jobId: z.string(),
      title: z.string(),
      description: z.string(),
      location: z.string(),
      rating: z.number().min(1).max(5).optional(),
      proofPhotos: z.array(z.string()).default([]),
      gpsCoords: z.object({
        lat: z.number(),
        lon: z.number()
      }).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Sawubona! Adding another achievement 🎉
      const workerId = String(ctx.user!.userId);

      // Get current résumé
      let resume = await getItem({
        PK: `WORKER#${workerId}`,
        SK: 'RESUME'
      }) as WorkerResume | null;

      if (!resume) {
        resume = {
          workerId,
          strength: 0,
          tier: 'Bronze',
          badges: [],
          totalJobs: 0,
          avgRating: 0,
          skills: [],
          projects: [],
          updatedAt: new Date().toISOString()
        };
      }

      // Infer skills from job
      const inferredSkills = inferSkills(`${input.title} ${input.description}`);

      // Create project entry
      const project: ResumeProject = {
        jobId: input.jobId,
        title: input.title,
        description: input.description,
        location: input.location,
        completedAt: new Date().toISOString(),
        rating: input.rating,
        proofPhotos: input.proofPhotos,
        gpsCoords: input.gpsCoords,
        skills: inferredSkills
      };

      // Add to projects
      resume.projects.push(project);

      // Recalculate metrics
      resume.totalJobs = resume.projects.length;
      resume.avgRating = calculateAverageRating(resume.projects);
      const proofCount = countProofPhotos(resume.projects);
      resume.skills = extractUniqueSkills(resume.projects);

      // Calculate strength
      resume.strength = calculateStrength(
        resume.totalJobs,
        proofCount,
        resume.avgRating
      );

      // Assign tier
      resume.tier = getTier(resume.strength);

      // Check badges
      resume.badges = getEarnedBadges(resume.totalJobs, resume.avgRating);

      // Update timestamp
      resume.updatedAt = new Date().toISOString();

      // Save to database
      await putItem({
        PK: `WORKER#${workerId}`,
        SK: 'RESUME',
        ...resume
      });

      // Yebo! Strength growing: ${resume.strength}/100 💪
      return {
        success: true,
        resume,
        message: `Job added! Strength: ${resume.strength}/100, Tier: ${resume.tier}`
      };
    }),

  /**
   * Update project rating
   * Called when customer submits rating
   */
  updateProjectRating: protectedProcedure
    .input(z.object({
      jobId: z.string(),
      workerId: z.string(),
      rating: z.number().min(1).max(5)
    }))
    .mutation(async ({ input }) => {
      // Siyabonga! Customer feedback received 🌟
      const resume = await getItem({
        PK: `WORKER#${input.workerId}`,
        SK: 'RESUME'
      }) as WorkerResume | null;

      if (!resume) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Worker résumé not found'
        });
      }

      // Find and update project
      const projectIndex = resume.projects.findIndex(p => p.jobId === input.jobId);
      if (projectIndex === -1) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found in résumé'
        });
      }

      resume.projects[projectIndex].rating = input.rating;

      // Recalculate metrics
      resume.avgRating = calculateAverageRating(resume.projects);
      const proofCount = countProofPhotos(resume.projects);

      // Recalculate strength
      resume.strength = calculateStrength(
        resume.totalJobs,
        proofCount,
        resume.avgRating
      );

      // Reassign tier
      resume.tier = getTier(resume.strength);

      // Recheck badges
      resume.badges = getEarnedBadges(resume.totalJobs, resume.avgRating);

      // Update timestamp
      resume.updatedAt = new Date().toISOString();

      // Save
      await putItem({
        PK: `WORKER#${input.workerId}`,
        SK: 'RESUME',
        ...resume
      });

      return {
        success: true,
        resume,
        message: `Rating updated! New strength: ${resume.strength}/100`
      };
    }),

  /**
   * Get all available badges
   */
  getBadges: publicProcedure
    .query(async () => {
      return TRUST_BADGES;
    }),

  /**
   * Get résumé statistics
   */
  getResumeStats: publicProcedure
    .input(z.object({
      workerId: z.string()
    }))
    .query(async ({ input }) => {
      const resume = await getItem({
        PK: `WORKER#${input.workerId}`,
        SK: 'RESUME'
      }) as WorkerResume | null;

      if (!resume) {
        return {
          strength: 0,
          tier: 'Bronze',
          totalJobs: 0,
          avgRating: 0,
          badgeCount: 0,
          skillCount: 0
        };
      }

      return {
        strength: resume.strength,
        tier: resume.tier,
        totalJobs: resume.totalJobs,
        avgRating: resume.avgRating,
        badgeCount: resume.badges.length,
        skillCount: resume.skills.length
      };
    })
});
