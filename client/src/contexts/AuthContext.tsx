import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';

type UserRole = 'buyer' | 'worker' | 'supplier' | 'admin';

interface User {
  id: number;
  name: string;
  email?: string;
  phone: string;
  role: UserRole;
  profilePictureUrl?: string | null;
  bio?: string;
  location?: string;
  skills?: string[];
  verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      // TODO: Verify token and fetch user data
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      // TODO: Replace with actual tRPC call
      const response = await fetch('/api/trpc/auth.me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      
      if (data.result?.data) {
        setUser(data.result.data);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Invalid token, clear it
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLocation('/');
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected Route Component
export function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: ReactNode; 
  allowedRoles?: UserRole[] 
}) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/join');
    } else if (!isLoading && allowedRoles && !hasRole(allowedRoles)) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, isLoading, allowedRoles, hasRole, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}
