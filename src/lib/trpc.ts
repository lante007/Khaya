/**
 * tRPC Client Configuration
 */

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../backend/src/router';
import { getCurrentUser } from './auth';

const getAuthToken = async () => {
  try {
    const user = await getCurrentUser();
    return user?.signInUserSession?.idToken?.jwtToken || '';
  } catch {
    return '';
  }
};

export const trpc = createTRPCProxyClient<AppRouter>({
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
});
