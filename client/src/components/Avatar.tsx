import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-16 h-16 text-2xl',
  xl: 'w-24 h-24 text-4xl'
};

const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 32,
  xl: 48
};

/**
 * Avatar component with fallback to initials or icon
 * Displays user profile picture or generates initials from name
 */
export function Avatar({ 
  src, 
  name, 
  size = 'md', 
  className,
  showBorder = false 
}: AvatarProps) {
  const getInitials = (name?: string): string => {
    if (!name) return '';
    
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10',
        sizeClasses[size],
        showBorder && 'ring-2 ring-white ring-offset-2',
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'User avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : initials ? (
        <span className="font-semibold text-primary select-none">
          {initials}
        </span>
      ) : (
        <User size={iconSizes[size]} className="text-primary/60" />
      )}
    </div>
  );
}
