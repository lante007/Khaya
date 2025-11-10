import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Briefcase, Package, User, Bell } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: myJobs } = trpc.job.getMyJobs.useQuery();
  const { data: myBids } = trpc.bid.getMyBids.useQuery();
  const { data: myListings } = trpc.listing.getMyListings.useQuery();
  const { data: notifications } = trpc.notification.getMyNotifications.useQuery();
  const formatPrice = (cents: number) => `R${(cents / 100).toFixed(2)}`;
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="container py-8">
        <div className="mb-8"><h1 className="text-4xl font-bold mb-2">Dashboard</h1><p className="text-lg text-muted-foreground">Welcome back, {user?.name || "User"}!</p></div>
        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="grid w-full grid-cols-4"><TabsTrigger value="jobs">My Jobs</TabsTrigger><TabsTrigger value="bids">My Bids</TabsTrigger><TabsTrigger value="listings">My Listings</TabsTrigger><TabsTrigger value="notifications">Notifications</TabsTrigger></TabsList>
          <TabsContent value="jobs" className="space-y-4"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" />Posted Jobs</CardTitle><CardDescription>Jobs you have posted</CardDescription></CardHeader><CardContent>{myJobs && myJobs.length > 0 ? <div className="space-y-3">{myJobs.map(job => <div key={job.id} className="p-4 border rounded-lg"><div className="flex justify-between items-start"><div><h3 className="font-semibold">{job.title}</h3><p className="text-sm text-muted-foreground">{job.category} · {job.location}</p></div><span className="text-sm font-medium">{formatPrice(job.budget)}</span></div><Link href={`/jobs/${job.id}`}><Button size="sm" className="mt-2">View Details</Button></Link></div>)}</div> : <p className="text-muted-foreground">No jobs posted yet</p>}</CardContent></Card></TabsContent>
          <TabsContent value="bids" className="space-y-4"><Card><CardHeader><CardTitle>My Bids</CardTitle><CardDescription>Bids you have submitted</CardDescription></CardHeader><CardContent>{myBids && myBids.length > 0 ? <div className="space-y-3">{myBids.map(item => <div key={item.bid.id} className="p-4 border rounded-lg"><div className="flex justify-between items-start"><div><h3 className="font-semibold">{item.job?.title}</h3><p className="text-sm text-muted-foreground">Your bid: {formatPrice(item.bid.amount)}</p></div><span className="text-sm font-medium capitalize">{item.bid.status}</span></div></div>)}</div> : <p className="text-muted-foreground">No bids submitted yet</p>}</CardContent></Card></TabsContent>
          <TabsContent value="listings" className="space-y-4"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" />My Listings</CardTitle><CardDescription>Materials you are selling</CardDescription></CardHeader><CardContent>{myListings && myListings.length > 0 ? <div className="space-y-3">{myListings.map(listing => <div key={listing.id} className="p-4 border rounded-lg"><div className="flex justify-between items-start"><div><h3 className="font-semibold">{listing.title}</h3><p className="text-sm text-muted-foreground">{listing.category} · {listing.stock} in stock</p></div><span className="text-sm font-medium">{formatPrice(listing.price)}/{listing.unit}</span></div></div>)}</div> : <p className="text-muted-foreground">No listings created yet</p>}</CardContent></Card></TabsContent>
          <TabsContent value="notifications" className="space-y-4"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" />Notifications</CardTitle></CardHeader><CardContent>{notifications && notifications.length > 0 ? <div className="space-y-3">{notifications.map(notif => <div key={notif.id} className={`p-4 border rounded-lg ${!notif.read ? "bg-primary/5" : ""}`}><h3 className="font-semibold">{notif.title}</h3><p className="text-sm text-muted-foreground">{notif.message}</p></div>)}</div> : <p className="text-muted-foreground">No notifications</p>}</CardContent></Card></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}