import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery({});
  const upsertProfile = trpc.profile.upsert.useMutation();
  const updateRole = trpc.user.updateRole.useMutation();
  const [bio, setBio] = useState("");
  const [trade, setTrade] = useState("");
  const [location, setLocation] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [role, setRole] = useState<string>(user?.role || "buyer");
  
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setTrade(profile.trade || "");
      setLocation(profile.location || "");
      setYearsExp(profile.yearsExperience?.toString() || "");
    }
  }, [profile]);
  
  const handleSave = () => {
    upsertProfile.mutate({
      bio, trade: trade || undefined, location, yearsExperience: yearsExp ? parseInt(yearsExp) : undefined,
    }, {
      onSuccess: () => toast.success("Profile updated!"),
      onError: () => toast.error("Failed to update profile"),
    });
  };
  
  const handleRoleChange = (newRole: string) => {
    updateRole.mutate({ role: newRole as "buyer" | "worker" | "supplier" }, {
      onSuccess: () => { setRole(newRole); toast.success("Role updated!"); window.location.reload(); },
      onError: () => toast.error("Failed to update role"),
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="container py-8 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">My Profile</h1>
        <Card className="mb-6"><CardHeader><CardTitle>Account Information</CardTitle></CardHeader><CardContent><div className="space-y-4"><div><Label>Name</Label><Input value={user?.name || ""} disabled /></div><div><Label>Email</Label><Input value={user?.email || ""} disabled /></div><div><Label>Role</Label><Select value={role} onValueChange={handleRoleChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="buyer">Buyer</SelectItem><SelectItem value="worker">Worker</SelectItem><SelectItem value="supplier">Supplier</SelectItem></SelectContent></Select></div></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Profile Details</CardTitle></CardHeader><CardContent><div className="space-y-4"><div><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself" /></div><div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Estcourt" /></div>{role === "worker" && (<><div><Label>Trade/Skill</Label><Input value={trade} onChange={(e) => setTrade(e.target.value)} placeholder="e.g., Plumber, Electrician" /></div><div><Label>Years of Experience</Label><Input type="number" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} placeholder="e.g., 5" /></div></>)}<Button onClick={handleSave} disabled={upsertProfile.isPending}>Save Changes</Button></div></CardContent></Card>
      </div>
    </div>
  );
}