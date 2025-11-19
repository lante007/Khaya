/**
 * Worker Resume Page
 * Public-facing résumé page showing worker's verified work history
 * Ubuntu principle: Transparent trust through verified achievements
 */

import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ResumeTimeline from "@/components/ResumeTimeline";
import StrengthMeter from "@/components/StrengthMeter";
import TrustBadgesDisplay from "@/components/TrustBadgesDisplay";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { MapPin, Briefcase, Award, Share2, Download } from "lucide-react";
import { toast } from "sonner";

export default function WorkerResume() {
  const [, params] = useRoute("/workers/:id/resume");
  const [, setLocation] = useLocation();
  const workerId = params?.id || "";

  const { data: resume, isLoading, error } = trpc.resume.getWorkerResume.useQuery(
    { workerId },
    { enabled: !!workerId }
  );

  const { data: profile } = trpc.user.getProfile.useQuery(
    { userId: workerId },
    { enabled: !!workerId }
  );

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Resume link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleDownload = () => {
    toast.info("PDF download coming soon!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="container py-8 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading résumé...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="container py-8 max-w-6xl">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Résumé not found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setLocation("/workers")}
              >
                Browse Workers
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <div className="container py-8 max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Worker Résumé</h1>
            <p className="text-muted-foreground">
              Verified work history and achievements
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Worker Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {profile?.profilePictureUrl ? (
                  <img
                    src={profile.profilePictureUrl}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl">
                    {profile?.name?.[0] || "W"}
                  </div>
                )}
                <div>
                  <CardTitle className="text-2xl">{profile?.name || "Worker"}</CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                    <Briefcase className="w-4 h-4" />
                    {profile?.trades?.join(", ") || "General Worker"}
                  </div>
                  {profile?.location && (
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </div>
                  )}
                </div>
              </div>
              {profile?.verified && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <Award className="w-4 h-4 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </CardHeader>
          {profile?.bio && (
            <CardContent>
              <p className="text-muted-foreground">{profile.bio}</p>
            </CardContent>
          )}
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Metrics */}
          <div className="lg:col-span-1 space-y-6">
            {/* Strength Meter */}
            <StrengthMeter
              strength={resume.strength}
              tier={resume.tier}
              totalJobs={resume.totalJobs}
              avgRating={resume.avgRating}
            />

            {/* Trust Badges */}
            <TrustBadgesDisplay badges={resume.badges} />

            {/* Skills */}
            {resume.skills && resume.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Timeline */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Work History</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {resume.totalJobs} completed {resume.totalJobs === 1 ? "job" : "jobs"}
                </p>
              </CardHeader>
              <CardContent>
                <ResumeTimeline projects={resume.projects} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Info */}
        <Card className="bg-muted/50">
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground text-center">
              Last updated: {new Date(resume.updatedAt).toLocaleDateString("en-ZA", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
