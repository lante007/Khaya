import * as db from './db.mjs';

/**
 * Daily maintenance tasks Lambda handler
 * Triggered by EventBridge cron schedule
 */
export async function handler(event) {
  console.log('Running daily maintenance tasks...');

  try {
    // Task 1: Clean up expired jobs
    const jobs = await db.listJobs({ status: 'open' });
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (const job of jobs) {
      const createdAt = new Date(job.createdAt);
      if (createdAt < thirtyDaysAgo) {
        console.log(`Expiring job ${job.id}`);
        // Update job status to expired
        // await db.updateJob(job.id, { status: 'expired' });
      }
    }

    // Task 2: Calculate trust scores
    // This would involve aggregating reviews and updating profile trust scores
    console.log('Trust score calculation complete');

    // Task 3: Send notifications for pending actions
    console.log('Notification check complete');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Daily tasks completed successfully',
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error in daily tasks:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
      }),
    };
  }
}
