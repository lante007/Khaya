import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';

interface ProfileCompletionBadgeProps {
  percentage: number;
  variant?: 'inline' | 'card';
  showDetails?: boolean;
  missingFields?: string[];
  className?: string;
}

/**
 * Profile Completion Badge
 * Shows user's profile completion percentage with visual indicator
 * Encourages users to complete their profile for better trust
 */
export function ProfileCompletionBadge({
  percentage,
  variant = 'inline',
  showDetails = false,
  missingFields = [],
  className
}: ProfileCompletionBadgeProps) {
  const isComplete = percentage === 100;
  const isAlmostComplete = percentage >= 80;

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {isComplete ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : (
          <AlertCircle className="w-4 h-4 text-amber-600" />
        )}
        <span className="text-sm font-medium">
          {percentage}% Complete
        </span>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg border p-4 space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Profile Completion</h3>
        <span className={cn(
          'text-sm font-bold',
          isComplete ? 'text-green-600' : isAlmostComplete ? 'text-amber-600' : 'text-gray-600'
        )}>
          {percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <Progress value={percentage} className="h-2" />

      {/* Message */}
      {!isComplete && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {isAlmostComplete
              ? 'Almost there! Complete your profile to build trust.'
              : 'Complete your profile to increase your chances of getting hired.'}
          </p>

          {/* Missing fields */}
          {showDetails && missingFields.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-700">Still needed:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {missingFields.map((field) => (
                  <li key={field} className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    {field}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Complete message */}
      {isComplete && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          <p className="text-xs font-medium">
            Your profile is complete! 🎉
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Calculate profile completion percentage
 */
export function calculateProfileCompletion(user: {
  name?: string;
  email?: string;
  phone?: string;
  profilePictureUrl?: string | null;
  bio?: string;
  location?: string;
  skills?: string[];
  hourlyRate?: number;
  verified?: boolean;
}): { percentage: number; missingFields: string[] } {
  const fields = [
    { key: 'name', label: 'Full name', value: user.name },
    { key: 'email', label: 'Email address', value: user.email },
    { key: 'phone', label: 'Phone number', value: user.phone },
    { key: 'profilePictureUrl', label: 'Profile picture', value: user.profilePictureUrl },
    { key: 'bio', label: 'Bio/Description', value: user.bio },
    { key: 'location', label: 'Location', value: user.location },
    { key: 'skills', label: 'Skills', value: user.skills?.length ? user.skills : null },
    { key: 'verified', label: 'Phone verification', value: user.verified }
  ];

  const completedFields = fields.filter(field => {
    if (Array.isArray(field.value)) {
      return field.value.length > 0;
    }
    return field.value !== null && field.value !== undefined && field.value !== '';
  });

  const percentage = Math.round((completedFields.length / fields.length) * 100);
  const missingFields = fields
    .filter(field => !completedFields.includes(field))
    .map(field => field.label);

  return { percentage, missingFields };
}
