import { useState } from 'react';
import { X, Camera, FileText, MapPin, Award } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface ProfileNudgeProps {
  type: 'profile-picture' | 'bio' | 'location' | 'skills';
  onAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const nudgeConfig = {
  'profile-picture': {
    icon: Camera,
    title: 'Add a profile picture',
    description: 'Users with photos get 3x more responses. Show your face and build trust!',
    actionText: 'Upload Photo',
    color: 'blue'
  },
  'bio': {
    icon: FileText,
    title: 'Tell us about yourself',
    description: 'A good bio helps clients understand your experience and expertise.',
    actionText: 'Add Bio',
    color: 'purple'
  },
  'location': {
    icon: MapPin,
    title: 'Add your location',
    description: 'Help clients find local workers. Location increases your visibility.',
    actionText: 'Set Location',
    color: 'green'
  },
  'skills': {
    icon: Award,
    title: 'List your skills',
    description: 'Showcase what you can do. Skills help you appear in relevant searches.',
    actionText: 'Add Skills',
    color: 'orange'
  }
};

/**
 * Profile Nudge Component
 * Gentle, dismissible prompts to encourage profile completion
 * Uses localStorage to track dismissed nudges
 */
export function ProfileNudge({
  type,
  onAction,
  onDismiss,
  className
}: ProfileNudgeProps) {
  const [isDismissed, setIsDismissed] = useState(() => {
    // Check if user has dismissed this nudge before
    const dismissed = localStorage.getItem(`nudge-dismissed-${type}`);
    return dismissed === 'true';
  });

  const config = nudgeConfig[type];
  const Icon = config.icon;

  const handleDismiss = () => {
    localStorage.setItem(`nudge-dismissed-${type}`, 'true');
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20 p-4',
        className
      )}
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>

      <div className="flex gap-4">
        {/* Icon */}
        <div className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          'bg-primary/10'
        )}>
          <Icon className="w-5 h-5 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2 pr-6">
          <h4 className="font-semibold text-sm text-gray-900">
            {config.title}
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            {config.description}
          </p>

          {/* Action button */}
          {onAction && (
            <Button
              size="sm"
              onClick={onAction}
              className="mt-2"
            >
              {config.actionText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Reset all dismissed nudges (useful for testing or user preference)
 */
export function resetAllNudges() {
  const types: ProfileNudgeProps['type'][] = ['profile-picture', 'bio', 'location', 'skills'];
  types.forEach(type => {
    localStorage.removeItem(`nudge-dismissed-${type}`);
  });
}
