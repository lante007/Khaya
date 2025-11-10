import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Search, MessageCircle, CheckCircle, Shield, Star, 
  Package, Briefcase, Home, TrendingUp 
} from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <div className="container py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How Project Khaya Works</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple, transparent, and built for small-town communities
          </p>
        </div>

        {/* For Homeowners */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Home className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold">For Homeowners & Buyers</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  1
                </div>
                <Search className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Search & Browse</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Find materials or skilled workers in your area. Filter by location, price, ratings, 
                  and availability. All suppliers and workers are verified.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  2
                </div>
                <MessageCircle className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Request Quotes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Post your project or request quotes directly. Get competitive bids from multiple 
                  workers. See transparent pricing with no hidden fees.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  3
                </div>
                <CheckCircle className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Hire & Complete</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Choose the best bid, track progress with milestones, and pay securely. Leave a 
                  review to help your community.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Link href="/post-job">
              <Button size="lg">Post Your First Project</Button>
            </Link>
          </div>
        </div>

        {/* For Suppliers */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Package className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold">For Suppliers & Vendors</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  1
                </div>
                <CardTitle>List Your Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Add your building materials with photos, pricing, and stock levels. Set your 
                  delivery radius and availability.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  2
                </div>
                <CardTitle>Receive Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get instant notifications when customers order. Confirm delivery times and 
                  coordinate directly with buyers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  3
                </div>
                <CardTitle>Get Paid Fast</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Receive payment after delivery confirmation. Build your reputation with customer 
                  reviews and grow your business.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Link href="/provider/onboard">
              <Button size="lg" variant="outline">List Your Products</Button>
            </Link>
          </div>
        </div>

        {/* For Service Providers */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Briefcase className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold">For Service Providers</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  1
                </div>
                <CardTitle>Create Your Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Showcase your skills, certifications, and past work. Upload photos of completed 
                  projects to build trust.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  2
                </div>
                <CardTitle>Bid on Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Browse jobs that match your skills. Submit competitive quotes with clear timelines. 
                  Stand out with your verified profile.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  3
                </div>
                <CardTitle>Complete & Earn</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Work on projects, get paid per milestone, and earn reviews. Build your reputation 
                  and grow your client base.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Link href="/provider/onboard">
              <Button size="lg">Join as Provider</Button>
            </Link>
          </div>
        </div>

        {/* Trust & Safety */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <CardTitle className="text-2xl">Built on Trust</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Star className="w-6 h-6 text-primary mb-2" />
                <h3 className="font-semibold mb-2">Verified Profiles</h3>
                <p className="text-sm text-muted-foreground">
                  All suppliers and workers are verified with ID, certifications, and past work history.
                </p>
              </div>
              <div>
                <TrendingUp className="w-6 h-6 text-primary mb-2" />
                <h3 className="font-semibold mb-2">Trust Scores</h3>
                <p className="text-sm text-muted-foreground">
                  See ratings, reviews, and completion rates before you hire or buy.
                </p>
              </div>
              <div>
                <Shield className="w-6 h-6 text-primary mb-2" />
                <h3 className="font-semibold mb-2">Secure Payments</h3>
                <p className="text-sm text-muted-foreground">
                  Milestone-based payments protect both buyers and workers throughout the project.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
