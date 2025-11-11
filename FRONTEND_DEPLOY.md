# Frontend Deployment Guide

## Prerequisites

After backend deployment, you should have:
- ✅ API Gateway URL
- ✅ Cognito User Pool ID
- ✅ Cognito Client ID
- ✅ AWS Region (af-south-1)

## Step 1: Configure Environment

Create `.env.production` in the root directory:

```env
VITE_API_URL=https://xxxxx.execute-api.af-south-1.amazonaws.com/prod/trpc
VITE_AWS_REGION=af-south-1
VITE_COGNITO_USER_POOL_ID=af-south-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

Get these values from backend deployment:

```bash
aws cloudformation describe-stacks \
    --stack-name khaya-backend \
    --region af-south-1 \
    --query 'Stacks[0].Outputs' \
    --output table
```

## Step 2: Build Frontend

```bash
npm run build
```

This creates a `dist/` directory with optimized production files.

## Deployment Options

### Option 1: AWS Amplify (Recommended)

#### A. Via GitHub (Continuous Deployment)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production"
   git push origin main
   ```

2. **Connect to Amplify**
   - Go to AWS Amplify Console
   - Click "New app" → "Host web app"
   - Connect your GitHub repository
   - Select branch: `main`

3. **Configure Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

4. **Add Environment Variables**
   - In Amplify Console → App settings → Environment variables
   - Add all VITE_* variables from .env.production

5. **Deploy**
   - Click "Save and deploy"
   - Wait 3-5 minutes
   - Get your Amplify URL: `https://main.xxxxx.amplifyapp.com`

6. **Add Custom Domain**
   - App settings → Domain management
   - Add domain: `khaya.co.za`
   - Follow DNS configuration steps
   - Wait for SSL certificate (5-10 minutes)

#### B. Via Amplify CLI

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize
amplify init

# Add hosting
amplify add hosting

# Publish
amplify publish
```

### Option 2: Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add VITE_API_URL production
   vercel env add VITE_AWS_REGION production
   vercel env add VITE_COGNITO_USER_POOL_ID production
   vercel env add VITE_COGNITO_CLIENT_ID production
   ```

4. **Redeploy**
   ```bash
   vercel --prod
   ```

5. **Add Custom Domain**
   - Vercel Dashboard → Settings → Domains
   - Add `khaya.co.za`
   - Update DNS records

### Option 3: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**
   ```bash
   netlify deploy --prod
   ```

3. **Set Environment Variables**
   - Netlify Dashboard → Site settings → Environment variables
   - Add all VITE_* variables

4. **Add Custom Domain**
   - Domain settings → Add custom domain
   - Follow DNS configuration

### Option 4: S3 + CloudFront (Manual)

#### A. Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://khaya-frontend --region af-south-1

# Enable static website hosting
aws s3 website s3://khaya-frontend \
    --index-document index.html \
    --error-document index.html

# Set bucket policy for public read
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::khaya-frontend/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
    --bucket khaya-frontend \
    --policy file://bucket-policy.json
```

#### B. Upload Files

```bash
# Sync dist folder
aws s3 sync dist/ s3://khaya-frontend --delete

# Set cache headers
aws s3 sync dist/ s3://khaya-frontend \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html" \
    --delete

# Don't cache index.html
aws s3 cp dist/index.html s3://khaya-frontend/index.html \
    --cache-control "no-cache, no-store, must-revalidate"
```

#### C. Create CloudFront Distribution

```bash
# Create distribution (via AWS Console or CLI)
aws cloudfront create-distribution \
    --origin-domain-name khaya-frontend.s3-website-af-south-1.amazonaws.com \
    --default-root-object index.html
```

Or use AWS Console:
1. Go to CloudFront
2. Create distribution
3. Origin: S3 bucket
4. Viewer protocol: Redirect HTTP to HTTPS
5. Price class: Use all edge locations
6. Alternate domain: khaya.co.za
7. SSL certificate: Request/import ACM certificate

#### D. Configure DNS

Update Route 53 or your DNS provider:
```
Type: A (Alias)
Name: khaya.co.za
Value: CloudFront distribution domain
```

## Step 3: Verify Deployment

### Test Frontend

```bash
# Check if site loads
curl -I https://khaya.co.za

# Test API connection
# Open browser console and check for API calls
```

### Test Features

1. **Sign Up**
   - Create new account
   - Verify email/phone
   - Check Cognito user pool

2. **Authentication**
   - Log in
   - Check JWT token
   - Verify protected routes

3. **API Calls**
   - Post a job
   - Submit a bid
   - Send a message
   - Check CloudWatch logs

4. **File Upload**
   - Upload profile picture
   - Upload job attachments
   - Verify S3 bucket

## Step 4: Configure Custom Domain

### DNS Records

Add these records to your DNS provider:

```
# For Amplify/Vercel/Netlify
Type: CNAME
Name: www
Value: <provided-by-platform>

