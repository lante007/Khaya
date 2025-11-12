import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Avatar } from './Avatar';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null;
  userName?: string;
  onUploadComplete?: (imageUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Profile Picture Upload Component
 * Handles image selection, preview, upload to S3, and profile update
 */
export function ProfilePictureUpload({
  currentImageUrl,
  userName,
  onUploadComplete,
  size = 'lg',
  className
}: ProfilePictureUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUploadUrlMutation = trpc.user.getUploadUrl.useMutation();
  const updateProfileMutation = trpc.user.updateProfile.useMutation();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Auto-upload
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      // Step 1: Get presigned upload URL from backend
      const { uploadUrl, fileUrl } = await getUploadUrlMutation.mutateAsync({
        fileType: 'avatar',
        contentType: file.type
      });

      // Step 2: Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      // Step 3: Update user profile with new image URL
      await updateProfileMutation.mutateAsync({
        profilePictureUrl: fileUrl
      });

      // Step 4: Notify parent component
      onUploadComplete?.(fileUrl);

      setPreview(null);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePreview = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayImage = preview || currentImageUrl;

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Avatar with upload overlay */}
      <div className="relative group">
        <Avatar
          src={displayImage}
          name={userName}
          size={size === 'sm' ? 'lg' : size === 'md' ? 'xl' : 'xl'}
          showBorder
        />

        {/* Upload overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            'absolute inset-0 rounded-full bg-black/50 flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'disabled:cursor-not-allowed',
            isUploading && 'opacity-100'
          )}
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Remove preview button */}
        {preview && !isUploading && (
          <button
            onClick={handleRemovePreview}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Upload button (alternative to clicking avatar) */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="gap-2"
      >
        <Upload size={16} />
        {currentImageUrl ? 'Change Photo' : 'Upload Photo'}
      </Button>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 text-center max-w-xs">
          {error}
        </p>
      )}

      {/* Upload status */}
      {isUploading && (
        <p className="text-sm text-muted-foreground">
          Uploading your photo...
        </p>
      )}

      {/* Helper text */}
      {!isUploading && !error && (
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          JPG, PNG or WebP. Max 5MB.
        </p>
      )}
    </div>
  );
}
