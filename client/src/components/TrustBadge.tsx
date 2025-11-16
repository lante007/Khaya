import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  Star, 
  Zap, 
  Clock, 
  Briefcase, 
  UserPlus,
  LucideIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface TrustBadgeProps {
  badges?: BadgeData[];
  trustScore?: number;
  size?: "sm" | "md" | "lg";
  maxDisplay?: number;
}

const iconMap: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck,
  "star": Star,
  "zap": Zap,
  "clock": Clock,
  "briefcase": Briefcase,
  "user-plus": UserPlus,
};

const colorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  green: "bg-green-100 text-green-700 border-green-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  gray: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function TrustBadge({ badges = [], trustScore, size = "md", maxDisplay = 3 }: TrustBadgeProps) {
  const iconSize = size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5";
  const textSize = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base";
  
  const displayBadges = badges.slice(0, maxDisplay);
  const remaining = badges.length > maxDisplay ? badges.length - maxDisplay : 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Trust Score */}
      {trustScore !== undefined && trustScore > 0 && (
        <Badge 
          variant="outline" 
          className={cn(
            trustScore >= 80 ? "bg-green-50 text-green-700 border-green-200" :
            trustScore >= 60 ? "bg-blue-50 text-blue-700 border-blue-200" :
            trustScore >= 40 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
            "bg-gray-50 text-gray-700 border-gray-200"
          )}
        >
          <ShieldCheck className={cn(iconSize, "mr-1")} />
          {trustScore}
        </Badge>
      )}

      {/* Individual Badges */}
      {displayBadges.map((badge) => {
        const Icon = iconMap[badge.icon] || ShieldCheck;
        const colorClass = colorMap[badge.color] || colorMap.gray;
        
        return (
          <Badge
            key={badge.id}
            variant="outline"
            className={cn(colorClass)}
            title={badge.description}
          >
            <Icon className={cn(iconSize, "mr-1")} />
            {badge.name}
          </Badge>
        );
      })}

      {/* Remaining count */}
      {remaining > 0 && (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}