import Navigation from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Smartphone, Clock, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SMSSupport() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <div className="container py-12 max-w-4xl">
        <div className="text-center mb-12">
          <Smartphone className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">SMS Support</h1>
          <Badge variant="secondary" className="text-base px-4 py-1">Coming Soon</Badge>
          <p className="text-xl text-muted-foreground mt-4">
            Access Project Khaya without internet—via simple text messages
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <MessageCircle className="w-8 h-8 text-primary mb-2" />
              <CardTitle>What is SMS Support?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We understand that not everyone has reliable internet access. SMS Support lets you use key 
                Project Khaya features through simple text messages—no data required.
              </p>
              <p className="text-muted-foreground">
                Perfect for areas with poor connectivity or when you\'re on the go without data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Will Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">1. Text a Keyword</h3>
                  <p className="text-sm text-muted-foreground">
                    Send a simple keyword like "FIND PLUMBER" or "CHECK BIDS" to our SMS number
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2. Get Instant Replies</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive results, updates, or instructions via SMS within seconds
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">3. Take Action</h3>
                  <p className="text-sm text-muted-foreground">
                    Reply with simple commands to accept bids, check status, or contact workers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Planned Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Search Workers:</strong> Text "FIND [trade] [location]" to get a list of available workers</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Check Bids:</strong> Text "BIDS" to see new bids on your projects</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Job Updates:</strong> Receive automatic SMS when workers bid on your projects</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Price Checks:</strong> Text "PRICE [material]" to get current prices from suppliers</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Help & Support:</strong> Text "HELP" anytime for assistance</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                SMS Support will be available 24/7 once launched. Standard SMS rates from your mobile provider 
                will apply.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Estimated Launch:</strong> Q1 2026
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <HelpCircle className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Why SMS?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                In many small towns across South Africa, internet connectivity can be unreliable or expensive. 
                SMS works everywhere, even with basic phones, and doesn\'t require data.
              </p>
              <p className="text-muted-foreground">
                This ensures everyone can access Project Khaya, regardless of their phone or connection.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Stay Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Want to be notified when SMS Support launches? Make sure your phone number is verified in your 
                profile settings. We\'ll send you a text when it\'s ready!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}