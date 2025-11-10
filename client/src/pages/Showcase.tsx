import { useParams } from "wouter";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import TrustBadge from "@/components/TrustBadge";
import { MapPin, Star, Briefcase, Award, Share2 } from "lucide-react";
import { toast } from "sonner";

export default function Showcase() {
  const { userId } = useParams();
  const { data: profile, isLoading } = trpc.profile.get.useQuery({ userId: parseInt(userId!) });
  // Reviews will be added when backend endpoint is ready
  const reviews: any[] = [];

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Profile link copied!");
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center">Profile not found</div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="container py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                {profile.photoUrl && (
                  <img src={profile.photoUrl} alt={profile.userId.toString()} className="w-24 h-24 rounded-full object-cover" />
                )}
                <div>
                  <CardTitle className="text-3xl mb-2">{profile.trade || "Worker"}</CardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </div>
                  <TrustBadge verified={profile.verified} trustScore={profile.trustScore || 0} completedJobs={profile.completedJobs} />
                </div>
              </div>
              <Button onClick={handleShare} variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{profile.bio || "No bio provided"}</p>
              </div>
              {profile.yearsExperience && (
                <div>
                  <h3 className="font-semibold mb-2">Experience</h3>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    {profile.yearsExperience} years
                  </div>
                </div>
              )}
              {profile.certifications && (
                <div>
                  <h3 className="font-semibold mb-2">Certifications</h3>
                  <p className="text-muted-foreground">{profile.certifications}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}