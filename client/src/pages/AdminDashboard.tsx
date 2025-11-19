import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, DollarSign, TrendingUp, LogOut, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();

  // Check if admin is logged in
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const { data: stats, isLoading } = trpc.admin.getDashboardStats.useQuery();
  const { data: profile } = trpc.admin.getProfile.useQuery();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    toast.success("Logged out successfully");
    setLocation("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Khaya Admin</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {profile?.name}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Users Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.users.verified || 0} verified
              </p>
              <div className="mt-2 text-xs">
                <span className="text-blue-600">{stats?.users.workers || 0} workers</span>
                {" • "}
                <span className="text-green-600">{stats?.users.clients || 0} clients</span>
              </div>
            </CardContent>
          </Card>

          {/* Jobs Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.jobs.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.jobs.open || 0} open jobs
              </p>
              <div className="mt-2 text-xs">
                <span className="text-orange-600">{stats?.jobs.inProgress || 0} in progress</span>
                {" • "}
                <span className="text-green-600">{stats?.jobs.completed || 0} completed</span>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R{(stats?.payments.totalRevenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.payments.completed || 0} completed payments
              </p>
            </CardContent>
          </Card>

          {/* Platform Fees Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R{(stats?.payments.platformFees || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                From {stats?.payments.completed || 0} transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your platform</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/admin/users")}
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/admin/jobs")}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Manage Jobs
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/admin/payments")}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              View Payments
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
