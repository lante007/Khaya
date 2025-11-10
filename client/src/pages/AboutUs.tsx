import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Heart, TrendingUp } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <div className="container py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About Project Khaya</h1>
          <p className="text-xl text-muted-foreground">
            Building community, one khaya at a time
          </p>
        </div>

        <div className="prose prose-lg max-w-none mb-12">
          <p className="text-lg leading-relaxed">
            <strong>Project Khaya</strong> started with a simple observation in Estcourt, KwaZulu-Natal: 
            building a home shouldn't be this hard. Homeowners struggled to find reliable workers, 
            suppliers inflated prices without transparency, and skilled tradespeople couldn't reach 
            customers who needed them most.
          </p>
          
          <p className="text-lg leading-relaxed mt-6">
            We built Project Khaya to change that. Our platform connects buyers with verified suppliers 
            and skilled workers, bringing transparency and trust to construction in small towns across 
            South Africa. No more price surprises. No more ghosting. Just honest, reliable service from 
            people in your community.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Building2 className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To make construction transparent, affordable, and accessible for every homeowner in 
                small-town South Africa, while empowering local suppliers and skilled workers to grow 
                their businesses.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Heart className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Our Values</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Ubuntu:</strong> "Umuntu ngumuntu ngabantu" - A person is a person through other people</li>
                <li><strong>Transparency:</strong> Clear pricing, no hidden fees</li>
                <li><strong>Trust:</strong> Verified suppliers and skilled workers</li>
                <li><strong>Community:</strong> Supporting local businesses</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-12">
          <CardHeader>
            <Users className="w-10 h-10 text-primary mb-2" />
            <CardTitle>Who We Serve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Homeowners & Buyers</h3>
                <p className="text-sm text-muted-foreground">
                  Building or renovating your home with confidence, knowing you're getting fair prices 
                  and reliable service.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Suppliers & Vendors</h3>
                <p className="text-sm text-muted-foreground">
                  Hardware stores and material suppliers reaching more customers with transparent 
                  pricing and instant payouts.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Service Providers</h3>
                <p className="text-sm text-muted-foreground">
                  Skilled tradespeople—plumbers, electricians, roofers, builders—connecting with 
                  projects that need their expertise.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <TrendingUp className="w-10 h-10 text-primary mb-2" />
            <CardTitle>Our Journey</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Phase 1: Estcourt (2025)</h3>
                <p className="text-sm text-muted-foreground">
                  Launching in our home town, building trust one project at a time
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Phase 2: KZN Expansion (2025-2026)</h3>
                <p className="text-sm text-muted-foreground">
                  Growing across KwaZulu-Natal, connecting more communities
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Phase 3: National Reach (2026+)</h3>
                <p className="text-sm text-muted-foreground">
                  Bringing transparent construction to small towns across South Africa
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-12 p-8 bg-primary/10 rounded-lg">
          <p className="text-lg font-semibold mb-2">
            "Ubuntu ngumuntu ngabantu"
          </p>
          <p className="text-muted-foreground">
            A person is a person through other people. We build together.
          </p>
        </div>
      </div>
    </div>
  );
}
