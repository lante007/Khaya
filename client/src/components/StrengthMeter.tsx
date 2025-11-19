/**
 * Strength Meter Component
 * Visual representation of worker's résumé strength (0-100)
 * Ubuntu principle: Transparent trust scoring
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

interface StrengthMeterProps {
  strength: number;
  tier: Tier;
  totalJobs?: number;
  avgRating?: number;
  className?: string;
  showDetails?: boolean;
}

const tierConfig: Record<Tier, { color: string; bgColor: string; icon: string; label: string }> = {
  Bronze: {
    color: "text-orange-700",
    bgColor: "bg-orange-100 border-orange-200",
    icon: "🥉",
    label: "Bronze Tier"
  },
  Silver: {
    color: "text-gray-700",
    bgColor: "bg-gray-100 border-gray-200",
    icon: "🥈",
    label: "Silver Tier"
  },
  Gold: {
    color: "text-yellow-700",
    bgColor: "bg-yellow-100 border-yellow-200",
    icon: "🥇",
    label: "Gold Tier"
  },
  Platinum: {
    color: "text-purple-700",
    bgColor: "bg-purple-100 border-purple-200",
    icon: "💎",
    label: "Platinum Tier"
  }
};

const getStrengthLabel = (strength: number): string => {
  if (strength >= 90) return "Exceptional";
  if (strength >= 70) return "Strong";
  if (strength >= 40) return "Growing";
  if (strength >= 20) return "Building";
  return "Starting";
};

const getProgressColor = (strength: number): string => {
  if (strength >= 90) return "bg-purple-500";
  if (strength >= 70) return "bg-yellow-500";
  if (strength >= 40) return "bg-gray-500";
  return "bg-orange-500";
};

export default function StrengthMeter({
  strength,
  tier,
  totalJobs = 0,
  avgRating = 0,
  className,
  showDetails = true
}: StrengthMeterProps) {
  const config = tierConfig[tier];
  const strengthLabel = getStrengthLabel(strength);
  const progressColor = getProgressColor(strength);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Résumé Strength
          </CardTitle>
          <Badge variant="outline" className={cn(config.bgColor, config.color)}>
            {config.icon} {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Strength Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-3xl font-bold">{strength}/100</p>
              <p className="text-sm text-muted-foreground">{strengthLabel}</p>
            </div>
            <TrendingUp className={cn("h-8 w-8", config.color)} />
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={strength} className="h-3" indicatorClassName={progressColor} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>Bronze (40)</span>
              <span>Silver (70)</span>
              <span>Gold (90)</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Details */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Completed Jobs</p>
              <p className="text-2xl font-semibold">{totalJobs}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <div className="flex items-center gap-1">
                <p className="text-2xl font-semibold">{avgRating.toFixed(1)}</p>
                <Award className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </div>
        )}

        {/* Next Tier Info */}
        {strength < 100 && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {strength < 40 && (
                <>
                  <strong>{40 - strength} points</strong> to reach Silver tier
                </>
              )}
              {strength >= 40 && strength < 70 && (
                <>
                  <strong>{70 - strength} points</strong> to reach Gold tier
                </>
              )}
              {strength >= 70 && strength < 90 && (
                <>
                  <strong>{90 - strength} points</strong> to reach Platinum tier
                </>
              )}
              {strength >= 90 && (
                <>
                  You're in the top tier! Keep up the excellent work 🎉
                </>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
