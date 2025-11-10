import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { MapPin, Star, Award, Briefcase, Search } from "lucide-react";
import { Link } from "wouter";

export default function Workers() {
  const [location, setLocation] = useState("");
  const [trade, setTrade] = useState("");
  
  const { data: workers, isLoading } = trpc.profile.getWorkers.useQuery({
    location: location || undefined,
    trade: trade || undefined,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Find Verified Workers</h1>
          <p className="text-lg text-muted-foreground">
            Browse skilled professionals in your area
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <Input
                  placeholder="e.g., Estcourt, Ladysmith"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Trade/Skill</label>
                <Input
                  placeholder="e.g., Plumber, Electrician, Builder"
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading workers...</p>
          </div>
        ) : workers && workers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workers.map((item) => {
              const profile = item.profile;
              const user = item.user;
              if (!profile || !user) return null;
              
              return (
                <Card key={profile.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                          {user.name?.charAt(0) || "W"}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{user.name || "Worker"}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Briefcase className="w-3 h-3" />
                            {profile.trade || "General Worker"}
                          </CardDescription>
                        </div>
                      </div>
                      {profile.verified && (
                        <Badge className="bg-success/10 text-success border-success/20">
                          <Award className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {profile.location}
                      </div>
                      
                      {profile.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {profile.bio}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-accent/20 px-2 py-1 rounded">
                            <Star className="w-4 h-4 text-accent fill-accent" />
                            <span className="text-sm font-semibold">{profile.trustScore || 0}</span>
                          </div>
                          {profile.yearsExperience && (
                            <span className="text-xs text-muted-foreground">
                              {profile.yearsExperience} yrs exp
                            </span>
                          )}
                        </div>
                        <Link href={`/workers/${user.id}`}>
                          <Button size="sm">View Profile</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">No workers found matching your criteria</p>
              <Button variant="outline" onClick={() => { setLocation(""); setTrade(""); }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
