import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Search, MapPin, Wrench } from "lucide-react";

export const SearchSection = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border-2 border-primary/10 rounded-2xl shadow-card p-8">
            <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
              Find What You Need
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Search Input */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search materials or services..." 
                  className="pl-10 h-12"
                />
              </div>

              {/* Location Select */}
              <Select defaultValue="estcourt">
                <SelectTrigger className="h-12">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estcourt">Estcourt</SelectItem>
                  <SelectItem value="mooi-river">Mooi River</SelectItem>
                  <SelectItem value="colenso">Colenso</SelectItem>
                  <SelectItem value="winterton">Winterton</SelectItem>
                  <SelectItem value="all">All KZN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Select */}
              <Select defaultValue="all">
                <SelectTrigger className="h-12">
                  <Wrench className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="materials">Building Materials</SelectItem>
                  <SelectItem value="roofing">Roofing Services</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="electrical">Electrical Work</SelectItem>
                  <SelectItem value="painting">Painting & Finishing</SelectItem>
                  <SelectItem value="masonry">Masonry & Bricklaying</SelectItem>
                </SelectContent>
              </Select>

              {/* Search Button */}
              <Link to="/materials">
                <Button size="lg" className="h-12" variant="hero">
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </Button>
              </Link>
            </div>

            {/* Quick Links */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">Popular searches:</p>
              <div className="flex flex-wrap gap-2">
                {["Bricks", "Cement", "Roofers", "Plumbers", "Electricians", "Sand & Stone"].map((term) => (
                  <Button key={term} variant="ghost" size="sm" className="text-xs">
                    {term}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
