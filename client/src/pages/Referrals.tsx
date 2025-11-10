import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Gift, Users, CheckCircle } from "lucide-react";

export default function Referrals() {
  const { data: referrals } = trpc.referral.getMy.useQuery();
  const { data: balance } = trpc.credits.getBalance.useQuery();
  const createReferral = trpc.referral.create.useMutation();
  const [email, setEmail] = useState("");
  
  const handleCreate = () => {
    createReferral.mutate({ referredEmail: email }, {
      onSuccess: (data: any) => {
        toast.success("Referral code created!");
        setEmail("");
      },
    });
  };
  
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };
  
  const formatCents = (cents: number) => `R${(cents / 100).toFixed(2)}`;
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="container py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Referral Program</h1>
        <p className="text-lg text-muted-foreground mb-8">Earn R50 for every friend you refer!</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card><CardHeader><Gift className="w-8 h-8 text-primary mb-2" /><CardTitle>Your Balance</CardTitle><CardDescription>Available credits</CardDescription></CardHeader><CardContent><p className="text-3xl font-bold text-primary">{formatCents(balance || 0)}</p></CardContent></Card>
          <Card><CardHeader><Users className="w-8 h-8 text-accent mb-2" /><CardTitle>Total Referrals</CardTitle><CardDescription>Friends joined</CardDescription></CardHeader><CardContent><p className="text-3xl font-bold text-accent">{referrals?.filter((r: any) => r.status === "completed").length || 0}</p></CardContent></Card>
        </div>
        
        <Card className="mb-8"><CardHeader><CardTitle>Create Referral Link</CardTitle><CardDescription>Share with friends to earn rewards</CardDescription></CardHeader><CardContent><div className="flex gap-2"><Input placeholder="Friend's email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} /><Button onClick={handleCreate} disabled={createReferral.isPending}>Generate Code</Button></div></CardContent></Card>
        
        <Card><CardHeader><CardTitle>Your Referral Codes</CardTitle></CardHeader><CardContent>{referrals && referrals.length > 0 ? <div className="space-y-3">{referrals.map((ref: any) => <div key={ref.id} className="flex items-center justify-between p-4 border rounded-lg"><div><p className="font-mono font-bold text-lg">{ref.referralCode}</p><p className="text-sm text-muted-foreground capitalize">{ref.status}</p></div><div className="flex gap-2">{ref.status === "completed" && <CheckCircle className="w-5 h-5 text-success" />}<Button size="sm" variant="outline" onClick={() => copyCode(ref.referralCode)}><Copy className="w-4 h-4" /></Button></div></div>)}</div> : <p className="text-muted-foreground">No referrals yet</p>}</CardContent></Card>
      </div>
    </div>
  );
}