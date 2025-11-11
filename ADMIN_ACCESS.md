# Admin Access Guide

## 🔐 Admin System Overview

Khaya has a complete admin system for platform management with role-based access control.

---

## 👥 Admin Roles

### Super Admin
- Full platform access
- Can create other admins
- Manage all users, jobs, and payments
- View analytics and reports
- Suspend/unsuspend users

### Admin
- Manage users and jobs
- View payments and analytics
- Verify users
- Cannot create other admins

---

## 🚀 Creating the First Admin

### Method 1: Interactive Script

```bash
cd backend
npm run build
tsx scripts/create-admin.ts
```

Follow the prompts:
- Email: admin@khaya.co.za
- Name: Admin Name
- Password: (min 8 characters)

### Method 2: Environment Variables

```bash
cd backend
export ADMIN_EMAIL="admin@khaya.co.za"
export ADMIN_NAME="Super Admin"
export ADMIN_PASSWORD="YourSecurePassword123"
export AWS_REGION="af-south-1"
export DYNAMODB_TABLE_NAME="khaya-prod"

./scripts/seed-admin.sh
```

### Method 3: Direct DynamoDB Insert

Use AWS Console or CLI to insert directly into DynamoDB:

```json
{
  "PK": "ADMIN#<uuid>",
  "SK": "PROFILE",
  "adminId": "<uuid>",
  "email": "admin@khaya.co.za",
  "name": "Super Admin",
  "role": "super_admin",
  "passwordHash": "<bcrypt-hash>",
  "status": "active",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "GSI1PK": "ADMIN",
  "GSI1SK": "admin@khaya.co.za"
}
```

---

## 🔑 Admin Login

### Frontend Access

1. Navigate to: `https://khaya.co.za/admin/login`
2. Enter admin email and password
3. Click "Sign In"
4. Redirected to admin dashboard

### API Access

```typescript
// Login
const response = await trpc.admin.login.mutate({
  email: "admin@khaya.co.za",
  password: "YourPassword123"
});

// Store token
localStorage.setItem("adminToken", response.token);

// Use token in subsequent requests
// The token contains: userId, userType: 'admin', email, role
```

---

## 📊 Admin Dashboard Features

### Dashboard Overview
- Total users (workers, clients, verified)
- Total jobs (open, in progress, completed)
- Total revenue and platform fees
- Payment statistics

### User Management
- List all users with filters
- View user details
- Verify/reject user verification requests
- Suspend/unsuspend users
- Search by email, name, or user type

### Job Management
- List all jobs with filters
- View job details
- Monitor job status
- View bids and assignments

### Payment Management
- List all payments
- View payment details
- Track revenue and fees
- Monitor payment status

### Analytics
- Date range reports
- New user growth
- Job creation trends
- Revenue analytics
- Platform fee tracking

---

## 🔧 Admin API Endpoints

### Authentication

```typescript
// Login
trpc.admin.login.mutate({
  email: string,
  password: string
})

// Get profile
trpc.admin.getProfile.query()
```

### Dashboard

```typescript
// Get dashboard stats
trpc.admin.getDashboardStats.query()

// Get analytics
trpc.admin.getAnalytics.query({
  startDate: "2025-01-01",
  endDate: "2025-12-31"
})
```

### User Management

```typescript
// List users
trpc.admin.listUsers.query({
  userType: 'all' | 'client' | 'worker' | 'buyer',
  status: 'all' | 'active' | 'suspended' | 'pending',
  verified: boolean,
  limit: 50,
  cursor: string
})

// Verify user
trpc.admin.verifyUser.mutate({
  userId: string,
  approved: boolean,
  notes: string
})

// Suspend user
trpc.admin.suspendUser.mutate({
  userId: string,
  suspend: boolean,
  reason: string
})
```

### Job Management

```typescript
// List jobs
trpc.admin.listJobs.query({
  status: 'all' | 'open' | 'in_progress' | 'completed' | 'cancelled',
  limit: 50,
  cursor: string
})
```

### Payment Management

```typescript
// List payments
trpc.admin.listPayments.query({
  status: 'all' | 'pending' | 'completed' | 'failed',
  limit: 50,
  cursor: string
})
```

### Admin Management (Super Admin Only)

