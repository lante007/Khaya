import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Shield, Clock } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-primary via-secondary to-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'url(/home-repairs.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}></div>
      </div>
     
      <div className="container relative z-10 text-center px-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">Ready to Transform Your Space?</h2>
        <p className="text-lg sm:text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-95">
          Join thousands who've found the better way to handle home projects.
        </p>
       
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <CheckCircle className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">No Upfront Costs</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <Shield className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">Money-Back Guarantee</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <Clock className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">Cancel Anytime</span>
          </div>
        </div>
       
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-7 bg-background text-foreground hover:bg-background/90 shadow-glow hover:shadow-primary-glow/50 transition-all duration-300 transform hover:scale-105 font-bold group"
            aria-label="Start your project for free"
          >
            <span className="flex items-center gap-2">
              Start Your Project Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </span>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-7 border-2 bg-transparent hover:bg-background hover:text-foreground shadow-glow transition-all duration-300 transform hover:scale-105 font-bold"
            aria-label="Learn how Project Khaya works"
          >
            See How It Works
          </Button>
        </div>
       
        <p className="mt-6 text-sm opacity-90 flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4" aria-hidden="true" />
          Free to join • No hidden fees • Get started in 2 minutes
        </p>
      </div>
    </section>
  );
};
