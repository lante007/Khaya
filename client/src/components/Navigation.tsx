import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, APP_TITLE } from "@/const";
import { Menu, X, Home, Briefcase, Package, PlusCircle, User, LogOut } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      window.location.href = "/";
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
                K
              </div>
              <span className="text-xl font-bold text-foreground">{APP_TITLE}</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-2">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link to="/stories" className="text-foreground hover:text-primary transition-colors font-medium">
              Stories
            </Link>
            <Link to="/workers" className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Find Workers
            </Link>
            <Link to="/materials" className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Materials
            </Link>
            <Link to="/jobs" className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Browse Jobs
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/post-job">
                  <Button variant="outline" className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" />
                    Post a Job
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Avatar 
                      src={user?.profilePictureUrl} 
                      name={user?.name} 
                      size="xs"
                    />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth?mode=signin">
                  <Button variant="ghost">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth?role=buyer&mode=signup">
                  <Button>
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-2 py-2">
                <Home className="w-4 h-4" />
                Home
              </Link>
              <Link to="/workers" className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-2 py-2">
                <Briefcase className="w-4 h-4" />
                Find Workers
              </Link>
              <Link to="/materials" className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-2 py-2">
                <Package className="w-4 h-4" />
                Materials
              </Link>
              <Link to="/jobs" className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-2 py-2">
                <Briefcase className="w-4 h-4" />
                Browse Jobs
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link to="/post-job">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <PlusCircle className="w-4 h-4" />
                      Post a Job
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <User className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-2">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth?mode=signin">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth?role=buyer&mode=signup">
                    <Button className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
