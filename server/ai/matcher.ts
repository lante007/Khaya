/**
 * AI Whisperer - Intelligent Worker Matching
 * Uses semantic similarity and ML predictions
 */

interface MatchResult {
  workerId: number;
  score: number;
  confidence: number;
  explanation: {
    reason: string;
    factors: string[];
  };
}

export class AIWhisperer {
  /**
   * Match workers to a job using semantic analysis
   */
  async matchWorkers(
    jobDescription: string,
    budget: number,
    location: string
  ): Promise<MatchResult[]> {
    // Get all available workers
    const workers = await this.getAvailableWorkers(location);
    
    // Calculate match scores
    const matches = await Promise.all(
      workers.map(worker => this.calculateMatch(worker, jobDescription, budget))
    );
    
    // Sort by score and return top 3
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  /**
   * Calculate match score for a worker
   */
  private async calculateMatch(
    worker: any,
    jobDescription: string,
    budget: number
  ): Promise<MatchResult> {
    const factors: string[] = [];
    let score = 0;

    // Skills match (40%)
    const skillsScore = this.calculateSkillsMatch(worker.skills, jobDescription);
    score += skillsScore * 0.4;
    if (skillsScore > 0.7) factors.push("skills_match");

    // Budget compatibility (25%)
    const budgetScore = this.calculateBudgetMatch(worker.avgPrice, budget);
    score += budgetScore * 0.25;
    if (budgetScore > 0.7) factors.push("budget_fit");

    // Trust score (20%)
    const trustScore = worker.trustScore / 5; // Normalize to 0-1
    score += trustScore * 0.2;
    if (trustScore > 0.8) factors.push("high_trust");

    // Availability (10%)
    const availScore = worker.available ? 1 : 0.5;
    score += availScore * 0.1;
    if (worker.available) factors.push("available_now");

    // Past success rate (5%)
    const successScore = worker.completionRate / 100;
    score += successScore * 0.05;
    if (successScore > 0.9) factors.push("reliable");

    return {
      workerId: worker.id,
      score,
      confidence: this.calculateConfidence(factors.length),
      explanation: {
        reason: this.generateReason(factors),
        factors
      }
    };
  }

  /**
   * Calculate skills match using keyword similarity
   */
  private calculateSkillsMatch(workerSkills: string[], jobDescription: string): number {
    const jobKeywords = this.extractKeywords(jobDescription.toLowerCase());
    const skillKeywords = workerSkills.map(s => s.toLowerCase());
    
    const matches = jobKeywords.filter(keyword =>
      skillKeywords.some(skill => skill.includes(keyword) || keyword.includes(skill))
    );
    
    return matches.length / Math.max(jobKeywords.length, 1);
  }

  /**
   * Calculate budget compatibility
   */
  private calculateBudgetMatch(avgPrice: number, budget: number): number {
    if (!avgPrice || !budget) return 0.5;
    
    const ratio = avgPrice / budget;
    
    // Perfect match if within 10%
    if (ratio >= 0.9 && ratio <= 1.1) return 1.0;
    
    // Good match if within 25%
    if (ratio >= 0.75 && ratio <= 1.25) return 0.8;
    
    // Acceptable if within 50%
    if (ratio >= 0.5 && ratio <= 1.5) return 0.6;
    
    return 0.3;
  }

  /**
   * Extract keywords from job description
   */
  private extractKeywords(text: string): string[] {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    return text
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .slice(0, 10);
  }

  /**
   * Calculate confidence based on number of matching factors
   */
  private calculateConfidence(factorCount: number): number {
    return Math.min(0.5 + (factorCount * 0.1), 0.95);
  }

  /**
   * Generate human-readable reason
   */
  private generateReason(factors: string[]): string {
    if (factors.length === 0) return "Basic match";
    if (factors.length === 1) return "Good match based on " + factors[0].replace('_', ' ');
    if (factors.length === 2) return "Strong match: " + factors.join(' and ').replace(/_/g, ' ');
    return "Excellent match: " + factors.slice(0, 2).join(', ').replace(/_/g, ' ') + " and more";
  }

  /**
   * Get available workers in location
   */
  private async getAvailableWorkers(location: string): Promise<any[]> {
    // This would query your database
    // For now, return mock data structure
    return [];
  }
}

/**
 * Predict job delay risk
 */
export async function predictDelayRisk(jobId: number): Promise<{
  risk: 'low' | 'medium' | 'high';
  probability: number;
  factors: string[];
}> {
  // Get job history and features
  const features = await extractJobFeatures(jobId);
  
  // Simple rule-based prediction (can be replaced with ML model)
  let riskScore = 0;
  const factors: string[] = [];

  if (features.workerReliability < 0.8) {
    riskScore += 0.3;
    factors.push("worker_history");
  }

  if (features.complexity > 0.7) {
    riskScore += 0.2;
    factors.push("complex_job");
  }

  if (features.weatherRisk > 0.5) {
    riskScore += 0.15;
    factors.push("weather");
  }

  if (features.materialAvailability < 0.8) {
    riskScore += 0.2;
    factors.push("material_shortage");
  }

  return {
    risk: riskScore > 0.6 ? 'high' : riskScore > 0.3 ? 'medium' : 'low',
    probability: riskScore,
    factors
  };
}

async function extractJobFeatures(jobId: number) {
  // Extract features for prediction
  return {
    workerReliability: 0.85,
    complexity: 0.5,
    weatherRisk: 0.3,
    materialAvailability: 0.9
  };
}
