/**
 * Behavioral Nudges System
 * Ethical, opt-out nudges based on behavioral science
 */

export interface Nudge {
  id: string;
  type: 'scarcity' | 'social_proof' | 'reciprocity' | 'authority' | 'loss_aversion';
  message: string;
  action?: {
    label: string;
    url: string;
  };
  dismissible: boolean;
  priority: number;
}

export class NudgeEngine {
  /**
   * Generate scarcity nudge
   */
  scarcity(item: { name: string; stock: number; recentPurchases: number }): Nudge | null {
    if (item.stock > 10) return null;

    return {
      id: `scarcity_${item.name}`,
      type: 'scarcity',
      message: `Only ${item.stock} ${item.name} left! ${item.recentPurchases} locals bought this week`,
      action: {
        label: 'Buy Now',
        url: `/materials/${item.name}`
      },
      dismissible: true,
      priority: 8
    };
  }

  /**
   * Generate social proof nudge
   */
  socialProof(worker: { name: string; hireCount: number; location: string }): Nudge | null {
    if (worker.hireCount < 5) return null;

    return {
      id: `social_proof_${worker.name}`,
      type: 'social_proof',
      message: `Hired by ${worker.hireCount} neighbors in ${worker.location}`,
      dismissible: true,
      priority: 7
    };
  }

  /**
   * Generate reciprocity nudge
   */
  reciprocity(user: { completedJobs: number; hasShared: boolean }): Nudge | null {
    if (user.completedJobs === 0 || user.hasShared) return null;

    return {
      id: 'reciprocity_share',
      type: 'reciprocity',
      message: 'Share your success story, unlock R50 credit',
      action: {
        label: 'Share Story',
        url: '/stories/create'
      },
      dismissible: true,
      priority: 6
    };
  }

  /**
   * Generate authority nudge
   */
  authority(worker: { scoutVerified: boolean; badges: string[] }): Nudge | null {
    if (!worker.scoutVerified) return null;

    return {
      id: `authority_${worker.badges.join('_')}`,
      type: 'authority',
      message: `Scout-Approved • ${worker.badges.join(' • ')}`,
      dismissible: false,
      priority: 9
    };
  }

  /**
   * Generate loss aversion nudge
   */
  lossAversion(deal: { name: string; discount: number; expiresIn: number }): Nudge | null {
    if (deal.expiresIn > 24) return null;

    return {
      id: `loss_aversion_${deal.name}`,
      type: 'loss_aversion',
      message: `Don't miss ${deal.discount}% off ${deal.name}! Expires in ${deal.expiresIn}h`,
      action: {
        label: 'Grab Deal',
        url: `/deals/${deal.name}`
      },
      dismissible: true,
      priority: 8
    };
  }

  /**
   * Get all applicable nudges for a user context
   */
  async getNudgesForContext(context: {
    userId: number;
    page: string;
    data?: any;
  }): Promise<Nudge[]> {
    const nudges: Nudge[] = [];

    // Check user preferences (opt-out)
    const userPrefs = await this.getUserPreferences(context.userId);
    if (!userPrefs.nudgesEnabled) return [];

    // Generate contextual nudges based on page
    switch (context.page) {
      case 'material_detail':
        if (context.data?.material) {
          const scarcityNudge = this.scarcity(context.data.material);
          if (scarcityNudge) nudges.push(scarcityNudge);
        }
        break;

      case 'worker_profile':
        if (context.data?.worker) {
          const socialProofNudge = this.socialProof(context.data.worker);
          if (socialProofNudge) nudges.push(socialProofNudge);

          const authorityNudge = this.authority(context.data.worker);
          if (authorityNudge) nudges.push(authorityNudge);
        }
        break;

      case 'dashboard':
        const user = await this.getUserStats(context.userId);
        const reciprocityNudge = this.reciprocity(user);
        if (reciprocityNudge) nudges.push(reciprocityNudge);
        break;
    }

    // Sort by priority and return
    return nudges.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Log nudge interaction
   */
  async logInteraction(nudgeId: string, userId: number, action: 'shown' | 'clicked' | 'dismissed') {
    // Log to database for analytics
    console.log(`Nudge ${nudgeId} ${action} by user ${userId}`);
  }

  /**
   * Get user nudge preferences
   */
  private async getUserPreferences(userId: number) {
    // Query database for user preferences
    return {
      nudgesEnabled: true,
      disabledTypes: [] as string[]
    };
  }

  /**
   * Get user statistics
   */
  private async getUserStats(userId: number) {
    // Query database for user stats
    return {
      completedJobs: 0,
      hasShared: false
    };
  }
}

/**
 * Milestone completion nudge
 */
export function milestoneCompletionNudge(milestone: {
  title: string;
  amount: number;
}): Nudge {
  return {
    id: `milestone_${milestone.title}`,
    type: 'scarcity',
    message: `Complete "${milestone.title}" today—unlock bonus review and R${milestone.amount} release!`,
    action: {
      label: 'Upload Proof',
      url: '/milestones/upload'
    },
    dismissible: true,
    priority: 9
  };
}

/**
 * Referral nudge
 */
export function referralNudge(tier: string, nextReward: number): Nudge {
  return {
    id: 'referral_tier',
    type: 'reciprocity',
    message: `${tier} Scout: Refer 2 more for R${nextReward} bonus!`,
    action: {
      label: 'Share Link',
      url: '/referrals'
    },
    dismissible: true,
    priority: 7
  };
}
