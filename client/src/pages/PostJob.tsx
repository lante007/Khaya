import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function PostJob() {
  const [, setLocation] = useLocation();
  const createJob = trpc.job.create.useMutation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setJobLocation] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category || !budget || !location) {
      toast.error("Please fill all fields");
      return;
    }
    createJob.mutate({
      title, description, category, budget: parseFloat(budget), location,
    }, {
      onSuccess: () => { toast.success("Job posted successfully!"); setLocation("/dashboard"); },
      onError: () => toast.error("Failed to post job"),
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="container py-8 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Post a Job</h1>
        <Card><CardHeader><CardTitle>Job Details</CardTitle></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-4"><div><Label>Job Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Need a plumber for bathroom renovation" /></div><div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the work needed in detail" rows={5} /></div><div><Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Plumbing, Electrical, Construction" /></div><div><Label>Budget (R)</Label><Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g., 5000" /></div><div><Label>Location</Label><Input value={location} onChange={(e) => setJobLocation(e.target.value)} placeholder="e.g., Estcourt" /></div><Button type="submit" disabled={createJob.isPending} className="w-full">Post Job</Button></form></CardContent></Card>
      </div>
    </div>
  );
}