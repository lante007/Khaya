import { useEffect } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { TrustBar } from "@/components/home/TrustBar";
import { ServiceCards } from "@/components/home/ServiceCards";
import { Testimonials } from "@/components/home/Testimonials";
import { CTASection } from "@/components/home/CTASection";
import { Footer } from "@/components/home/Footer";

export default function Home() {
  useEffect(() => {
    // SEO & Meta tags
    document.title = "Project Khaya - Your Trusted Home Services Marketplace in KZN";
    
    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', 'Connect with skilled tradespeople and suppliers for building projects and home maintenance in KwaZulu-Natal. Post jobs, receive bids, and hire with confidence.');
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(metaDescription);
    }

    // Structured Data
    const structuredData = document.createElement('script');
    structuredData.type = 'application/ld+json';
    structuredData.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Project Khaya",
      "description": "Home services marketplace connecting homeowners with skilled workers in KZN",
      "url": "https://projectkhaya.co.za",
      "areaServed": {
        "@type": "State",
        "name": "KwaZulu-Natal, South Africa"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "1500"
      }
    });
    document.head.appendChild(structuredData);

    return () => {
      if (document.head.contains(structuredData)) {
        document.head.removeChild(structuredData);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <HeroSection />
      <TrustBar />
      <ServiceCards />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
}
