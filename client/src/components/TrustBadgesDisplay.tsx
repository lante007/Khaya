/**
 * Trust Badges Display Component
 * Shows Ubuntu-inspired trust badges earned by workers
 * Zulu names reflect community values
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Shield, Star, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBadge {
  id: string;
  name: string;
  nameZulu: string;
  description: string;
  icon: string;
}

interface TrustBadgesDisplayProps {
  badges: string[];
  allBadges?: TrustBadge[];
  className?: string;
  compact?: boolean;
}

// Default badge definitions (matches backend)
const DEFAULT_BADGES: TrustBadge[] = [
  {
    id: "ubaba-reliable",
    name: "Reliable Father",
    nameZulu: "Ubaba Othembekile",
    description: "5+ jobs completed with 4.5+ rating",
    icon: "shield"
  },
  {
    id: "good-worker",
    name: "Good Worker",
    nameZulu: "Isisebenzi Esihle",
    description: "10+ jobs completed",
    icon: "star"
  },
  {
    id: "hero",
    name: "Hero",
    nameZulu: "Iqhawe",
    description: "25+ jobs completed",
    icon: "trophy"
  },
  {
    id: "ubuntu-master",
    name: "Ubuntu Master",
    nameZulu: "Ubuntu Master",
    description: "10+ jobs with 4.8+ rating",
    icon: "award"
  }
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  star: Star,
  trophy: Trophy,
  award: Award
};

const badgeColors: Record<string, string> = {
  "ubaba-reliable": "bg-blue-100 text-blue-700 border-blue-200",
  "good-worker": "bg-green-100 text-green-700 border-green-200",
  "hero": "bg-purple-100 text-purple-700 border-purple-200",
  "ubuntu-master": "bg-yellow-100 text-yellow-700 border-yellow-200"
};

export default function TrustBadgesDisplay({
  badges,
  allBadges = DEFAULT_BADGES,
  className,
  compact = false
}: TrustBadgesDisplayProps) {
  const earnedBadges = allBadges.filter(badge => badges.includes(badge.id));

  if (earnedBadges.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No badges earned yet. Complete jobs to earn trust badges!</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {earnedBadges.map((badge) => {
          const Icon = iconMap[badge.icon] || Award;
          const colorClass = badgeColors[badge.id] || "bg-gray-100 text-gray-700 border-gray-200";

          return (
            <Badge
              key={badge.id}
              variant="outline"
              className={cn(colorClass, "px-3 py-1")}
              title={`${badge.nameZulu} - ${badge.description}`}
            >
              <Icon className="h-3 w-3 mr-1" />
              {badge.nameZulu}
            </Badge>
          );
        })}
      </div>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Trust Badges ({earnedBadges.length})
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {earnedBadges.map((badge) => {
            const Icon = iconMap[badge.icon] || Award;
            const colorClass = badgeColors[badge.id] || "bg-gray-100 text-gray-700 border-gray-200";

            return (
              <div
                key={badge.id}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all hover:shadow-md",
                  colorClass
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold">{badge.nameZulu}</h4>
                    <p className="text-sm opacity-90">{badge.name}</p>
                    <p className="text-xs opacity-75">{badge.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show locked badges */}
        {badges.length < allBadges.length && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Locked Badges ({allBadges.length - badges.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allBadges
                .filter(badge => !badges.includes(badge.id))
                .map((badge) => {
                  const Icon = iconMap[badge.icon] || Award;

                  return (
                    <div
                      key={badge.id}
                      className="p-3 rounded-lg border border-dashed bg-muted/50 opacity-60"
                    >
                      <div className="flex items-start gap-2">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                        <div className="flex-1 space-y-1">
                          <h5 className="text-sm font-medium text-muted-foreground">
                            {badge.nameZulu}
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            {badge.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
