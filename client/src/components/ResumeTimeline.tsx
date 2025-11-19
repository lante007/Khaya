/**
 * Resume Timeline Component
 * Displays worker's completed jobs in chronological order
 * Ubuntu principle: Showcasing verified work history
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Calendar, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ResumeProject {
  jobId: string;
  title: string;
  description: string;
  location: string;
  completedAt: string;
  rating?: number;
  proofPhotos: string[];
  skills: string[];
}

interface ResumeTimelineProps {
  projects: ResumeProject[];
  className?: string;
}

export default function ResumeTimeline({ projects, className }: ResumeTimelineProps) {
  if (!projects || projects.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>No completed jobs yet. Start building your résumé!</p>
        </CardContent>
      </Card>
    );
  }

  // Sort by completion date (newest first)
  const sortedProjects = [...projects].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  return (
    <div className={cn("space-y-6", className)}>
      {sortedProjects.map((project, index) => (
        <Card key={project.jobId} className="relative overflow-hidden">
          {/* Timeline connector */}
          {index < sortedProjects.length - 1 && (
            <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-border -mb-6" />
          )}

          <CardHeader className="relative">
            <div className="flex items-start gap-4">
              {/* Timeline dot */}
              <div className="relative flex-shrink-0">
                <div className="w-4 h-4 rounded-full bg-primary border-4 border-background ring-2 ring-border" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  
                  {/* Rating */}
                  {project.rating && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                      {project.rating.toFixed(1)}
                    </Badge>
                  )}
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(project.completedAt), "MMMM d, yyyy")}
                </div>

                {/* Location */}
                {project.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {project.location}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pl-12 space-y-4">
            {/* Description */}
            <p className="text-sm text-muted-foreground">{project.description}</p>

            {/* Skills */}
            {project.skills && project.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}

            {/* Proof Photos */}
            {project.proofPhotos && project.proofPhotos.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ImageIcon className="h-4 w-4" />
                  Proof of Work ({project.proofPhotos.length})
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {project.proofPhotos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-lg overflow-hidden bg-muted border"
                    >
                      <img
                        src={photo}
                        alt={`${project.title} - proof ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
