import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Home, Loader2 } from "lucide-react";
import { toast } from "sonner";

type UserRole = 'buyer' | 'worker' | 'supplier' | 'seller' | 'admin';
type AuthMode = 'signin' | 'signup';

export default function Auth() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'email' | 'otp' | 'signup'>('email');
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('buyer');
  const [loading, setLoading] = useState(false);
  const [devOTP, setDevOTP] = useState(''); // For development

  // Parse URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get('role') as UserRole;
    const urlMode = params.get('mode') as AuthMode;

    if (urlRole && ['buyer', 'worker', 'supplier', 'seller'].includes(urlRole)) {
      setRole(urlRole);
    }

    if (urlMode && ['signin', 'signup'].includes(urlMode)) {
      setMode(urlMode);
    }
  }, []);

  const handleRequestOTP = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual tRPC call
      const response = await fetch('/api/trpc/auth.requestOTP', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (data.result?.data?.success) {
        toast.success('OTP sent to your email!');
        if (data.result.data.otp) {
          setDevOTP(data.result.data.otp); // Show OTP in development
        }
        setStep('otp');
      }
    } catch (error) {
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual tRPC call
      const response = await fetch('/api/trpc/auth.verifyOTP', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();
      
      if (data.result?.data?.success) {
        if (data.result.data.isNewUser) {
          toast.success('Email verified! Please complete your profile.');
          setStep('signup');
        } else {
          // Existing user, save token and redirect
          localStorage.setItem('token', data.result.data.token);
          toast.success('Welcome back!');
          setLocation('/dashboard');
        }
      }
    } catch (error) {
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!name || !role) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual tRPC call
      const response = await fetch('/api/trpc/auth.signUp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role })
      });

      const data = await response.json();
      
      if (data.result?.data?.success) {
        localStorage.setItem('token', data.result.data.token);
        toast.success('Account created successfully!');
        
        // Redirect based on role
        if (role === 'worker' || role === 'supplier') {
          setLocation('/provider/onboard');
        } else {
          setLocation('/dashboard');
        }
      }
    } catch (error) {
      toast.error('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-earth p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Home className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {mode === 'signin' ? 'Welcome Back' : 'Welcome to Project Khaya'}
          </CardTitle>
          <CardDescription>
            {step === 'email' && mode === 'signup' && (
              <>
                {role === 'buyer' && 'Start your construction project today'}
                {role === 'worker' && 'Join as a skilled service provider'}
                {role === 'seller' && 'List your building materials'}
                {role === 'supplier' && 'Become a trusted supplier'}
              </>
            )}
            {step === 'email' && mode === 'signin' && 'Sign in to your account'}
            {step === 'otp' && 'Enter the OTP sent to your email'}
            {step === 'signup' && 'Complete your profile'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 'email' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  We'll send you a verification code via email
                </p>
              </div>

              <Button 
                onClick={handleRequestOTP} 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  mode === 'signin' ? 'Sign In' : 'Get Started'
                )}
              </Button>

              {/* Mode Toggle */}
              <div className="text-center text-sm text-muted-foreground">
                {mode === 'signup' ? (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => setMode('signin')}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <button
                      onClick={() => setMode('signup')}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4">
              {devOTP && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Development OTP:</strong> {devOTP}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                />
              </div>

              <Button 
                onClick={handleVerifyOTP} 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>

              <Button 
                variant="ghost" 
                onClick={() => setStep('email')} 
                className="w-full"
                disabled={loading}
              >
                Change Email Address
              </Button>
            </div>
          )}

          {step === 'signup' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>I am a *</Label>
                <Tabs value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buyer">Buyer</TabsTrigger>
                    <TabsTrigger value="worker">Worker</TabsTrigger>
                  </TabsList>
                  <TabsList className="grid w-full grid-cols-2 mt-2">
                    <TabsTrigger value="supplier">Supplier</TabsTrigger>
                    <TabsTrigger value="admin">Admin</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  {role === 'buyer' && '🏠 Find workers and materials for your projects'}
                  {role === 'worker' && '🔨 Offer your services and bid on jobs'}
                  {role === 'supplier' && '🏗️ List and sell building materials'}
                  {role === 'admin' && '👮 Moderate and verify users (Scout)'}
                </p>
              </div>

              <Button 
                onClick={handleSignUp} 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Complete Sign Up'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
