import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Briefcase, Package, Shield, Star, Users, CheckCircle, 
  MapPin, TrendingUp, Award, MessageCircle 
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 md:py-24">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Connect with Trusted Local Workers & Suppliers
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Building your home in small towns just got easier. Find verified workers, 
              quality materials, and reliable suppliers all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/workers">
                <Button size="lg" className="text-lg px-8 py-6">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Find Workers
                </Button>
              </Link>
              <Link href="/materials">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  <Package className="w-5 h-5 mr-2" />
                  Browse Materials
                </Button>
              </Link>
            </div>
            <div className="mt-6">
              <Link href="/provider/onboard">
                <Button variant="link" className="text-base">
                  <Users className="w-4 h-4 mr-2" />
                  Are you a worker or supplier? Join as a Provider →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose Khaya?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We make it easy and safe to find the right people and materials for your project
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <Shield className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Verified Workers</CardTitle>
                <CardDescription>
                  All workers are verified with certifications and reviews from real customers
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <Star className="w-12 h-12 text-accent mb-4" />
                <CardTitle>Trust Scores</CardTitle>
                <CardDescription>
                  See ratings and reviews to make informed decisions about who to hire
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <MapPin className="w-12 h-12 text-secondary mb-4" />
                <CardTitle>Local Focus</CardTitle>
                <CardDescription>
                  Find workers and suppliers right in your area for faster, better service
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <TrendingUp className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Competitive Bidding</CardTitle>
                <CardDescription>
                  Post your job and receive multiple quotes to get the best value
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <Package className="w-12 h-12 text-accent mb-4" />
                <CardTitle>Quality Materials</CardTitle>
                <CardDescription>
                  Browse verified suppliers with transparent pricing and stock availability
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <MessageCircle className="w-12 h-12 text-secondary mb-4" />
                <CardTitle>Direct Communication</CardTitle>
                <CardDescription>
                  Message workers and suppliers directly to discuss your project needs
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Post Your Job</h3>
              <p className="text-muted-foreground">
                Describe what you need - whether it's a plumber, electrician, or building materials
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Review Bids</h3>
              <p className="text-muted-foreground">
                Receive quotes from verified workers, check their ratings and past work
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Hire & Complete</h3>
              <p className="text-muted-foreground">
                Choose the best bid, track progress, and leave a review when done
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Project?
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join hundreds of homeowners and workers building better communities together
          </p>
          {isAuthenticated ? (
            <Link href="/post-job">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Post Your First Job
              </Button>
            </Link>
          ) : (
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" asChild>
              <a href={getLoginUrl()}>Get Started Free</a>
            </Button>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
