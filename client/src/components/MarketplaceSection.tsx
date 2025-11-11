import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { MapPin, Star, Truck } from "lucide-react";
import materialsImage from "@/assets/materials-icon.jpg";
import workerImage from "@/assets/worker-icon.jpg";

interface ListingCardProps {
  image: string;
  title: string;
  provider: string;
  location: string;
  rating: number;
  price: string;
  badge?: string;
  type: "material" | "service";
}

const ListingCard = ({ image, title, provider, location, rating, price, badge, type }: ListingCardProps) => (
  <Card className="overflow-hidden shadow-card hover:shadow-warm transition-all duration-300 hover:scale-[1.02]">
    <div className="relative h-48 overflow-hidden">
      <img src={image} alt={title} className="w-full h-full object-cover" />
      {badge && (
        <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
          {badge}
        </Badge>
      )}
    </div>
    <div className="p-5">
      <h3 className="font-bold text-lg text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-3">{provider}</p>
      
      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-secondary text-secondary" />
          <span>{rating}</span>
        </div>
        {type === "material" && (
          <div className="flex items-center gap-1">
            <Truck className="h-4 w-4" />
            <span>Fast</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-primary">{price}</p>
          <p className="text-xs text-muted-foreground">{type === "material" ? "per unit" : "avg. project"}</p>
        </div>
        <Button variant="secondary" size="sm">
          View Details
        </Button>
      </div>
    </div>
  </Card>
);

export const MarketplaceSection = () => {
  const featuredListings = [
    {
      image: materialsImage,
      title: "Quality Building Bricks",
      provider: "Estcourt Brick Co.",
      location: "Estcourt",
      rating: 4.8,
      price: "R 3.50",
      badge: "In Stock",
      type: "material" as const,
    },
    {
      image: workerImage,
      title: "Professional Roofing",
      provider: "Thabo M. - Roofer",
      location: "Estcourt",
      rating: 4.9,
      price: "R 8,500",
      badge: "Verified",
      type: "service" as const,
    },
    {
      image: materialsImage,
      title: "Cement & Sand Mix",
      provider: "KZN Building Supplies",
      location: "Mooi River",
      rating: 4.7,
      price: "R 85.00",
      type: "material" as const,
    },
  ];

  return (
    <section className="py-20 bg-gradient-earth">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Explore the Marketplace
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse trusted suppliers and skilled workers in your area. All verified, all transparent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {featuredListings.map((listing, index) => (
            <ListingCard key={index} {...listing} />
          ))}
        </div>

        <div className="text-center">
          <Link to="/materials">
            <Button size="lg" variant="hero">
              See All Listings
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
