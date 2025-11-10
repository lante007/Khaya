import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
