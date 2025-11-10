import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import { MapPin, DollarSign, Calendar } from "lucide-react";

export default function JobDetail() {
  const [, params] = useRoute("/jobs/:id");
  const jobId = parseInt(params?.id || "0");
  const { data: job, isLoading } = trpc.job.getById.useQuery({ id: jobId });
  const { data: bids } = trpc.bid.getByJob.useQuery({ jobId });
  const formatPrice = (cents: number) => `R${(cents / 100).toFixed(2)}`;
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  if (!job) return <div className="min-h-screen flex items-center justify-center"><p>Job not found</p></div>;
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="container py-8 max-w-4xl">
        <Card className="mb-6"><CardHeader><CardTitle className="text-3xl">{job.title}</CardTitle></CardHeader><CardContent><div className="space-y-4"><div className="flex items-center gap-4 text-muted-foreground"><span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span><span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{formatPrice(job.budget)}</span><span className="capitalize">{job.status}</span></div><div><h3 className="font-semibold mb-2">Description</h3><p className="text-muted-foreground">{job.description}</p></div><div><h3 className="font-semibold mb-2">Category</h3><p className="text-muted-foreground">{job.category}</p></div></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Bids ({bids?.length || 0})</CardTitle></CardHeader><CardContent>{bids && bids.length > 0 ? <div className="space-y-3">{bids.map(item => <div key={item.bid.id} className="p-4 border rounded-lg"><div className="flex justify-between items-start"><div><h3 className="font-semibold">{item.worker?.name || "Worker"}</h3><p className="text-sm text-muted-foreground">{item.bid.timeline} days · {formatPrice(item.bid.amount)}</p></div><span className="text-sm capitalize">{item.bid.status}</span></div><p className="text-sm text-muted-foreground mt-2">{item.bid.proposal}</p></div>)}</div> : <p className="text-muted-foreground">No bids yet</p>}</CardContent></Card>
      </div>
    </div>
  );
}