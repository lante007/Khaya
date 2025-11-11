import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Home as HomeIcon, Hammer, Package, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export const ServiceCards = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30" aria-labelledby="who-we-serve">
      <div className="container">
        <div className="text-center mb-16">
          <h2 id="who-we-serve" className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            A Marketplace for Everyone
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you need help, offer services, or supply materials – Project Khaya connects you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-elegant group">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <HomeIcon className="w-8 h-8 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">Homeowners</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Post any job – from building a new home to fixing a broken door. Get multiple bids and choose the best.
              </p>
              <ul className="text-left space-y-2 text-sm text-foreground mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Post jobs for free</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Compare competitive bids</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Hire verified professionals</span>
                </li>
              </ul>
              <Link to="/auth?role=buyer&mode=signup" className="w-full">
                <Button className="w-full group" aria-label="Get free bids for your project">
                  <span className="flex items-center gap-2">
                    Get Free Bids
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-elegant group">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Hammer className="w-8 h-8 text-secondary" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">Skilled Workers</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Find jobs that match your skills. Bid on projects, showcase your work, and grow your business.
              </p>
              <ul className="text-left space-y-2 text-sm text-foreground mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Browse and bid on jobs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Build your portfolio</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Get paid securely</span>
                </li>
              </ul>
              <Link to="/auth?role=worker&mode=signup" className="w-full">
                <Button variant="secondary" className="w-full group" aria-label="Start earning with Project Khaya">
                  <span className="flex items-center gap-2">
                    Start Earning Today
                    <TrendingUp className="w-4 h-4" aria-hidden="true" />
                  </span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-elegant group">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Package className="w-8 h-8 text-accent" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">Material Suppliers</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                List your products, bid on supply contracts, and reach customers actively looking for materials.
              </p>
              <ul className="text-left space-y-2 text-sm text-foreground mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>List products & bid on jobs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Reach active buyers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Fast, secure payments</span>
                </li>
              </ul>
              <Link to="/auth?role=seller&mode=signup" className="w-full">
                <Button variant="secondary" className="w-full group" aria-label="Join as a material supplier">
                  <span className="flex items-center gap-2">
                    Join as Supplier
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
