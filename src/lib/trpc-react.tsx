/**
 * tRPC React Query Hooks
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import type { AppRouter } from '../../backend/src/router';
import { getCurrentUser } from './auth';

export const trpcReact = createTRPCReact<AppRouter>();

const getAuthToken = async () => {
  try {
    const user = await getCurrentUser();
    return user?.signInUserSession?.idToken?.jwtToken || '';
  } catch {
    return '';
  }
};

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));

  const [trpcClient] = useState(() =>
    trpcReact.createClient({
      links: [
        httpBatchLink({
          url: import.meta.env.VITE_API_URL || 'http://localhost:3000/trpc',
          async headers() {
            const token = await getAuthToken();
            return {
              authorization: token ? `Bearer ${token}` : '',
            };
          },
        }),
      ],
    })
  );

  return (
    <trpcReact.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpcReact.Provider>
  );
}
