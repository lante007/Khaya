import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { MapPin, Briefcase, Search, DollarSign, Sparkles, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Jobs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [useAI, setUseAI] = useState(false);
  
  const { data: jobs, isLoading } = trpc.job.getOpen.useQuery({
    location: location || undefined, 
    category: category || undefined,
  });
  
  const parseSearch = trpc.ai.parseSearch.useMutation();
  
  const formatPrice = (cents: number) => `R${(cents / 100).toFixed(2)}`;
  
  const handleSmartSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }
    
    setUseAI(true);
    toast.info("Parsing your search with AI...");
    
    parseSearch.mutate({ query: searchQuery }, {
      onSuccess: (filters) => {
        // Apply the parsed filters
        if (filters.location) {
          setLocation(filters.location);
        }
        if (filters.category) {
          setCategory(filters.category);
        }
        
        // Show what was understood
        const understood = [];
        if (filters.category) understood.push(`Category: ${filters.category}`);
        if (filters.location) understood.push(`Location: ${filters.location}`);
        if (filters.budgetMax) understood.push(`Budget: Up to R${filters.budgetMax}`);
        if (filters.urgency) understood.push(`Urgency: ${filters.urgency}`);
        
        if (understood.length > 0) {
          toast.success(`Found: ${understood.join(', ')}`);
        } else {
          toast.info("Searching with keywords: " + filters.keywords.join(', '));
        }
        
        setUseAI(false);
      },
      onError: () => {
        toast.error("Failed to parse search. Using basic search.");
        setUseAI(false);
      },
    });
  };
  
  const handleClearFilters = () => {
    setSearchQuery("");
    setLocation("");
    setCategory("");
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="container py-8">
        <h1 className="text-4xl font-bold mb-2">Browse Jobs</h1>
        <p className="text-lg text-muted-foreground mb-8">Find work opportunities in your area</p>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Jobs
            </CardTitle>
            <CardDescription>
              Try natural language: "need cheap plumber in durban" or "urgent electrician"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Smart Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Smart Search (AI-Powered)
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., need cheap plumber in durban"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSmartSearch()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSmartSearch}
                  disabled={parseSearch.isPending || !searchQuery.trim()}
                  className="gap-2"
                >
                  {parseSearch.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Manual Filters */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Or use manual filters:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Input
                    placeholder="e.g., Estcourt"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Input
                    placeholder="e.g., Plumbing, Electrical"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(location || category) && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {location && (
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    {location}
                  </Badge>
                )}
                {category && (
                  <Badge variant="secondary" className="gap-1">
                    <Briefcase className="h-3 w-3" />
                    {category}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="ml-auto"
                >
                  Clear All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : jobs && jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Briefcase className="w-3 h-3" />
                        {job.category}
                      </CardDescription>
                    </div>
                    <Badge className="bg-primary/10 text-primary">Open</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {job.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1 text-xl font-bold text-primary">
                        <DollarSign className="w-5 h-5" />
                        {formatPrice(job.budget)}
                      </div>
                      <Link to={`/jobs/${job.id}`}>
                        <Button size="sm">View & Bid</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                {location || category ? "No jobs match your filters" : "No jobs available"}
              </p>
              {(location || category) && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}