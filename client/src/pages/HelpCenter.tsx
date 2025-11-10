import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HelpCenter() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <div className="container py-12 max-w-4xl">
        <div className="text-center mb-12">
          <HelpCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-xl text-muted-foreground">
            Find answers to common questions
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">
                How do I get started on Project Khaya?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Simply browse our marketplace to find materials or workers, or post a job if you need 
                  something specific. For suppliers and service providers, click "Join as Provider" to 
                  create your profile and start listing your services or products.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                How does payment work?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground mb-2">
                  We use milestone-based payments to protect both buyers and workers:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Buyers pay into escrow when hiring a worker</li>
                  <li>Funds are released per milestone as work is completed</li>
                  <li>Workers upload proof of work before each payment</li>
                  <li>Suppliers receive payment after delivery confirmation</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                Are all workers and suppliers verified?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Yes! Every service provider and supplier goes through our verification process, including 
                  ID verification, certification checks, and reference validation. Look for the verified 
                  badge on profiles.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                What if I have a problem with a worker or supplier?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Use the "Report" button on any profile or contact our support team at 
                  support@projectkhaya.co.za. We mediate disputes and take action against users who 
                  violate our community guidelines.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                How do trust scores work?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Trust scores (0-5 stars) are calculated from customer reviews, project completion rates, 
                  response times, and dispute history. Only verified customers who have worked with a 
                  provider can leave reviews.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left">
                Can I use Project Khaya on my phone?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Yes! Our website is fully mobile-responsive and works on any smartphone. We also offer 
                  SMS support for users with limited data—text "HELP" to our support line (coming soon).
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="text-left">
                What areas does Project Khaya serve?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  We started in Estcourt and are expanding across KwaZulu-Natal. Check the location filter 
                  to see available suppliers and workers in your area.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger className="text-left">
                How much does it cost to use Project Khaya?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground mb-2">
                  For buyers: It\'s free to browse and post jobs. We charge a small service fee (5%) on 
                  completed transactions.
                </p>
                <p className="text-muted-foreground">
                  For providers: Free to create a profile and bid on jobs. We take a 10% commission on 
                  completed projects.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <Card>
          <CardHeader>
            <MessageCircle className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Still Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Can\'t find what you\'re looking for? Our support team is here to help.
            </p>
            <Link href="/contact">
              <Button>Contact Support</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}