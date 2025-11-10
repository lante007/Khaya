import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Heart, Star } from "lucide-react";
import { Link } from "wouter";

export default function Stories() {
  const { data: featured } = trpc.story.getFeatured.useQuery();
  const { data: stories } = trpc.story.getApproved.useQuery({ limit: 20 });
  const likeStory = trpc.story.like.useMutation();
  
  const handleLike = (id: number) => {
    likeStory.mutate({ id }, {
      onSuccess: () => window.location.reload(),
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="container py-8">
        <div className="mb-8"><h1 className="text-4xl font-bold mb-2">Community Stories</h1><p className="text-lg text-muted-foreground">Real experiences from our community</p></div>
        
        {featured && featured.length > 0 && (
          <div className="mb-12"><h2 className="text-2xl font-bold mb-4">Featured Stories</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{featured.map((story: any) => <Card key={story.id} className="hover:shadow-lg transition-shadow border-2 border-primary/20"><CardHeader><CardTitle className="text-lg">{story.title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground line-clamp-4">{story.content}</p><div className="flex items-center justify-between mt-4"><Button size="sm" variant="ghost" onClick={() => handleLike(story.id)}><Heart className="w-4 h-4 mr-1" />{story.likes}</Button><span className="text-xs text-muted-foreground capitalize">{story.type}</span></div></CardContent></Card>)}</div></div>
        )}
        
        <div><h2 className="text-2xl font-bold mb-4">All Stories</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{stories && stories.map((story: any) => <Card key={story.id} className="hover:shadow-lg transition-shadow"><CardHeader><CardTitle>{story.title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{story.content}</p><div className="flex items-center justify-between mt-4"><Button size="sm" variant="ghost" onClick={() => handleLike(story.id)}><Heart className="w-4 h-4 mr-1" />{story.likes}</Button><span className="text-xs text-muted-foreground capitalize">{story.type}</span></div></CardContent></Card>)}</div></div>
      </div>
    </div>
  );
}