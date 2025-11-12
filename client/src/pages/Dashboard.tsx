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
  const { data: myJobs, isLoading: jobsLoading, error: jobsError } = trpc.job.getMyJobs.useQuery();
  const { data: myBids, isLoading: bidsLoading, error: bidsError } = trpc.bid.getMyBids.useQuery();
  const { data: myListings, isLoading: listingsLoading, error: listingsError } = trpc.listing.getMyListings.useQuery();
  const { data: notifications, isLoading: notificationsLoading, error: notificationsError } = trpc.notification.getMyNotifications.useQuery();
  
  const formatPrice = (amount: number) => {
    if (!amount) return 'R0.00';
    // Handle both cents and rands
    const value = amount > 1000 ? amount / 100 : amount;
    return `R${value.toFixed(2)}`;
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="container py-8">
        <div className="mb-8"><h1 className="text-4xl font-bold mb-2">Dashboard</h1><p className="text-lg text-muted-foreground">Welcome back, {user?.name || "User"}!</p></div>
        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="grid w-full grid-cols-4"><TabsTrigger value="jobs">My Jobs</TabsTrigger><TabsTrigger value="bids">My Bids</TabsTrigger><TabsTrigger value="listings">My Listings</TabsTrigger><TabsTrigger value="notifications">Notifications</TabsTrigger></TabsList>
          <TabsContent value="jobs" className="space-y-4"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" />Posted Jobs</CardTitle><CardDescription>Jobs you have posted</CardDescription></CardHeader><CardContent>{jobsLoading ? <p className="text-muted-foreground">Loading jobs...</p> : jobsError ? <p className="text-red-500">Error loading jobs</p> : myJobs && myJobs.length > 0 ? <div className="space-y-3">{myJobs.map((job: any) => <div key={job.jobId || job.id} className="p-4 border rounded-lg"><div className="flex justify-between items-start"><div><h3 className="font-semibold">{job.title || 'Untitled Job'}</h3><p className="text-sm text-muted-foreground">{job.category || 'General'} · {job.location || 'Location TBD'}</p></div><span className="text-sm font-medium">{formatPrice(job.budget)}</span></div><Link to={`/jobs/${job.jobId || job.id}`}><Button size="sm" className="mt-2">View Details</Button></Link></div>)}</div> : <p className="text-muted-foreground">No jobs posted yet</p>}</CardContent></Card></TabsContent>
          <TabsContent value="bids" className="space-y-4"><Card><CardHeader><CardTitle>My Bids</CardTitle><CardDescription>Bids you have submitted</CardDescription></CardHeader><CardContent>{bidsLoading ? <p className="text-muted-foreground">Loading bids...</p> : bidsError ? <p className="text-red-500">Error loading bids</p> : myBids && myBids.length > 0 ? <div className="space-y-3">{myBids.map((item: any) => <div key={item.bid?.bidId || item.bid?.id || Math.random()} className="p-4 border rounded-lg"><div className="flex justify-between items-start"><div><h3 className="font-semibold">{item.job?.title || 'Job'}</h3><p className="text-sm text-muted-foreground">Your bid: {formatPrice(item.bid?.amount || 0)}</p></div><span className="text-sm font-medium capitalize">{item.bid?.status || 'pending'}</span></div></div>)}</div> : <p className="text-muted-foreground">No bids submitted yet</p>}</CardContent></Card></TabsContent>
          <TabsContent value="listings" className="space-y-4"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" />My Listings</CardTitle><CardDescription>Materials you are selling</CardDescription></CardHeader><CardContent>{listingsLoading ? <p className="text-muted-foreground">Loading listings...</p> : listingsError ? <p className="text-red-500">Error loading listings</p> : myListings && myListings.length > 0 ? <div className="space-y-3">{myListings.map((listing: any) => <div key={listing.listingId || listing.id} className="p-4 border rounded-lg"><div className="flex justify-between items-start"><div><h3 className="font-semibold">{listing.title || 'Untitled'}</h3><p className="text-sm text-muted-foreground">{listing.category || 'General'} · {listing.stock || 0} in stock</p></div><span className="text-sm font-medium">{formatPrice(listing.price)}/{listing.unit || 'unit'}</span></div></div>)}</div> : <p className="text-muted-foreground">No listings created yet</p>}</CardContent></Card></TabsContent>
          <TabsContent value="notifications" className="space-y-4"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" />Notifications</CardTitle></CardHeader><CardContent>{notificationsLoading ? <p className="text-muted-foreground">Loading notifications...</p> : notificationsError ? <p className="text-red-500">Error loading notifications</p> : notifications && notifications.length > 0 ? <div className="space-y-3">{notifications.map((notif: any) => <div key={notif.notificationId || notif.id || Math.random()} className={`p-4 border rounded-lg ${!notif.read ? "bg-primary/5" : ""}`}><h3 className="font-semibold">{notif.title || 'Notification'}</h3><p className="text-sm text-muted-foreground">{notif.message || ''}</p></div>)}</div> : <p className="text-muted-foreground">No notifications</p>}</CardContent></Card></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}