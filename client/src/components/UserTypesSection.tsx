import { UserTypeCard } from "./UserTypeCard";
import { Home, Package, Wrench } from "lucide-react";

export const UserTypesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Khaya Works for Everyone
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you're building a home, selling materials, or offering your skills – we've got you covered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <UserTypeCard
            icon={Home}
            title="Buyers & Homeowners"
            description="Building or renovating? Find everything you need in one place."
            features={[
              "Search verified suppliers and skilled workers",
              "Get transparent quotes with no hidden fees",
              "Track your project from start to finish",
              "Pay securely with milestone-based payments",
              "Read reviews from your community",
            ]}
            buttonText="Start Your Own"
            buttonLink="/auth?role=buyer&mode=signup"
            variant="default"
          />

          <UserTypeCard
            icon={Package}
            title="Suppliers & Vendors"
            description="Reach more customers in your community."
            features={[
              "List your products with real-time inventory",
              "Set delivery radius and pricing",
              "Get instant payouts after delivery",
              "Build your reputation with reviews",
              "Track sales and customer insights",
            ]}
            buttonText="List Your Products"
            buttonLink="/auth?role=seller&mode=signup"
            variant="secondary"
          />

          <UserTypeCard
            icon={Wrench}
            title="Service Providers"
            description="Skilled tradesperson? Connect with projects that need you."
            features={[
              "Bid on jobs that match your skills",
              "Showcase your portfolio and certifications",
              "Receive milestone-based payments",
              "Build trust with verified reviews",
              "Manage multiple projects easily",
            ]}
            buttonText="Join as Provider"
            buttonLink="/auth?role=worker&mode=signup"
            variant="accent"
          />
        </div>
      </div>
    </section>
  );
};
