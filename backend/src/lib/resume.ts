/**
 * Resume System - Ubuntu-inspired worker credibility
 * "Umuntu ngumuntu ngabantu" - A person is a person through other people
 */

export interface ResumeProject {
  jobId: string;
  title: string;
  description: string;
  location: string;
  completedAt: string;
  rating?: number;
  proofPhotos: string[];
  gpsCoords?: {
    lat: number;
    lon: number;
  };
  skills: string[];
}

export interface WorkerResume {
  workerId: string;
  strength: number; // 0-100
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  badges: string[];
  totalJobs: number;
  avgRating: number;
  skills: string[];
  projects: ResumeProject[];
  updatedAt: string;
}

export interface TrustBadge {
  id: string;
  name: string;
  nameZulu: string;
  description: string;
  icon: string;
  requirement: string;
}

/**
 * Calculate worker strength score
 * Yebo! Let's measure the worker's growing power 💪
 * 
 * Formula: strength = min(100, verified_jobs * 10 + proof_photos * 5 + avg_rating * 20)
 */
export function calculateStrength(
  verifiedJobs: number,
  proofPhotos: number,
  avgRating: number
): number {
  const strength = Math.min(
    100,
    verifiedJobs * 10 + proofPhotos * 5 + avgRating * 20
  );
  
  return Math.round(strength);
}

/**
 * Assign trust tier based on strength
 * Sawubona! Welcome to your tier 🌟
 */
export function getTier(strength: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' {
  if (strength >= 90) return 'Platinum';
  if (strength >= 70) return 'Gold';
  if (strength >= 40) return 'Silver';
  return 'Bronze';
}

/**
 * Available trust badges
 * Ubuntu badges - celebrating community trust
 */
export const TRUST_BADGES: TrustBadge[] = [
  {
    id: 'ubaba-reliable',
    name: 'Ubaba Reliable',
    nameZulu: 'Ubaba Othembekile',
    description: 'Completed 5+ jobs with 4.5+ rating',
    icon: '🛡️',
    requirement: '5+ jobs, 4.5+ rating'
  },
  {
    id: 'isisebenzi-esihle',
    name: 'Isisebenzi Esihle',
    nameZulu: 'Isisebenzi Esihle',
    description: 'Excellent worker - 10+ completed jobs',
    icon: '⭐',
    requirement: '10+ jobs'
  },
  {
    id: 'iqhawe',
    name: 'Iqhawe',
    nameZulu: 'Iqhawe',
    description: 'Hero worker - 25+ completed jobs',
    icon: '🏆',
    requirement: '25+ jobs'
  },
  {
    id: 'ubuntu-master',
    name: 'Ubuntu Master',
    nameZulu: 'Ubuntu Master',
    description: 'Master of community trust - 10+ jobs, 4.8+ rating',
    icon: '👑',
    requirement: '10+ jobs, 4.8+ rating'
  }
];

/**
 * Check which badges a worker has earned
 * Siyabonga! Celebrating achievements 🎉
 */
export function getEarnedBadges(
  totalJobs: number,
  avgRating: number
): string[] {
  const earned: string[] = [];

  // Ubaba Reliable: 5+ jobs, rating >= 4.5
  if (totalJobs >= 5 && avgRating >= 4.5) {
    earned.push('ubaba-reliable');
  }

  // Isisebenzi Esihle: 10+ jobs
  if (totalJobs >= 10) {
    earned.push('isisebenzi-esihle');
  }

  // Iqhawe: 25+ jobs
  if (totalJobs >= 25) {
    earned.push('iqhawe');
  }

  // Ubuntu Master: 10+ jobs, rating >= 4.8
  if (totalJobs >= 10 && avgRating >= 4.8) {
    earned.push('ubuntu-master');
  }

  return earned;
}

/**
 * Infer skills from job title and description
 * AI-powered skill detection 🧠
 */
const SKILL_MAP: Record<string, string> = {
  plumb: 'Plumbing',
  pipe: 'Plumbing',
  tap: 'Plumbing',
  drain: 'Plumbing',
  electric: 'Electrical',
  wire: 'Electrical',
  light: 'Electrical',
  power: 'Electrical',
  paint: 'Painting',
  wall: 'Painting',
  roof: 'Roofing',
  tile: 'Tiling',
  floor: 'Tiling',
  brick: 'Bricklaying',
  weld: 'Welding',
  metal: 'Welding',
  carpenter: 'Carpentry',
  wood: 'Carpentry',
  furniture: 'Carpentry',
  fence: 'Fencing',
  gate: 'Fencing',
  build: 'Building',
  construct: 'Building',
  security: 'Security Installation',
  alarm: 'Security Installation',
  camera: 'Security Installation'
};

export function inferSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const skills = new Set<string>();

  Object.entries(SKILL_MAP).forEach(([keyword, skill]) => {
    if (lower.includes(keyword)) {
      skills.add(skill);
    }
  });

  return Array.from(skills);
}

/**
 * Validate GPS coordinates are within KZN bounds
 * Making sure work is local to KwaZulu-Natal 📍
 */
const KZN_BOUNDS = {
  lat: { min: -30.5, max: -28.5 },
  lon: { min: 29.0, max: 31.5 }
};

export function isValidKZNLocation(lat: number, lon: number): boolean {
  return (
    lat >= KZN_BOUNDS.lat.min &&
    lat <= KZN_BOUNDS.lat.max &&
    lon >= KZN_BOUNDS.lon.min &&
    lon <= KZN_BOUNDS.lon.max
  );
}

/**
 * Calculate average rating from projects
 */
export function calculateAverageRating(projects: ResumeProject[]): number {
  const ratedProjects = projects.filter(p => p.rating && p.rating > 0);
  if (ratedProjects.length === 0) return 0;

  const sum = ratedProjects.reduce((acc, p) => acc + (p.rating || 0), 0);
  return Math.round((sum / ratedProjects.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Count total proof photos across all projects
 */
export function countProofPhotos(projects: ResumeProject[]): number {
  return projects.reduce((acc, p) => acc + p.proofPhotos.length, 0);
}

/**
 * Extract unique skills from all projects
 */
export function extractUniqueSkills(projects: ResumeProject[]): string[] {
  const skills = new Set<string>();
  projects.forEach(p => {
    p.skills.forEach(s => skills.add(s));
  });
  return Array.from(skills);
}

/**
 * Helper: Add completed job to worker's résumé
 * Called from jobs.router when job is completed
 */
export async function addJobToResume(
  workerId: string,
  jobData: {
    jobId: string;
    title: string;
    description: string;
    location?: string;
    rating?: number;
    proofPhotos?: string[];
    gpsCoords?: { lat: number; lon: number };
  }
): Promise<WorkerResume> {
  const { getItem, putItem } = await import('./db.js');

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
  const inferredSkills = inferSkills(`${jobData.title} ${jobData.description}`);

  // Create project entry
  const project: ResumeProject = {
    jobId: jobData.jobId,
    title: jobData.title,
    description: jobData.description,
    location: jobData.location || '',
    completedAt: new Date().toISOString(),
    rating: jobData.rating,
    proofPhotos: jobData.proofPhotos || [],
    gpsCoords: jobData.gpsCoords,
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

  return resume;
}
