import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { LucideIcon } from "lucide-react";

interface UserTypeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonLink?: string;
  variant?: "default" | "secondary" | "accent";
}

export const UserTypeCard = ({
  icon: Icon,
  title,
  description,
  features,
  buttonText,
  buttonLink = "/",
  variant = "default",
}: UserTypeCardProps) => {
  const variantStyles = {
    default: "border-primary/20 hover:border-primary/40",
    secondary: "border-secondary/20 hover:border-secondary/40",
    accent: "border-accent/20 hover:border-accent/40",
  };

  return (
    <Card className={`p-8 shadow-card hover:shadow-warm transition-all duration-300 hover:scale-[1.02] border-2 ${variantStyles[variant]}`}>
      <div className="mb-6">
        <div className="inline-flex p-4 rounded-2xl bg-gradient-earth mb-4">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <div className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
            <span className="text-sm text-foreground/80">{feature}</span>
          </li>
        ))}
      </ul>

      <Link to={buttonLink}>
        <Button variant={variant === "secondary" ? "secondary" : "default"} className="w-full">
          {buttonText}
        </Button>
      </Link>
    </Card>
  );
};