Type: A
Name: @
Value: <provided-by-platform>

# For CloudFront
Type: A (Alias)
Name: @
Value: <cloudfront-distribution>.cloudfront.net

Type: A (Alias)
Name: www
Value: <cloudfront-distribution>.cloudfront.net
```

### SSL Certificate

- **Amplify/Vercel/Netlify**: Automatic
- **CloudFront**: Request ACM certificate in us-east-1

```bash
# Request certificate
aws acm request-certificate \
    --domain-name khaya.co.za \
    --subject-alternative-names www.khaya.co.za \
    --validation-method DNS \
    --region us-east-1

# Validate via DNS
# Add CNAME records provided by ACM
```

## Step 5: Performance Optimization

### Enable Compression

```bash
# For S3 + CloudFront
# Enable gzip compression in CloudFront settings
```

### Set Cache Headers

```bash
# Static assets (1 year)
aws s3 sync dist/assets/ s3://khaya-frontend/assets/ \
    --cache-control "public, max-age=31536000, immutable"

# HTML (no cache)
aws s3 cp dist/index.html s3://khaya-frontend/index.html \
    --cache-control "no-cache, no-store, must-revalidate"
```

### Enable CDN

All platforms (Amplify, Vercel, Netlify, CloudFront) include CDN by default.

## Step 6: Monitoring

### Set Up Monitoring

1. **Amplify**
   - Built-in monitoring in console
   - View build logs
   - Check access logs

2. **CloudFront**
   ```bash
   # Enable logging
   aws cloudfront update-distribution \
       --id <distribution-id> \
       --logging-config Enabled=true,Bucket=khaya-logs.s3.amazonaws.com,Prefix=cloudfront/
   ```

3. **CloudWatch**
   - Set up alarms for 4xx/5xx errors
   - Monitor API Gateway metrics
   - Track Lambda errors

### Analytics

Add Google Analytics or similar:

```html
<!-- In index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## Rollback

If something goes wrong:

### Amplify
- Go to Amplify Console
- Click on previous deployment
- Click "Redeploy this version"

### Vercel/Netlify
- Dashboard → Deployments
- Select previous deployment
- Click "Publish"

### S3 + CloudFront
```bash
# Restore from backup
aws s3 sync s3://khaya-frontend-backup/ s3://khaya-frontend/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
    --distribution-id <id> \
    --paths "/*"
```

## Troubleshooting

### Build Fails

```bash
# Check Node version
node --version  # Should be 20.x

# Clear cache
rm -rf node_modules package-lock.json
npm install

# Try local build
npm run build
```

### API Connection Fails

1. Check VITE_API_URL is correct
2. Verify CORS settings in API Gateway
3. Check browser console for errors
4. Test API directly:
   ```bash
   curl https://your-api-url/trpc/health
   ```

### Authentication Issues

1. Verify Cognito configuration
2. Check User Pool ID and Client ID
3. Test Cognito directly:
   ```bash
   aws cognito-idp list-users \
       --user-pool-id <pool-id> \
       --region af-south-1
   ```

### 404 Errors

- **Amplify/Vercel/Netlify**: Configure redirects for SPA
- **CloudFront**: Set error pages to redirect to index.html

```json
// netlify.toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_AWS_REGION: ${{ secrets.VITE_AWS_REGION }}
          VITE_COGNITO_USER_POOL_ID: ${{ secrets.VITE_COGNITO_USER_POOL_ID }}
          VITE_COGNITO_CLIENT_ID: ${{ secrets.VITE_COGNITO_CLIENT_ID }}
        run: npm run build
      
      - name: Deploy to Amplify
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: af-south-1
      
      - name: Sync to S3
        run: aws s3 sync dist/ s3://khaya-frontend --delete
```

## Success Checklist

- [ ] Backend deployed and tested
- [ ] Environment variables configured
- [ ] Frontend built successfully
- [ ] Deployed to hosting platform
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] DNS records updated
- [ ] Site loads correctly
- [ ] API calls working
- [ ] Authentication working
- [ ] File uploads working
- [ ] Monitoring set up
- [ ] Analytics configured

## You're Live! 🎉

Your frontend is now deployed and connected to the backend. Users can access your platform at https://khaya.co.za!

Next steps:
1. Test all features thoroughly
2. Monitor for errors
3. Gather user feedback
4. Iterate and improve
