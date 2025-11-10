import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Upload, CheckCircle } from "lucide-react";

const TRADES = ["Plumber", "Electrician", "Builder", "Carpenter", "Painter", "Roofer", "Tiler", "Landscaper", "General Worker"];

export default function ProviderOnboard() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    trade: "",
    bio: "",
    location: "",
    yearsExperience: 0,
    skills: [] as string[],
    certifications: "",
    photoUrl: "",
  });

  const createProfile = trpc.profile.upsert.useMutation();

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    createProfile.mutate(formData, {
      onSuccess: () => {
        toast.success("Profile created! Welcome to Khaya!");
        setLocation("/dashboard");
      },
      onError: (error) => {
        toast.error("Failed to create profile: " + error.message);
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="container py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Join as a Provider</h1>
          <p className="text-lg text-muted-foreground">Set up your profile and start getting jobs</p>
        </div>

        <div className="flex justify-between mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex items-center ${s < 4 ? "flex-1" : ""}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 4 && <div className={`flex-1 h-1 mx-2 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Basic Information"}
              {step === 2 && "Skills & Experience"}
              {step === 3 && "Location & Availability"}
              {step === 4 && "Review & Submit"}
            </CardTitle>
            <CardDescription>Step {step} of 4</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <Label>Trade/Profession</Label>
                  <Select value={formData.trade} onValueChange={(v) => setFormData({ ...formData, trade: v })}>
                    <SelectTrigger><SelectValue placeholder="Select your trade" /></SelectTrigger>
                    <SelectContent>{TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bio</Label>
                  <Textarea placeholder="Tell buyers about yourself..." value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={4} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <Label>Years of Experience</Label>
                  <Input type="number" value={formData.yearsExperience} onChange={(e) => setFormData({ ...formData, yearsExperience: parseInt(e.target.value) })} />
                </div>
                <div>
                  <Label>Certifications (optional)</Label>
                  <Textarea placeholder="List your certifications..." value={formData.certifications} onChange={(e) => setFormData({ ...formData, certifications: e.target.value })} />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <Label>Location</Label>
                  <Input placeholder="e.g., Estcourt, KZN" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                </div>
                <div>
                  <Label>Profile Photo URL (optional)</Label>
                  <Input placeholder="https://..." value={formData.photoUrl} onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })} />
                </div>
              </>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div><strong>Trade:</strong> {formData.trade}</div>
                <div><strong>Location:</strong> {formData.location}</div>
                <div><strong>Experience:</strong> {formData.yearsExperience} years</div>
                <div><strong>Bio:</strong> {formData.bio}</div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              {step > 1 && <Button variant="outline" onClick={handleBack}>Back</Button>}
              {step < 4 ? (
                <Button onClick={handleNext} className="ml-auto">Next</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={createProfile.isPending} className="ml-auto">
                  {createProfile.isPending ? "Creating..." : "Complete Setup"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}