import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, CheckCircle, AlertTriangle, Lock, 
  FileCheck, Star, Users, MessageCircle 
} from "lucide-react";

export default function TrustSafety() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <div className="container py-12 max-w-4xl">
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Trust & Safety</h1>
          <p className="text-xl text-muted-foreground">
            Your safety is our priority. Here's how we keep Project Khaya secure.
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CheckCircle className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Verification Process</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Every supplier and service provider on Project Khaya goes through our verification process:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Identity Verification:</strong> Valid South African ID or company registration</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Trade Certification:</strong> Proof of qualifications for skilled trades</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Business License:</strong> Valid trading permits for suppliers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Reference Checks:</strong> Past work history and customer references</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Star className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Trust Scores & Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Our trust system helps you make informed decisions:</p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Trust Score (0-5 stars)</h3>
                  <p className="text-sm text-muted-foreground">
                    Calculated from customer reviews, completion rates, response times, and dispute history. 
                    Only verified customers can leave reviews.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Verified Badges</h3>
                  <p className="text-sm text-muted-foreground">
                    Displayed on profiles of users who have completed our verification process and maintained 
                    good standing.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Completion Rate</h3>
                  <p className="text-sm text-muted-foreground">
                    Shows the percentage of projects successfully completed on time and within budget.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Lock className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Secure Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">We protect your money with milestone-based payments:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Lock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Escrow Protection:</strong> Funds are held securely until work is completed</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Milestone Releases:</strong> Pay in stages as work progresses</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Proof of Work:</strong> Workers upload photos before payment release</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Dispute Resolution:</strong> Our team mediates if issues arise</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileCheck className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Your Data & Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">We take your privacy seriously:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <FileCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Encrypted Data:</strong> All personal information is encrypted and stored securely</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>POPIA Compliant:</strong> We follow South Africa's Protection of Personal Information Act</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>No Selling Data:</strong> We never sell your information to third parties</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Control Your Info:</strong> You can update or delete your data anytime</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <AlertTriangle className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Safety Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">For Buyers:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Always check trust scores and reviews before hiring</li>
                    <li>• Use milestone payments—never pay the full amount upfront</li>
                    <li>• Keep all communication on the platform for your protection</li>
                    <li>• Report suspicious behavior immediately</li>
                    <li>• Verify certifications for specialized trades (electrical, plumbing)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">For Providers:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Never accept payment outside the platform</li>
                    <li>• Document all work with photos and notes</li>
                    <li>• Communicate clearly about timelines and costs</li>
                    <li>• Report unreasonable requests or abusive behavior</li>
                    <li>• Keep your certifications and profile up to date</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageCircle className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Report Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">If you encounter any problems, we're here to help:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>In-Platform Reporting:</strong> Use the "Report" button on any profile or listing</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Support Team:</strong> Contact us at support@projectkhaya.co.za</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>SMS Support:</strong> Text "HELP" to our support line (coming soon)</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Response Time:</strong> We aim to respond within 24 hours</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <Users className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Community Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Project Khaya is built on Ubuntu—we're all connected. Please:</p>
              <ul className="space-y-2 text-sm">
                <li>✓ Treat everyone with respect and professionalism</li>
                <li>✓ Communicate clearly and honestly</li>
                <li>✓ Honor your commitments and timelines</li>
                <li>✓ Provide fair pricing and quality work</li>
                <li>✓ Leave honest, constructive reviews</li>
                <li>✗ No harassment, discrimination, or abusive behavior</li>
                <li>✗ No fraudulent listings or misleading information</li>
                <li>✗ No off-platform payments or transactions</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
