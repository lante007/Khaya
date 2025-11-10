import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import { MapPin, Package, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MaterialDetail() {
  const [, params] = useRoute("/materials/:id");
  const listingId = parseInt(params?.id || "0");
  const { data: listing, isLoading } = trpc.listing.getById.useQuery({ id: listingId });
  const formatPrice = (cents: number) => `R${(cents / 100).toFixed(2)}`;
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  if (!listing) return <div className="min-h-screen flex items-center justify-center"><p>Listing not found</p></div>;
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="container py-8 max-w-4xl">
        <Card><CardHeader><div className="flex items-start justify-between"><CardTitle className="text-3xl">{listing.title}</CardTitle><Badge variant="outline">{listing.stock} in stock</Badge></div></CardHeader><CardContent><div className="space-y-4"><div className="flex items-center gap-4 text-muted-foreground"><span className="flex items-center gap-1"><Package className="w-4 h-4" />{listing.category}</span><span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{listing.location}</span></div><div className="flex items-center gap-2 text-3xl font-bold text-primary"><DollarSign className="w-8 h-8" />{formatPrice(listing.price)}<span className="text-lg text-muted-foreground font-normal">per {listing.unit}</span></div><div><h3 className="font-semibold mb-2">Description</h3><p className="text-muted-foreground">{listing.description}</p></div></div></CardContent></Card>
      </div>
    </div>
  );
}