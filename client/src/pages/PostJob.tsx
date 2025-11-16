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
import { Sparkles, Loader2 } from "lucide-react";

export default function PostJob() {
  const [, setLocation] = useLocation();
  const createJob = trpc.job.create.useMutation();
  const enhanceDescription = trpc.ai.enhanceJobDescription.useMutation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setJobLocation] = useState("");
  
  const handleEnhance = async () => {
    if (!title || !description) {
      toast.error("Please enter a title and description first");
      return;
    }
    
    toast.info("Enhancing with AI...");
    
    enhanceDescription.mutate({
      title,
      description,
      budget: budget ? parseFloat(budget) : undefined,
      location: location || undefined,
      category: category || undefined,
    }, {
      onSuccess: (data) => {
        setDescription(data.enhanced);
        toast.success("Description enhanced! Review and edit as needed.");
      },
      onError: () => {
        toast.error("Failed to enhance description. Please try again.");
      },
    });
  };
  
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
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Job Title</Label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g., Need a plumber for bathroom renovation" 
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Description</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleEnhance}
                    disabled={enhanceDescription.isPending || !title || !description}
                    className="gap-2"
                  >
                    {enhanceDescription.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Enhance with AI
                      </>
                    )}
                  </Button>
                </div>
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Describe the work needed in detail" 
                  rows={8}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Enter a basic description, then click "Enhance with AI" to make it professional
                </p>
              </div>
              
              <div>
                <Label>Category</Label>
                <Input 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  placeholder="e.g., Plumbing, Electrical, Construction" 
                />
              </div>
              
              <div>
                <Label>Budget (R)</Label>
                <Input 
                  type="number" 
                  value={budget} 
                  onChange={(e) => setBudget(e.target.value)} 
                  placeholder="e.g., 5000" 
                />
              </div>
              
              <div>
                <Label>Location</Label>
                <Input 
                  value={location} 
                  onChange={(e) => setJobLocation(e.target.value)} 
                  placeholder="e.g., Estcourt" 
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={createJob.isPending} 
                className="w-full"
              >
                {createJob.isPending ? "Posting..." : "Post Job"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}