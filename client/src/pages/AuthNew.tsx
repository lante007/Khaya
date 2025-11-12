import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Home, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type UserType = 'buyer' | 'worker' | 'seller';

export default function AuthNew() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'contact' | 'otp' | 'profile'>('contact');
  const [method, setMethod] = useState<'phone' | 'email'>('email');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('buyer');
  const [userId, setUserId] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  // Request OTP mutation
  const requestOTPMutation = trpc.auth.requestOTP.useMutation({
    onSuccess: (data) => {
      toast.success('OTP sent to your phone!');
      setStep('otp');
    },
    onError: (error) => {
      toast.error(`Failed to send OTP: ${error.message}`);
    },
  });

  // Verify OTP mutation
  const verifyOTPMutation = trpc.auth.verifyOTP.useMutation({
    onSuccess: (data) => {
      if (data.isNewUser) {
        toast.success('Phone verified! Please complete your profile.');
        setIsNewUser(true);
        setStep('profile');
      } else {
        // Existing user - save token and redirect
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Welcome back!');
        setLocation('/dashboard');
      }
    },
    onError: (error) => {
      toast.error(`Invalid OTP: ${error.message}`);
    },
  });

  // Sign up mutation
  const signUpMutation = trpc.auth.signUp.useMutation({
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Account created successfully!');
      
      // Redirect based on user type
      if (userType === 'worker') {
        setLocation('/provider/onboard');
      } else {
        setLocation('/dashboard');
      }
    },
    onError: (error) => {
      toast.error(`Sign up failed: ${error.message}`);
    },
  });

  const handleRequestOTP = () => {
    if (method === 'phone') {
      if (!phone || phone.length < 10) {
        toast.error('Please enter a valid phone number');
        return;
      }
      requestOTPMutation.mutate({
        phone
      } as any);
    } else {
      if (!email || !email.includes('@')) {
        toast.error('Please enter a valid email address');
        return;
      }
      requestOTPMutation.mutate({
        email
      } as any);
    }
  };

  const handleVerifyOTP = () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    const payload: any = { otp };
    if (method === 'phone') {
      payload.phone = phone;
    } else {
      payload.email = email;
    }

    verifyOTPMutation.mutate(payload);
  };

  const handleSignUp = () => {
    if (!name || !password || password.length < 8) {
      toast.error('Please fill in all required fields (password must be 8+ characters)');
      return;
    }

    // Phone is required by backend, use a placeholder if using email method
    const phoneToUse = method === 'phone' ? phone : '+27000000000';

    signUpMutation.mutate({
      phone: phoneToUse,
      email: method === 'email' ? email : (email || undefined),
      password,
      userType,
      name
    });
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as South African number
    if (digits.startsWith('27')) {
      return digits;
    } else if (digits.startsWith('0')) {
      return '27' + digits.slice(1);
    }
    return digits;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const isLoading = requestOTPMutation.isLoading || verifyOTPMutation.isLoading || signUpMutation.isLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Home className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {step === 'contact' && 'Welcome to Project Khaya'}
            {step === 'otp' && `Verify Your ${method === 'phone' ? 'Phone' : 'Email'}`}
            {step === 'profile' && 'Complete Your Profile'}
          </CardTitle>
          <CardDescription>
            {step === 'contact' && 'Enter your contact details to get started'}
            {step === 'otp' && `Enter the OTP sent to your ${method === 'phone' ? 'phone' : 'email'}`}
            {step === 'profile' && 'Tell us a bit about yourself'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 'contact' && (
            <div className="space-y-4">
              <Tabs value={method} onValueChange={(v) => setMethod(v as 'phone' | 'email')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email">Email</TabsTrigger>
                  <TabsTrigger value="phone">Phone</TabsTrigger>
                </TabsList>
              </Tabs>

              {method === 'email' ? (
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send you a verification code via email
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0812345678 or 27812345678"
                    value={phone}
                    onChange={handlePhoneChange}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send you a verification code via SMS
                  </p>
                </div>
              )}

              <Button 
                onClick={handleRequestOTP} 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                />
              </div>

              <Button 
                onClick={handleVerifyOTP} 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
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
                onClick={() => setStep('contact')} 
                className="w-full"
                disabled={isLoading}
              >
                Change {method === 'phone' ? 'Phone Number' : 'Email Address'}
              </Button>
            </div>
          )}

          {step === 'profile' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {method === 'phone' && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              )}

              {method === 'email' && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0812345678"
                    value={phone}
                    onChange={handlePhoneChange}
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>I am a *</Label>
                <Tabs value={userType} onValueChange={(v) => setUserType(v as UserType)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="buyer">Buyer</TabsTrigger>
                    <TabsTrigger value="worker">Worker</TabsTrigger>
                    <TabsTrigger value="seller">Seller</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  {userType === 'buyer' && '🏠 Find workers and materials for your projects'}
                  {userType === 'worker' && '🔨 Offer your services and bid on jobs'}
                  {userType === 'seller' && '🏗️ List and sell building materials'}
                </p>
              </div>

              <Button 
                onClick={handleSignUp} 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
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
