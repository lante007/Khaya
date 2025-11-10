import { Badge } from "@/components/ui/badge";
import { Award, Shield, Star, CheckCircle } from "lucide-react";

interface TrustBadgeProps {
  verified?: boolean;
  trustScore?: number;
  completedJobs?: number;
  size?: "sm" | "md" | "lg";
}

export default function TrustBadge({ verified, trustScore, completedJobs, size = "md" }: TrustBadgeProps) {
  const iconSize = size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5";
  const textSize = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base";
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {verified && (
        <Badge className="bg-success/10 text-success border-success/20">
          <Award className={`${iconSize} mr-1`} />
          Verified
        </Badge>
      )}
      {trustScore !== undefined && trustScore > 70 && (
        <Badge variant="outline" className="border-primary/30">
          <Shield className={`${iconSize} mr-1`} />
          Trusted
        </Badge>
      )}
      {completedJobs !== undefined && completedJobs > 5 && (
        <Badge variant="outline" className="border-accent/30">
          <CheckCircle className={`${iconSize} mr-1`} />
          {completedJobs}+ Jobs
        </Badge>
      )}
    </div>
  );
}