```typescript
// Create new admin
trpc.admin.createAdmin.mutate({
  email: string,
  password: string,
  name: string,
  role: 'admin' | 'super_admin'
})
```

---

## 🔒 Security Features

### Password Security
- Minimum 8 characters
- Bcrypt hashing with salt rounds: 10
- Passwords never stored in plain text

### JWT Tokens
- 24-hour expiration
- Contains: userId, userType, email, role
- Signed with secret key
- Verified on every request

### Role-Based Access
- `adminProcedure` - Requires admin or super_admin
- Super admin checks for sensitive operations
- Automatic authorization on all endpoints

### Audit Trail
- Last login timestamp tracked
- Created by field for new admins
- All actions logged in CloudWatch

---

## 📱 Admin Routes

Add these routes to your frontend router:

```typescript
// In your router configuration
{
  path: "/admin/login",
  component: AdminLogin
},
{
  path: "/admin/dashboard",
  component: AdminDashboard
},
{
  path: "/admin/users",
  component: AdminUsers
},
{
  path: "/admin/jobs",
  component: AdminJobs
},
{
  path: "/admin/payments",
  component: AdminPayments
}
```

---

## 🧪 Testing Admin Access

### 1. Create Test Admin

```bash
cd backend
export ADMIN_EMAIL="test@admin.com"
export ADMIN_NAME="Test Admin"
export ADMIN_PASSWORD="TestPass123"
./scripts/seed-admin.sh
```

### 2. Test Login

```bash
curl -X POST https://your-api-url/trpc/admin.login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@admin.com",
    "password": "TestPass123"
  }'
```

### 3. Test Dashboard

```bash
curl https://your-api-url/trpc/admin.getDashboardStats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🚨 Important Security Notes

1. **Never commit admin credentials**
   - Use environment variables
   - Store securely in AWS Secrets Manager
   - Rotate passwords regularly

2. **Limit admin access**
   - Only create admins when necessary
   - Use regular admin role for most tasks
   - Reserve super_admin for platform owners

3. **Monitor admin activity**
   - Check CloudWatch logs regularly
   - Set up alerts for admin actions
   - Review access patterns

4. **Secure the admin portal**
   - Use HTTPS only
   - Consider IP whitelisting
   - Enable MFA (future enhancement)

---

## 📊 Admin Dashboard Screenshots

### Login Page
- Clean, professional design
- Email and password fields
- Security warnings

### Dashboard
- Key metrics at a glance
- User, job, and payment stats
- Quick action buttons

### User Management
- Filterable user list
- Verification controls
- Suspend/unsuspend actions

---

## 🔄 Admin Workflow

### Daily Tasks
1. Check dashboard for overview
2. Review pending user verifications
3. Monitor payment issues
4. Check for suspended accounts

### Weekly Tasks
1. Review analytics reports
2. Check platform growth
3. Analyze revenue trends
4. Review user feedback

### Monthly Tasks
1. Generate financial reports
2. Review platform performance
3. Plan improvements
4. Update policies if needed

---

## 🆘 Troubleshooting

### Can't Login
- Verify admin exists in DynamoDB
- Check password is correct
- Ensure admin status is 'active'
- Check JWT secret is configured

### Token Expired
- Tokens expire after 24 hours
- Login again to get new token
- Consider implementing refresh tokens

### Permission Denied
- Check user role (admin vs super_admin)
- Verify token is valid
- Check adminProcedure middleware

---

## 📚 Next Steps

1. **Create your first admin**
   ```bash
   cd backend && ./scripts/seed-admin.sh
   ```

2. **Login to admin portal**
   - Navigate to /admin/login
   - Use your admin credentials

3. **Explore the dashboard**
   - View platform statistics
   - Manage users and jobs
   - Monitor payments

4. **Create additional admins** (if needed)
   - Use the createAdmin endpoint
   - Assign appropriate roles

---

## 🎯 Admin Checklist

- [ ] First super admin created
- [ ] Admin login tested
- [ ] Dashboard accessible
- [ ] User management working
- [ ] Job management working
- [ ] Payment viewing working
- [ ] Analytics accessible
- [ ] Additional admins created (if needed)
- [ ] Security measures in place
- [ ] Monitoring configured

---

**Your admin system is ready! 🎉**

Access the admin portal at: `https://khaya.co.za/admin/login`
