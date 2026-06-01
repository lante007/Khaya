import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_TITLE } from "@/const";
import {
  Menu, X, Home, Briefcase, Package, PlusCircle, User, LogOut,
  MessageCircle, BookOpen, LayoutDashboard, Settings, Star,
  HardHat, DollarSign, FileText, ShoppingBag,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

type Role = "buyer" | "worker" | "supplier" | "admin";

interface NavLink {
  to: string;
  label: string;
  icon: React.ElementType;
}

const PUBLIC_LINKS: NavLink[] = [
  { to: "/",            label: "Home",        icon: Home },
  { to: "/jobs",        label: "Browse Jobs", icon: Briefcase },
  { to: "/workers",     label: "Find Workers",icon: HardHat },
  { to: "/stories",     label: "Stories",     icon: BookOpen },
  { to: "/price-guide", label: "Price Guide", icon: DollarSign },
];

const ROLE_LINKS: Record<Role, NavLink[]> = {
  buyer: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/post-job",  label: "Post a Job", icon: PlusCircle },
    { to: "/messages",  label: "Messages",   icon: MessageCircle },
  ],
  worker: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/messages",  label: "Messages",  icon: MessageCircle },
    { to: "/showcase",  label: "Showcase",  icon: Star },
    { to: "/profile",   label: "My Resume", icon: FileText },
  ],
  supplier: [
    { to: "/dashboard",  label: "Dashboard",   icon: LayoutDashboard },
    { to: "/materials",  label: "My Products", icon: Package },
    { to: "/messages",   label: "Messages",    icon: MessageCircle },
  ],
  admin: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin",     label: "Admin",     icon: Settings },
    { to: "/messages",  label: "Messages",  icon: MessageCircle },
    { to: "/materials", label: "Suppliers", icon: ShoppingBag },
  ],
};

function buildNavLinks(role: Role | null | undefined): NavLink[] {
  if (!role) return PUBLIC_LINKS;
  const roleLinks = ROLE_LINKS[role] ?? [];
  const seen = new Set(PUBLIC_LINKS.map(l => l.to));
  const extras = roleLinks.filter(l => !seen.has(l.to));
  return [...PUBLIC_LINKS, ...extras];
}

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      window.location.href = "/";
    },
  });

  const role = user?.role as Role | undefined;
  const navLinks = buildNavLinks(role);

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

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 font-medium transition-colors ${
                  location === to ? "text-primary" : "text-foreground hover:text-primary"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/profile">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Avatar src={undefined} name={user?.name ?? undefined} size="xs" />
                    {user?.name?.split(" ")[0] ?? "Profile"}
                  </Button>
                </Link>
                {role === "buyer" && (
                  <Link to="/post-job">
                    <Button className="flex items-center gap-2">
                      <PlusCircle className="w-4 h-4" />
                      Post a Job
                    </Button>
                  </Link>
                )}
                {role === "admin" && (
                  <Link to="/admin">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  onClick={() => logoutMutation.mutate()}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth?mode=signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth?role=buyer&mode=signup">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-3">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-2 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}

              {isAuthenticated && <div className="border-t border-border my-1" />}

              {isAuthenticated ? (
                <>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <User className="w-4 h-4" />
                      My Profile
                    </Button>
                  </Link>
                  {role === "buyer" && (
                    <Link to="/post-job" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full justify-start gap-2">
                        <PlusCircle className="w-4 h-4" />
                        Post a Job
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => { logoutMutation.mutate(); setMobileMenuOpen(false); }}
                    className="w-full justify-start gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth?mode=signin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/auth?role=buyer&mode=signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Get Started</Button>
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
