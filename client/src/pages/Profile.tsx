import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { ProfileCompletionBadge, calculateProfileCompletion } from "@/components/ProfileCompletionBadge";
import { ProfileNudge } from "@/components/ProfileNudge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { FileText } from "lucide-react";

const TRADES = [
  "Electrician",
  "Plumber",
  "Builder",
  "Bricklayer",
  "Tiler",
  "Carpenter",
  "Painter",
  "Welder",
  "Roofer",
  "Architect / Draughtsman",
  "Land Surveyor",
  "Security Installer",
  "General Handyman"
];

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: profile, refetch: refetchProfile } = trpc.user.getProfile.useQuery();
  const updateProfile = trpc.user.updateProfile.useMutation();
  const [bio, setBio] = useState("");
  const [trades, setTrades] = useState<string[]>([]);
  const [locationState, setLocationState] = useState("");
  const [languages, setLanguages] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setTrades(profile.trades || profile.skills || []);
      setLocationState(profile.location || "");
      setLanguages(profile.languages || "");
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
    location: locationState,
    skills: trades,
    verified: user?.verified
  });
  
  const handleSave = () => {
    updateProfile.mutate({
      bio, 
      location: locationState,
      languages: languages || undefined,
      trades: trades.length > 0 ? trades : undefined,
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">My Profile</h1>
          {user?.userId && (
            <Button
              variant="outline"
              onClick={() => setLocation(`/workers/${user.userId}/resume`)}
            >
              <FileText className="h-4 w-4 mr-2" />
              View My Résumé
            </Button>
          )}
        </div>

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
                  value={locationState}
                  onChange={(e) => setLocationState(e.target.value)}
                  placeholder="e.g., Estcourt"
                />
              </div>
              {user?.role === "worker" && (
                <div>
                  <Label className="mb-3 block">Your Skills (select all that apply)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {TRADES.map((trade) => (
                      <div key={trade} className="flex items-center space-x-2">
                        <Checkbox
                          id={`profile-${trade}`}
                          checked={trades.includes(trade)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setTrades([...trades, trade]);
                            } else {
                              setTrades(trades.filter(t => t !== trade));
                            }
                          }}
                        />
                        <label
                          htmlFor={`profile-${trade}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {trade}
                        </label>
                      </div>
                    ))}
                  </div>
                  {trades.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                      <span className="text-sm text-muted-foreground">Selected:</span>
                      {trades.map((trade) => (
                        <Badge key={trade} variant="secondary" className="gap-1">
                          {trade}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => setTrades(trades.filter(t => t !== trade))}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <Label>Languages Spoken</Label>
                <Input
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="e.g., English, Zulu, Afrikaans"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Separate multiple languages with commas
                </p>
              </div>
              
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