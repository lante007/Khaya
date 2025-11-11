import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Link } from "wouter";
import heroImage from "@/assets/hero-khaya.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Community construction in KZN" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="max-w-3xl">
          <div className="mb-6 inline-block rounded-full bg-secondary/20 backdrop-blur-sm px-4 py-2">
            <p className="text-sm font-medium text-primary-foreground">
              🏡 Building Community, One Khaya at a Time
            </p>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
            Your Trusted Construction Marketplace
          </h1>
          
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 leading-relaxed">
            Connect with verified suppliers and skilled workers in your community. 
            No more price surprises, no more ghosting. Just transparent, reliable service from Estcourt to all of KZN.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/materials">
              <Button size="lg" variant="hero" className="text-lg">
                <Search className="mr-2 h-5 w-5" />
                Find Materials & Services
              </Button>
            </Link>
            <Link to="/auth?role=buyer&mode=signup">
              <Button size="lg" variant="outline" className="text-lg bg-background/10 backdrop-blur-sm border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap gap-6 text-primary-foreground/80">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-medium">Verified Suppliers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-medium">Skilled Tradespeople</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-medium">Transparent Pricing</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
