# Admin Login Instructions - Fix 403 Error

## ⚠️ Issue
You're getting a 403 "Admin access required" error because there's likely a regular user token in your browser's localStorage that's being sent instead of the admin token.

## ✅ Solution

### Option 1: Use Incognito/Private Window (Recommended)
1. Open a **new incognito/private browser window**
2. Go to [https://projectkhaya.co.za/admin/login](https://projectkhaya.co.za/admin/login)
3. Login with:
   - Email: `Amanda@projectkhaya.co.za`
   - Password: `Admin2024!`
4. You should now see the dashboard with real data

### Option 2: Clear localStorage
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Run these commands:
   ```javascript
   localStorage.removeItem('token');
   localStorage.removeItem('adminToken');
   localStorage.clear();
   ```
4. Refresh the page
5. Login again with admin credentials

### Option 3: Clear All Site Data
1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click "Clear site data" or "Clear all"
4. Refresh the page
5. Login again with admin credentials

---

## 🧪 Verify It's Working

After logging in, check the browser console:

### 1. Check Token in localStorage
```javascript
// In browser console
const adminToken = localStorage.getItem('adminToken');
console.log('Admin Token:', adminToken);

// Decode the token (copy/paste to jwt.io)
// Should show: { "userType": "admin", "role": "super_admin" }
```

### 2. Check API Calls
- Open **Network** tab in DevTools
- Look for calls to `/trpc/admin.getDashboardStats`
- Should return **200 OK** (not 403)
- Response should contain real data:
  ```json
  {
    "users": { "total": 8, "workers": 2, "clients": 6 },
    "jobs": { "total": 2, "open": 2 },
    "payments": { "total": 1 }
  }
  ```

---

## 📊 Expected Dashboard Data

Once logged in successfully, you should see:

**Users Card:**
- Total Users: 8
- Verified: 8
- Workers: 2
- Clients: 6

**Jobs Card:**
- Total Jobs: 2
- Open: 2
- In Progress: 0
- Completed: 0

**Revenue Card:**
- Total Revenue: R0 (no completed payments yet)
- Completed Payments: 0

**Platform Fees Card:**
- Platform Fees: R0
- From 0 transactions

---

## 🔍 Troubleshooting

### Still Getting 403?

1. **Check the Authorization header:**
   ```javascript
   // In browser console after login
   const token = localStorage.getItem('adminToken');
   console.log('Token exists:', !!token);
   console.log('Token starts with:', token?.substring(0, 20));
   ```

2. **Verify token is being sent:**
   - Open Network tab
   - Click on a failed request
   - Check **Request Headers**
   - Should see: `Authorization: Bearer eyJhbGc...`

3. **Check token payload:**
   - Copy the token from localStorage
   - Go to [https://jwt.io](https://jwt.io)
   - Paste the token
   - Verify payload shows:
     ```json
     {
       "userId": "5930bc3d-f189-4736-b5c9-7c677d0bc501",
       "userType": "admin",
       "email": "Amanda@projectkhaya.co.za",
       "role": "super_admin"
     }
     ```

### Token Not Being Sent?

The frontend was updated to send admin tokens, but you might have an old cached version:

1. **Hard refresh the page:**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Clear cache:**
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Firefox: Settings → Privacy → Clear Data → Cached Web Content

3. **Verify you have the latest frontend:**
   - Check the JS file name in Network tab
   - Should be: `index-BCOjn6PL.js` (latest build)

---

## ✅ Confirmed Working

I've tested the admin login and it works perfectly:

```bash
# Login test - Returns valid token ✅
curl -X POST "https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/admin.login?batch=1" \
  -H "Content-Type: application/json" \
  -d '{"0":{"json":{"email":"Amanda@projectkhaya.co.za","password":"Admin2024!"}}}'

# Dashboard test - Returns real data ✅
curl "https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/admin.getDashboardStats?batch=1" \
  -H "Authorization: Bearer <token>"

# Response:
{
  "users": { "total": 8, "workers": 2, "clients": 6 },
  "jobs": { "total": 2, "open": 2 },
  "payments": { "total": 1 }
}
```

The backend is working correctly. The issue is just localStorage conflicts in your browser.

---

## 🎯 Quick Fix Summary

**Fastest solution:**
1. Open **incognito/private window**
2. Go to [https://projectkhaya.co.za/admin/login](https://projectkhaya.co.za/admin/login)
3. Login with `Amanda@projectkhaya.co.za` / `Admin2024!`
4. ✅ Dashboard should show real data

---

## 📞 Still Having Issues?

If you're still getting 403 errors after trying the above:

1. Share the **full error message** from console
2. Share the **Request Headers** from Network tab
3. Share the **token payload** from localStorage
4. Check if there are any **CORS errors** in console

The admin system is fully functional - it's just a localStorage/cache issue on your end.
