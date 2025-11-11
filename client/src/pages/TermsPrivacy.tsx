import Navigation from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield } from "lucide-react";

export default function TermsPrivacy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <div className="container py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms & Privacy</h1>
          <p className="text-xl text-muted-foreground">
            Last updated: November 10, 2025
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <FileText className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Terms of Service</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h3>1. Acceptance of Terms</h3>
              <p>
                By accessing and using Project Khaya, you accept and agree to be bound by these Terms of Service. 
                If you do not agree, please do not use our platform.
              </p>

              <h3>2. User Accounts</h3>
              <p>
                You must provide accurate information when creating an account. You are responsible for maintaining 
                the security of your account and all activities under it.
              </p>

              <h3>3. User Conduct</h3>
              <p>You agree not to:</p>
              <ul>
                <li>Provide false or misleading information</li>
                <li>Engage in fraudulent activities</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Conduct transactions outside the platform</li>
              </ul>

              <h3>4. Services & Fees</h3>
              <p>
                Project Khaya charges a service fee on completed transactions: 5% for buyers and 10% for service 
                providers. Fees are clearly disclosed before any transaction.
              </p>

              <h3>5. Payment Terms</h3>
              <p>
                All payments are processed through our secure escrow system. Milestone-based payments are released 
                upon buyer confirmation or after the dispute resolution period.
              </p>

              <h3>6. Dispute Resolution</h3>
              <p>
                In case of disputes, Project Khaya will mediate between parties. Our decision is final and binding. 
                Users agree to cooperate with the dispute resolution process.
              </p>

              <h3>7. Intellectual Property</h3>
              <p>
                All content on Project Khaya, including logos, text, and design, is owned by Project Khaya or 
                licensed to us. Users retain ownership of content they upload.
              </p>

              <h3>8. Limitation of Liability</h3>
              <p>
                Project Khaya is a marketplace platform. We do not perform the services or sell the products listed. 
                We are not liable for the quality, safety, or legality of items or services exchanged.
              </p>

              <h3>9. Termination</h3>
              <p>
                We reserve the right to suspend or terminate accounts that violate these terms or engage in 
                fraudulent activity.
              </p>

              <h3>10. Changes to Terms</h3>
              <p>
                We may update these terms from time to time. Continued use of the platform constitutes acceptance 
                of updated terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h3>1. Information We Collect</h3>
              <p>We collect information you provide when creating an account:</p>
              <ul>
                <li>Personal information (name, email, phone number, ID number)</li>
                <li>Profile information (bio, skills, certifications)</li>
                <li>Transaction history and payment information</li>
                <li>Communications with other users and support</li>
                <li>Usage data and analytics</li>
              </ul>

              <h3>2. How We Use Your Information</h3>
              <p>We use your information to:</p>
              <ul>
                <li>Provide and improve our services</li>
                <li>Process transactions and payments</li>
                <li>Verify identities and prevent fraud</li>
                <li>Communicate with you about your account</li>
                <li>Send notifications about bids, jobs, and messages</li>
                <li>Analyze usage patterns to improve the platform</li>
              </ul>

              <h3>3. Information Sharing</h3>
              <p>
                We do not sell your personal information. We may share information with:
              </p>
              <ul>
                <li>Other users (as necessary for transactions)</li>
                <li>Payment processors (for transaction processing)</li>
                <li>Law enforcement (when legally required)</li>
                <li>Service providers (who help us operate the platform)</li>
              </ul>

              <h3>4. Data Security</h3>
              <p>
                We use industry-standard encryption and security measures to protect your data. However, no system 
                is 100% secure, and we cannot guarantee absolute security.
              </p>

              <h3>5. Your Rights (POPIA Compliance)</h3>
              <p>Under South Africa\'s Protection of Personal Information Act, you have the right to:</p>
              <ul>
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Withdraw consent at any time</li>
              </ul>

              <h3>6. Cookies & Tracking</h3>
              <p>
                We use cookies and similar technologies to improve your experience, analyze usage, and provide 
                personalized content. You can control cookies through your browser settings.
              </p>

              <h3>7. Data Retention</h3>
              <p>
                We retain your information for as long as your account is active or as needed to provide services. 
                Transaction records are kept for 7 years for legal compliance.
              </p>

              <h3>8. Children\'s Privacy</h3>
              <p>
                Project Khaya is not intended for users under 18. We do not knowingly collect information from 
                children.
              </p>

              <h3>9. Changes to Privacy Policy</h3>
              <p>
                We may update this policy from time to time. We will notify you of significant changes via email 
                or platform notification.
              </p>

              <h3>10. Contact Us</h3>
              <p>
                For privacy-related questions or to exercise your rights, contact us at privacy@projectkhaya.co.za
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}