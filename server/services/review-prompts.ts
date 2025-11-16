/**
 * Review Prompt System
 * Automatically prompts users to leave reviews after job completion
 */

export interface ReviewPromptData {
  jobId: number;
  jobTitle: string;
  workerId: string;
  workerName: string;
  buyerId: string;
  buyerName: string;
  completedAt: string;
  promptSentAt?: string;
  reviewSubmitted: boolean;
}

export interface ReviewReminderConfig {
  initialDelayHours: number; // Hours after job completion to send first prompt
  reminderDelayDays: number; // Days after first prompt to send reminder
  maxReminders: number; // Maximum number of reminders to send
}

export const DEFAULT_CONFIG: ReviewReminderConfig = {
  initialDelayHours: 24, // Wait 24 hours after job completion
  reminderDelayDays: 3, // Send reminder after 3 days
  maxReminders: 2, // Send up to 2 reminders
};

export function shouldSendReviewPrompt(
  completedAt: Date,
  promptSentAt: Date | null,
  reviewSubmitted: boolean,
  config: ReviewReminderConfig = DEFAULT_CONFIG
): boolean {
  // Don't send if review already submitted
  if (reviewSubmitted) {
    return false;
  }

  const now = new Date();
  const hoursSinceCompletion = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60);

  // First prompt: send after initial delay
  if (!promptSentAt && hoursSinceCompletion >= config.initialDelayHours) {
    return true;
  }

  // Reminder: send after reminder delay
  if (promptSentAt) {
    const daysSincePrompt = (now.getTime() - promptSentAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePrompt >= config.reminderDelayDays) {
      return true;
    }
  }

  return false;
}

export interface ReviewPromptEmail {
  to: string;
  subject: string;
  body: string;
  isReminder: boolean;
}

export function generateReviewPromptEmail(
  data: ReviewPromptData,
  recipientType: 'buyer' | 'worker',
  isReminder: boolean = false
): ReviewPromptEmail {
  const recipientName = recipientType === 'buyer' ? data.buyerName : data.workerName;
  const otherPartyName = recipientType === 'buyer' ? data.workerName : data.buyerName;
  const recipientEmail = recipientType === 'buyer' ? data.buyerId : data.workerId; // Assuming IDs are emails for now

  const subject = isReminder
    ? `Reminder: Review your experience with ${otherPartyName}`
    : `How was your experience with ${otherPartyName}?`;

  const body = `
Hi ${recipientName},

${isReminder ? 'This is a friendly reminder that ' : ''}We hope your recent job "${data.jobTitle}" went well!

Your feedback helps build trust in our community and helps ${otherPartyName} improve their service.

Could you take a moment to share your experience?

**What to include in your review:**
- Quality of work
- Communication
- Timeliness
- Professionalism
- Overall satisfaction

**Leave a Review:**
Visit your dashboard to leave a review for this job.

Thank you for being part of the Khaya community!

Best regards,
The Khaya Team

---
*This is an automated message. If you've already left a review, please disregard this email.*
  `.trim();

  return {
    to: recipientEmail,
    subject,
    body,
    isReminder,
  };
}

export interface ReviewPromptStats {
  totalJobsCompleted: number;
  reviewsReceived: number;
  reviewRate: number; // Percentage
  promptsSent: number;
  remindersSent: number;
  averageTimeToReview: number; // Hours
}

export function calculateReviewStats(jobs: ReviewPromptData[]): ReviewPromptStats {
  const totalJobsCompleted = jobs.length;
  const reviewsReceived = jobs.filter(j => j.reviewSubmitted).length;
  const reviewRate = totalJobsCompleted > 0 ? (reviewsReceived / totalJobsCompleted) * 100 : 0;
  const promptsSent = jobs.filter(j => j.promptSentAt).length;
  const remindersSent = 0; // Would need to track this separately

  // Calculate average time to review
  const reviewedJobs = jobs.filter(j => j.reviewSubmitted && j.promptSentAt);
  const totalTimeToReview = reviewedJobs.reduce((sum, job) => {
    const completedAt = new Date(job.completedAt);
    const promptSentAt = new Date(job.promptSentAt!);
    return sum + (promptSentAt.getTime() - completedAt.getTime());
  }, 0);
  const averageTimeToReview = reviewedJobs.length > 0
    ? totalTimeToReview / reviewedJobs.length / (1000 * 60 * 60)
    : 0;

  return {
    totalJobsCompleted,
    reviewsReceived,
    reviewRate,
    promptsSent,
    remindersSent,
    averageTimeToReview,
  };
}

export interface ReviewPromptTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export const REVIEW_PROMPT_TEMPLATES: ReviewPromptTemplate[] = [
  {
    id: 'standard',
    name: 'Standard Review Request',
    subject: 'How was your experience with {{otherPartyName}}?',
    body: `Hi {{recipientName}},

We hope your recent job "{{jobTitle}}" went well!

Your feedback helps build trust in our community. Could you take a moment to share your experience with {{otherPartyName}}?

Leave a review: {{reviewLink}}

Thank you!
The Khaya Team`,
    variables: ['recipientName', 'jobTitle', 'otherPartyName', 'reviewLink'],
  },
  {
    id: 'reminder',
    name: 'Review Reminder',
    subject: 'Reminder: Review your experience with {{otherPartyName}}',
    body: `Hi {{recipientName}},

This is a friendly reminder to review your recent job "{{jobTitle}}" with {{otherPartyName}}.

Your feedback is valuable and helps our community grow.

Leave a review: {{reviewLink}}

Best regards,
The Khaya Team`,
    variables: ['recipientName', 'jobTitle', 'otherPartyName', 'reviewLink'],
  },
  {
    id: 'positive',
    name: 'Positive Experience Follow-up',
    subject: 'Share your great experience with {{otherPartyName}}!',
    body: `Hi {{recipientName}},

We're glad to hear your job "{{jobTitle}}" was completed successfully!

Help {{otherPartyName}} grow their business by sharing your positive experience.

Leave a review: {{reviewLink}}

Thank you for being part of Khaya!
The Khaya Team`,
    variables: ['recipientName', 'jobTitle', 'otherPartyName', 'reviewLink'],
  },
];

export function renderTemplate(template: ReviewPromptTemplate, variables: Record<string, string>): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.body;

  // Replace all variables
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    subject = subject.replace(new RegExp(placeholder, 'g'), value);
    body = body.replace(new RegExp(placeholder, 'g'), value);
  });

  return { subject, body };
}
