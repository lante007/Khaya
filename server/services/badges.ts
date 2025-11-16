/**
 * Trust Badge System
 * Calculates and assigns badges to users based on their activity and performance
 */

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: string;
}

export const AVAILABLE_BADGES: Record<string, Badge> = {
  verified: {
    id: 'verified',
    name: 'Verified',
    description: 'Identity verified by Khaya',
    icon: 'shield-check',
    color: 'blue',
    criteria: 'Profile verified with ID document',
  },
  topRated: {
    id: 'topRated',
    name: 'Top Rated',
    description: 'Consistently high ratings',
    icon: 'star',
    color: 'yellow',
    criteria: 'Average rating of 4.5+ with 10+ reviews',
  },
  fastResponse: {
    id: 'fastResponse',
    name: 'Fast Response',
    description: 'Responds quickly to messages',
    icon: 'zap',
    color: 'orange',
    criteria: 'Average response time under 2 hours',
  },
  reliable: {
    id: 'reliable',
    name: 'Reliable',
    description: 'Completes jobs on time',
    icon: 'clock',
    color: 'green',
    criteria: '90%+ on-time completion rate',
  },
  experienced: {
    id: 'experienced',
    name: 'Experienced',
    description: 'Completed many jobs successfully',
    icon: 'briefcase',
    color: 'purple',
    criteria: '50+ completed jobs',
  },
  newbie: {
    id: 'newbie',
    name: 'New Member',
    description: 'New to the platform',
    icon: 'user-plus',
    color: 'gray',
    criteria: 'Joined within the last 30 days',
  },
};

export interface UserStats {
  completedJobs: number;
  averageRating?: number;
  totalReviews: number;
  onTimeCompletionRate?: number;
  averageResponseTime?: number; // in hours
  accountAge: number; // in days
  verified: boolean;
  trustScore: number;
}

export function calculateBadges(stats: UserStats): string[] {
  const badges: string[] = [];

  // Verified Badge
  if (stats.verified) {
    badges.push('verified');
  }

  // Top Rated Badge
  if (stats.averageRating && stats.averageRating >= 4.5 && stats.totalReviews >= 10) {
    badges.push('topRated');
  }

  // Fast Response Badge
  if (stats.averageResponseTime && stats.averageResponseTime < 2) {
    badges.push('fastResponse');
  }

  // Reliable Badge
  if (stats.onTimeCompletionRate && stats.onTimeCompletionRate >= 0.9) {
    badges.push('reliable');
  }

  // Experienced Badge
  if (stats.completedJobs >= 50) {
    badges.push('experienced');
  }

  // New Member Badge
  if (stats.accountAge <= 30 && stats.completedJobs < 5) {
    badges.push('newbie');
  }

  return badges;
}

export function getBadgeDetails(badgeIds: string[]): Badge[] {
  return badgeIds
    .map(id => AVAILABLE_BADGES[id])
    .filter(badge => badge !== undefined);
}

export function calculateTrustScore(stats: UserStats): number {
  let score = 0;

  // Base score for verification
  if (stats.verified) {
    score += 20;
  }

  // Score from completed jobs (max 30 points)
  score += Math.min(stats.completedJobs * 0.6, 30);

  // Score from ratings (max 25 points)
  if (stats.averageRating && stats.totalReviews > 0) {
    score += (stats.averageRating / 5) * 25;
  }

  // Score from reliability (max 15 points)
  if (stats.onTimeCompletionRate) {
    score += stats.onTimeCompletionRate * 15;
  }

  // Score from response time (max 10 points)
  if (stats.averageResponseTime !== undefined) {
    if (stats.averageResponseTime < 1) {
      score += 10;
    } else if (stats.averageResponseTime < 2) {
      score += 7;
    } else if (stats.averageResponseTime < 4) {
      score += 4;
    }
  }

  // Round to nearest integer
  return Math.round(Math.min(score, 100));
}

export interface BadgeProgress {
  badgeId: string;
  badge: Badge;
  earned: boolean;
  progress: number; // 0-100
  nextMilestone?: string;
}

export function getBadgeProgress(stats: UserStats): BadgeProgress[] {
  const progress: BadgeProgress[] = [];

  // Verified Badge
  progress.push({
    badgeId: 'verified',
    badge: AVAILABLE_BADGES.verified,
    earned: stats.verified,
    progress: stats.verified ? 100 : 0,
    nextMilestone: stats.verified ? undefined : 'Upload ID document for verification',
  });

  // Top Rated Badge
  const topRatedProgress = stats.totalReviews >= 10 && stats.averageRating
    ? (stats.averageRating / 4.5) * 100
    : (stats.totalReviews / 10) * 50;
  progress.push({
    badgeId: 'topRated',
    badge: AVAILABLE_BADGES.topRated,
    earned: stats.averageRating ? stats.averageRating >= 4.5 && stats.totalReviews >= 10 : false,
    progress: Math.min(topRatedProgress, 100),
    nextMilestone: stats.totalReviews < 10
      ? `Get ${10 - stats.totalReviews} more reviews`
      : stats.averageRating && stats.averageRating < 4.5
      ? 'Maintain 4.5+ average rating'
      : undefined,
  });

  // Experienced Badge
  const experiencedProgress = (stats.completedJobs / 50) * 100;
  progress.push({
    badgeId: 'experienced',
    badge: AVAILABLE_BADGES.experienced,
    earned: stats.completedJobs >= 50,
    progress: Math.min(experiencedProgress, 100),
    nextMilestone: stats.completedJobs < 50
      ? `Complete ${50 - stats.completedJobs} more jobs`
      : undefined,
  });

  // Reliable Badge
  const reliableProgress = stats.onTimeCompletionRate
    ? (stats.onTimeCompletionRate / 0.9) * 100
    : 0;
  progress.push({
    badgeId: 'reliable',
    badge: AVAILABLE_BADGES.reliable,
    earned: stats.onTimeCompletionRate ? stats.onTimeCompletionRate >= 0.9 : false,
    progress: Math.min(reliableProgress, 100),
    nextMilestone: stats.onTimeCompletionRate && stats.onTimeCompletionRate < 0.9
      ? 'Complete jobs on time to reach 90%'
      : !stats.onTimeCompletionRate
      ? 'Complete your first job'
      : undefined,
  });

  return progress;
}
