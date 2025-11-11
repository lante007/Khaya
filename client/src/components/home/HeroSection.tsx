import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, TrendingUp, Star, Clock } from "lucide-react";
import { Link } from "wouter";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden" role="banner">
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-bg.jpg"
          alt="Vibrant KZN home construction and renovation scene"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/40"></div>
      </div>

      <div className="container relative z-10 text-white px-4">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-primary/20 backdrop-blur-sm rounded-full border border-primary/30 animate-fade-in">
            <Zap className="w-4 h-4 text-accent" aria-hidden="true" />
            <p className="text-sm font-medium">🏡 Building Community, One Khaya at a Time</p>
          </div>
         
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-fade-in">
            From Big Builds to <span className="text-primary">Small Fixes</span>
          </h1>
         
          <p className="text-lg sm:text-xl md:text-2xl mb-4 text-gray-200 leading-relaxed animate-fade-in">
            Post your job, get competitive bids from verified tradespeople and suppliers, and hire with confidence. Whether you're building, renovating, or fixing that leaky tap.
          </p>

          <div className="flex items-center gap-4 mb-6 text-sm md:text-base flex-wrap animate-fade-in">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-accent text-accent" aria-hidden="true" />
              ))}
              <span className="ml-2 font-semibold">4.8/5</span>
            </div>
            <span className="text-gray-300">|</span>
            <span className="font-semibold">1500+ Jobs Completed in KZN</span>
          </div>

          <div className="bg-primary/20 backdrop-blur-sm rounded-lg p-4 border border-primary/30 mb-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" aria-hidden="true" />
              <p className="text-sm font-medium">
                <span className="text-primary font-bold">10+ homeowners</span> posted jobs in the last 24 hours
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-fade-in">
            <Link to="/auth?role=buyer&mode=signup">
              <Button
                size="lg"
                className="text-lg px-8 py-6 shadow-glow hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105 group relative overflow-hidden"
                aria-label="Post a job for free"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Post a Job (Free)
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </span>
              </Button>
            </Link>
            <Link to="/auth?role=worker&mode=signup">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2 bg-transparent hover:bg-white hover:text-foreground transition-all duration-300 relative group"
                aria-label="Find jobs and start earning"
              >
                <span className="flex items-center gap-2">
                  Find Jobs & Earn
                  <TrendingUp className="w-4 h-4" aria-hidden="true" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
