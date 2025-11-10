interface SocialProofProps {
  count: number;
  type: "hires" | "reviews" | "locals" | "jobs";
  className?: string;
}

export default function SocialProof({ count, type, className = "" }: SocialProofProps) {
  const messages = {
    hires: `Trusted by ${count} locals`,
    reviews: `${count} positive reviews`,
    locals: `Join ${count}+ community members`,
    jobs: `${count} successful projects`,
  };
  
  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <div className="flex -space-x-2">
        {[...Array(Math.min(3, count))].map((_, i) => (
          <div key={i} className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-semibold">
            {i + 1}
          </div>
        ))}
      </div>
      <span>{messages[type]}</span>
    </div>
  );
}