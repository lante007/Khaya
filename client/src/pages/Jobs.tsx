import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { MapPin, Briefcase, Search, DollarSign } from "lucide-react";
import { Link } from "wouter";

export default function Jobs() {
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const { data: jobs, isLoading } = trpc.job.getOpen.useQuery({
    location: location || undefined, category: category || undefined,
  });
  const formatPrice = (cents: number) => `R${(cents / 100).toFixed(2)}`;
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="container py-8">
        <h1 className="text-4xl font-bold mb-2">Browse Jobs</h1>
        <p className="text-lg text-muted-foreground mb-8">Find work opportunities in your area</p>
        <Card className="mb-8"><CardHeader><CardTitle className="flex items-center gap-2"><Search className="w-5 h-5" />Search Filters</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-sm font-medium mb-2 block">Location</label><Input placeholder="e.g., Estcourt" value={location} onChange={(e) => setLocation(e.target.value)} /></div><div><label className="text-sm font-medium mb-2 block">Category</label><Input placeholder="e.g., Plumbing, Electrical" value={category} onChange={(e) => setCategory(e.target.value)} /></div></div></CardContent></Card>
        {isLoading ? <div className="text-center py-12"><p className="text-muted-foreground">Loading...</p></div> : jobs && jobs.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{jobs.map((job) => (<Card key={job.id} className="hover:shadow-lg transition-shadow"><CardHeader><div className="flex items-start justify-between"><div><CardTitle className="text-lg">{job.title}</CardTitle><CardDescription className="flex items-center gap-1 mt-1"><Briefcase className="w-3 h-3" />{job.category}</CardDescription></div><Badge className="bg-primary/10 text-primary">Open</Badge></div></CardHeader><CardContent><div className="space-y-3"><p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p><div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4" />{job.location}</div><div className="flex items-center justify-between pt-2 border-t"><div className="flex items-center gap-1 text-xl font-bold text-primary"><DollarSign className="w-5 h-5" />{formatPrice(job.budget)}</div><Link to={`/jobs/${job.id}`}><Button size="sm">View & Bid</Button></Link></div></div></CardContent></Card>))}</div> : <Card className="py-12"><CardContent className="text-center"><p className="text-muted-foreground mb-4">No jobs found</p><Button variant="outline" onClick={() => { setLocation(""); setCategory(""); }}>Clear Filters</Button></CardContent></Card>}
      </div>
    </div>
  );
}