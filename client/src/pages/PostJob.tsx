import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Sparkles, Loader2, Calculator, ChevronDown, ChevronUp } from "lucide-react";

const CATEGORIES = [
  "Plumbing", "Electrical", "Painting", "Tiling", "Roofing",
  "Carpentry", "Construction", "Cleaning", "Landscaping", "Other",
];

const CONFIDENCE_COLOURS: Record<string, string> = {
  High:   "bg-green-100 text-green-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Low:    "bg-red-100 text-red-800",
};

export default function PostJob() {
  const [, setLocation] = useLocation();
  const createJob = trpc.job.create.useMutation();
  const enhanceDescription = trpc.ai.enhanceJobDescription.useMutation();
  const estimateCost = trpc.ai.estimateCost.useMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [showLineItems, setShowLineItems] = useState(false);

  const estimate = estimateCost.data;

  const handleEnhance = () => {
    if (!title || !description) { toast.error("Please enter a title and description first"); return; }
    enhanceDescription.mutate(
      { title, description, budget: budget ? parseFloat(budget) : undefined, location: jobLocation || undefined, category: category || undefined },
      {
        onSuccess: (data) => { setDescription(data.enhanced); toast.success("Description enhanced!"); },
        onError: () => toast.error("Failed to enhance description."),
      }
    );
  };

  const handleEstimate = () => {
    if (!title || !description || !category) { toast.error("Please fill in title, description, and category first"); return; }
    estimateCost.mutate(
      { title, description, category, location: jobLocation || "South Africa" },
      {
        onSuccess: (data) => {
          if (!budget) setBudget(data.mid.toString());
          toast.success(`Estimate ready — ${data.confidence} confidence`);
        },
        onError: () => toast.error("Estimation failed. You can still set your own budget."),
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category || !budget || !jobLocation) { toast.error("Please fill all fields"); return; }
    createJob.mutate(
      { title, description, category, budget: parseFloat(budget), location: jobLocation },
      {
        onSuccess: () => { toast.success("Job posted! Workers in your area will be notified."); setLocation("/dashboard"); },
        onError: (error) => toast.error(error.message || "Failed to post job."),
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="container py-8 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Post a Job</h1>
        <Card>
          <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label>Job Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Need a plumber for bathroom renovation" />
              </div>
              <div>
                <Label>Category</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CATEGORIES.map(c => (
                    <button key={c} type="button" onClick={() => setCategory(c)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${category === c ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} placeholder="e.g., Estcourt, KwaZulu-Natal" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Description</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleEnhance}
                    disabled={enhanceDescription.isPending || !title || !description} className="gap-2">
                    {enhanceDescription.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Enhancing...</> : <><Sparkles className="h-4 w-4" />Enhance with AI</>}
                  </Button>
                </div>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the work needed in detail" rows={6} className="resize-none" />
              </div>

              {/* AI Cost Estimate panel */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">AI Cost Estimate</p>
                    <p className="text-xs text-muted-foreground">Get a realistic budget range before posting</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleEstimate}
                    disabled={estimateCost.isPending || !title || !description || !category} className="gap-2">
                    {estimateCost.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Estimating...</> : <><Calculator className="h-4 w-4" />Get Estimate</>}
                  </Button>
                </div>
                {estimate && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold">R{estimate.low.toLocaleString()} – R{estimate.high.toLocaleString()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONFIDENCE_COLOURS[estimate.confidence] ?? ""}`}>{estimate.confidence} confidence</span>
                      {estimate.usedVision && <Badge variant="outline" className="text-xs">Vision</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">Recommended: <strong>R{estimate.mid.toLocaleString()}</strong></p>
                    <p className="text-xs text-muted-foreground italic">{estimate.reasoning}</p>
                    <button type="button" onClick={() => setShowLineItems(v => !v)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline">
                      {showLineItems ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {showLineItems ? "Hide" : "Show"} breakdown
                    </button>
                    {showLineItems && (
                      <div className="rounded border bg-background text-xs">
                        <div className="grid grid-cols-4 gap-2 px-3 py-2 font-medium border-b text-muted-foreground">
                          <span>Item</span><span>Low</span><span>Mid</span><span>High</span>
                        </div>
                        {estimate.lineItems.map((item, i) => (
                          <div key={i} className="grid grid-cols-4 gap-2 px-3 py-1.5 border-b last:border-0">
                            <span>{item.label}</span>
                            <span>R{item.low.toLocaleString()}</span>
                            <span>R{item.mid.toLocaleString()}</span>
                            <span>R{item.high.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{estimate.disclaimer}</p>
                  </div>
                )}
              </div>

              <div>
                <Label>Your Budget (R)</Label>
                <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)}
                  placeholder={estimate ? `Suggested: R${estimate.mid.toLocaleString()}` : "e.g., 5000"} />
                <p className="text-xs text-muted-foreground mt-1">Workers will bid based on this budget.</p>
              </div>

              <Button type="submit" disabled={createJob.isPending} className="w-full">
                {createJob.isPending ? "Posting..." : "Post Job — Notify Workers"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
