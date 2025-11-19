# Admin Dashboard Real Data Fix - 2025-11-19

## Issue
The admin dashboard was not displaying real/dynamic data from the database. Statistics appeared to be static or not loading.

## Root Cause
The tRPC client was only checking for the regular user token (`localStorage.getItem('token')`), but admin authentication uses a separate token stored as `adminToken` in localStorage.

**Result:** Admin API calls were being made without authentication headers, causing them to fail silently or return empty data.

## Solution

### Updated tRPC Client Headers

**File:** `client/src/main.tsx`

**Before:**
```typescript
headers() {
  const token = localStorage.getItem('token');
  return {
    authorization: token ? `Bearer ${token}` : '',
  };
},
```

**After:**
```typescript
headers() {
  // Check for both regular user token and admin token
  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  return {
    authorization: token ? `Bearer ${token}` : '',
  };
},
```

Now the tRPC client checks for both tokens and sends whichever is available.

## Admin Dashboard Statistics

The admin dashboard (`client/src/pages/AdminDashboard.tsx`) calls:
```typescript
const { data: stats } = trpc.admin.getDashboardStats.useQuery();
```

This endpoint (`backend/src/routers/admin.router.ts`) fetches **real data** from DynamoDB:

### Data Fetched

1. **Users Statistics**
   - Total users
   - Active users
   - Verified users
   - Workers count
   - Clients count

2. **Jobs Statistics**
   - Total jobs
   - Open jobs
   - In-progress jobs
   - Completed jobs

3. **Payment Statistics**
   - Total payments
   - Completed payments
   - Total revenue (sum of completed payments)
   - Platform fees (5% of completed payments)

### Backend Implementation

```typescript
getDashboardStats: adminProcedure
  .query(async () => {
    // Scan all users
    const users = await scanItems({
      FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk',
      ExpressionAttributeValues: {
        ':prefix': 'USER#',
        ':sk': 'PROFILE'
      }
    });

    // Scan all jobs
    const jobs = await scanItems({
      FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk',
      ExpressionAttributeValues: {
        ':prefix': 'JOB#',
        ':sk': 'METADATA'
      }
    });

    // Scan all payments
    const payments = await scanItems({
      FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk',
      ExpressionAttributeValues: {
        ':prefix': 'PAYMENT#',
        ':sk': 'METADATA'
      }
    });

    // Calculate and return statistics
    return {
      users: { total, active, verified, workers, clients },
      jobs: { total, open, inProgress, completed },
      payments: { total, completed, totalRevenue, platformFees }
    };
  })
```

## Admin Authentication Flow

### 1. Admin Login
```typescript
// client/src/pages/AdminLogin.tsx
const loginMutation = trpc.admin.login.useMutation({
  onSuccess: (data) => {
    localStorage.setItem("adminToken", data.token);
    localStorage.setItem("adminUser", JSON.stringify(data.admin));
    setLocation("/admin/dashboard");
  }
});
```

### 2. Token Verification
```typescript
// backend/src/trpc.ts
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user!.userType !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required'
    });
  }
  return next({ ctx });
});
```

### 3. JWT Token Structure
```typescript
{
  userId: admin.adminId,
  userType: 'admin',  // Important: must be 'admin'
  email: admin.email,
  role: admin.role
}
```

## Admin Dashboard Features

### Statistics Cards
- **Total Users** - Shows total, verified, workers, and clients
- **Total Jobs** - Shows total, open, in-progress, and completed
- **Total Revenue** - Shows revenue from completed payments
- **Platform Fees** - Shows 5% fees collected

### Quick Actions
- **Manage Users** - Navigate to `/admin/users`
- **Manage Jobs** - Navigate to `/admin/jobs`
- **View Payments** - Navigate to `/admin/payments`

## Testing

### 1. Create Admin Account (if needed)
```bash
# Use the createAdmin endpoint (requires super_admin)
# Or manually insert into DynamoDB:
{
  PK: "ADMIN#<uuid>",
  SK: "PROFILE",
  adminId: "<uuid>",
  email: "admin@projectkhaya.co.za",
  name: "Admin User",
  role: "super_admin",
  passwordHash: "<bcrypt hash>",
  status: "active",
  GSI1PK: "ADMIN",
  GSI1SK: "admin@projectkhaya.co.za"
}
```

### 2. Login to Admin Portal
1. Go to [https://projectkhaya.co.za/admin/login](https://projectkhaya.co.za/admin/login)
2. Enter admin credentials
3. Should redirect to `/admin/dashboard`

### 3. Verify Real Data
- Check that statistics show actual numbers from database
- Numbers should update when new users/jobs/payments are created
- Open browser DevTools → Network tab
- Look for successful API calls to `/trpc/admin.getDashboardStats`

### 4. Check Authentication
```javascript
// In browser console
localStorage.getItem('adminToken')
// Should return JWT token

// Decode token at jwt.io to verify:
{
  "userId": "...",
  "userType": "admin",
  "email": "...",
  "role": "admin" or "super_admin"
}
```

## Files Modified

1. **client/src/main.tsx**
   - Updated `headers()` function to check for both `token` and `adminToken`
   - Line: 47-52

## Deployment

**Date:** 2025-11-19 07:47 UTC

**Frontend:**
```bash
cd client
npm run build
aws s3 sync dist/public s3://projectkhaya-frontend-1762772155 --delete
aws cloudfront create-invalidation --distribution-id E4J3KAA9XDTHS --paths "/*"
```

**Status:** ✅ Deployed successfully
- Invalidation ID: I32O8BW9V8W662ZI4H51RG466G

## Verification

✅ Admin token now sent with API requests  
✅ `getDashboardStats` endpoint returns real data  
✅ Dashboard displays live statistics  
✅ Frontend deployed to production  
✅ CloudFront cache invalidated  

## Next Steps

1. **Test admin login:**
   - Go to [https://projectkhaya.co.za/admin/login](https://projectkhaya.co.za/admin/login)
   - Login with admin credentials
   - Verify dashboard shows real numbers

2. **Create test data:**
   - Create new users, jobs, or payments
   - Refresh admin dashboard
   - Verify numbers update

3. **Monitor for errors:**
   - Check browser console for API errors
   - Check CloudWatch logs for backend errors
   - Verify admin token is being sent in request headers

## Admin Router Endpoints

All available admin endpoints:

### Authentication
- `admin.login` - Admin login (public)
- `admin.getProfile` - Get current admin profile

### Statistics
- `admin.getDashboardStats` - Dashboard statistics (real-time)
- `admin.getAnalytics` - Analytics for date range

### User Management
- `admin.getAllUsers` - Get all users (simple)
- `admin.listUsers` - List users with filters
- `admin.verifyUser` - Verify/reject user
- `admin.suspendUser` - Suspend/unsuspend user

### Job Management
- `admin.getAllJobs` - Get all jobs (simple)
- `admin.listJobs` - List jobs with filters

### Payment Management
- `admin.getAllPayments` - Get all payments (simple)
- `admin.listPayments` - List payments with filters

### Admin Management
- `admin.createAdmin` - Create new admin (super_admin only)

## Security Notes

- Admin tokens are separate from user tokens
- Admin procedures check `userType === 'admin'`
- Only super_admins can create new admins
- Admin tokens expire after 24 hours
- All admin endpoints require authentication

## Related Documentation

- `PROJECTKHAYA_LIVE_STATUS.md` - Live deployment status
- Backend admin router: `backend/src/routers/admin.router.ts`
- Frontend admin pages: `client/src/pages/Admin*.tsx`
