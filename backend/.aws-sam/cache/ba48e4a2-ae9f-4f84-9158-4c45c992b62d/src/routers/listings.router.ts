/**
 * Listings Router
 * Material listings for sellers
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';
import { scanItems } from '../lib/db.js';

export const listingsRouter = router({
  // Get my listings (seller)
  getMyListings: protectedProcedure
    .query(async ({ ctx }) => {
      const listings = await scanItems({
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk AND sellerId = :sellerId',
        ExpressionAttributeValues: {
          ':prefix': 'LISTING#',
          ':sk': 'METADATA',
          ':sellerId': ctx.user!.userId
        }
      });

      return listings.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    })
});
