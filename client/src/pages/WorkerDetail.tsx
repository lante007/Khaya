import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import { MapPin, Star, Briefcase, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function WorkerDetail() {
  const [, params] = useRoute("/workers/:id");
  const userId = parseInt(params?.id || "0");
  const { data: profile, isLoading } = trpc.profile.get.useQuery({ userId });
  const { data: reviews } = trpc.review.getForUser.useQuery({ userId });
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center"><p>Profile not found</p></div>;
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="container py-8 max-w-4xl">
        <Card className="mb-6"><CardHeader><div className="flex items-start justify-between"><div className="flex items-center gap-4"><div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl">W</div><div><CardTitle className="text-2xl">Worker Profile</CardTitle><p className="text-muted-foreground flex items-center gap-1 mt-1"><Briefcase className="w-4 h-4" />{profile.trade || "General Worker"}</p></div></div>{profile.verified && <Badge className="bg-success/10 text-success"><Award className="w-4 h-4 mr-1" />Verified</Badge>}</div></CardHeader><CardContent><div className="space-y-4"><div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" />{profile.location}</div><div className="flex items-center gap-2"><Star className="w-5 h-5 text-accent fill-accent" /><span className="font-semibold">Trust Score: {profile.trustScore || 0}</span></div>{profile.bio && <div><h3 className="font-semibold mb-2">About</h3><p className="text-muted-foreground">{profile.bio}</p></div>}{profile.yearsExperience && <p className="text-sm text-muted-foreground">{profile.yearsExperience} years of experience</p>}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Reviews</CardTitle></CardHeader><CardContent>{reviews && reviews.length > 0 ? <div className="space-y-3">{reviews.map(item => <div key={item.review.id} className="p-4 border rounded-lg"><div className="flex items-center gap-2 mb-2"><Star className="w-4 h-4 text-accent fill-accent" /><span className="font-semibold">{item.review.rating}/5</span></div>{item.review.comment && <p className="text-sm text-muted-foreground">{item.review.comment}</p>}<p className="text-xs text-muted-foreground mt-2">By {item.reviewer?.name || "User"}</p></div>)}</div> : <p className="text-muted-foreground">No reviews yet</p>}</CardContent></Card>
      </div>
    </div>
  );
}