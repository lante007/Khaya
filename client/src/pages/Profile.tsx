import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { ProfileCompletionBadge, calculateProfileCompletion } from "@/components/ProfileCompletionBadge";
import { ProfileNudge } from "@/components/ProfileNudge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = trpc.user.getProfile.useQuery();
  const updateProfile = trpc.user.updateProfile.useMutation();
  const [bio, setBio] = useState("");
  const [trade, setTrade] = useState("");
  const [location, setLocation] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setTrade(profile.skills?.[0] || "");
      setLocation(profile.location || "");
      setProfilePictureUrl(profile.profilePictureUrl || null);
    }
  }, [profile]);

  // Calculate profile completion
  const completion = calculateProfileCompletion({
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
    profilePictureUrl: profilePictureUrl,
    bio: bio,
    location: location,
    skills: trade ? [trade] : [],
    verified: user?.verified
  });
  
  const handleSave = () => {
    updateProfile.mutate({
      bio, 
      location, 
      skills: trade ? [trade] : undefined,
    }, {
      onSuccess: () => {
        toast.success("Profile updated!");
        refetchProfile();
      },
      onError: () => toast.error("Failed to update profile"),
    });
  };
  

  
  const handleProfilePictureUpload = (imageUrl: string) => {
    setProfilePictureUrl(imageUrl);
    refetchProfile();
    toast.success("Profile picture updated!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="container py-8 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">My Profile</h1>

        {/* Profile Completion Card */}
        <ProfileCompletionBadge
          percentage={completion.percentage}
          variant="card"
          showDetails
          missingFields={completion.missingFields}
          className="mb-6"
        />

        {/* Profile Picture Nudge */}
        {!profilePictureUrl && (
          <ProfileNudge
            type="profile-picture"
            className="mb-6"
          />
        )}

        {/* Profile Picture Upload Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ProfilePictureUpload
              currentImageUrl={profilePictureUrl}
              userName={user?.name}
              onUploadComplete={handleProfilePictureUpload}
              size="lg"
            />
          </CardContent>
        </Card>

        {/* Account Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={user?.name || ""} disabled />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={user?.phone || ""} disabled />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={user?.role || ""} disabled className="capitalize" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio Nudge */}
        {!bio && (
          <ProfileNudge
            type="bio"
            className="mb-6"
          />
        )}

        {/* Profile Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Bio</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Estcourt"
                />
              </div>
              {user?.role === "worker" && (
                <div>
                  <Label>Trade/Skill</Label>
                  <Input
                    value={trade}
                    onChange={(e) => setTrade(e.target.value)}
                    placeholder="e.g., Plumber, Electrician"
                  />
                </div>
              )}
              <Button onClick={handleSave} disabled={updateProfile.isPending}>
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}