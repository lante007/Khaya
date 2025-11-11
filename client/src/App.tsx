import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Workers from "./pages/Workers";
import Materials from "./pages/Materials";
import Jobs from "./pages/Jobs";
import PostJob from "./pages/PostJob";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import JobDetail from "./pages/JobDetail";
import WorkerDetail from "./pages/WorkerDetail";
import MaterialDetail from "./pages/MaterialDetail";
import Referrals from "./pages/Referrals";
import Stories from "./pages/Stories";
import ProviderOnboard from "./pages/ProviderOnboard";
import Showcase from "./pages/Showcase";
import AboutUs from "./pages/AboutUs";
import HowItWorks from "./pages/HowItWorks";
import TrustSafety from "./pages/TrustSafety";
import HelpCenter from "./pages/HelpCenter";
import ContactUs from "./pages/ContactUs";
import TermsPrivacy from "./pages/TermsPrivacy";
import SMSSupport from "./pages/SMSSupport";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminJobs from "./pages/AdminJobs";
import AdminPayments from "./pages/AdminPayments";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/join" component={Auth} />
      <Route path="/login" component={Auth} />
      <Route path="/signup" component={Auth} />
      <Route path="/workers" component={Workers} />
      <Route path="/workers/:id" component={WorkerDetail} />
      <Route path="/materials" component={Materials} />
      <Route path="/materials/:id" component={MaterialDetail} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/jobs/:id" component={JobDetail} />
      <Route path="/post-job" component={PostJob} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/referrals" component={Referrals} />
      <Route path="/stories" component={Stories} />
      <Route path="/provider/onboard" component={ProviderOnboard} />
      <Route path="/showcase/:userId" component={Showcase} />
      <Route path="/about" component={AboutUs} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/trust-safety" component={TrustSafety} />
      <Route path="/help" component={HelpCenter} />
      <Route path="/contact" component={ContactUs} />
      <Route path="/terms" component={TermsPrivacy} />
      <Route path="/sms-support" component={SMSSupport} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/jobs" component={AdminJobs} />
      <Route path="/admin/payments" component={AdminPayments} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
