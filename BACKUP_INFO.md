# Project Khaya - Backup Information

## Latest Backup

**Date:** 2025-11-19 08:15:34 UTC  
**File:** `khaya-backup-20251119_081534.tar.gz`  
**Size:** 12 MB  
**Location:** `/workspaces/khaya-backup-20251119_081534.tar.gz`

## Backup Contents

### Included
- ✅ All source code (client, backend, shared)
- ✅ Configuration files (template.yaml, package.json, tsconfig.json)
- ✅ Documentation (all .md files)
- ✅ Public assets (images, icons)
- ✅ Database schemas and types
- ✅ .env.production (public keys only)
- ✅ .gitignore and other config files

### Excluded (for security)
- ❌ node_modules (can be reinstalled)
- ❌ .aws-sam (build artifacts)
- ❌ dist (build outputs)
- ❌ .git (version control)
- ❌ *.log files
- ❌ .pnpm-store
- ❌ backend/samconfig.toml (contains deployment parameters)
- ❌ ADMIN_CREDENTIALS.md (sensitive)

## Secrets NOT in Backup

The following secrets are **NOT** included in the backup and must be configured separately:

### AWS Secrets (CloudFormation Parameters)
- `JWT_SECRET` - JWT signing secret
- `MAILERSEND_API_KEY` - MailerSend API key
- `PAYSTACK_SECRET_KEY` - Paystack secret key (sk_live_...)
- `TWILIO_AUTH_TOKEN` - Twilio authentication token
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_PHONE_NUMBER` - Twilio phone number

### Where Secrets Are Stored
1. **AWS CloudFormation Stack:** `project-khaya-api`
   - Secrets passed as parameters during deployment
   - View in AWS Console → CloudFormation → project-khaya-api → Parameters

2. **Local Development:** `backend/samconfig.toml` (gitignored)
   - Contains parameter overrides for local deployment
   - **DO NOT COMMIT THIS FILE**

3. **Admin Credentials:** Stored in DynamoDB
   - Admin email: Amanda@projectkhaya.co.za
   - Password hash stored in: `ADMIN#5930bc3d-f189-4736-b5c9-7c677d0bc501`

## Restoring from Backup

### 1. Extract Backup
```bash
tar -xzf khaya-backup-20251119_081534.tar.gz -C /path/to/restore
cd /path/to/restore
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..
```

### 3. Configure Secrets

#### Option A: Use Existing AWS Stack
If the CloudFormation stack still exists, secrets are already configured.

#### Option B: Redeploy with Secrets
```bash
cd backend
sam deploy --guided

# You'll be prompted for:
# - JwtSecret
# - MailerSendApiKey
# - PaystackSecretKey
# - TwilioAccountSid
# - TwilioAuthToken
# - TwilioPhoneNumber
# - PaystackPublicKey
# - FrontendUrl
```

### 4. Build and Deploy

#### Backend
```bash
cd backend
npm run build
sam build
sam deploy
```

#### Frontend
```bash
cd client
npm run build
aws s3 sync dist/public s3://projectkhaya-frontend-1762772155 --delete
aws cloudfront create-invalidation --distribution-id E4J3KAA9XDTHS --paths "/*"
```

## Backup Schedule

### Recommended
- **Daily:** Automated backup before major changes
- **Weekly:** Full backup with database export
- **Before Deployment:** Always backup before production deployment
- **After Major Features:** Backup after completing significant features

### Creating New Backup
```bash
cd /workspaces/Khaya
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
tar -czf "../khaya-backup-${TIMESTAMP}.tar.gz" \
  --exclude='node_modules' \
  --exclude='.aws-sam' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='.pnpm-store' \
  --exclude='backend/samconfig.toml' \
  --exclude='ADMIN_CREDENTIALS.md' \
  .
```

## Database Backup

### Export DynamoDB Table
```bash
# Export to S3
aws dynamodb export-table-to-point-in-time \
  --table-arn arn:aws:dynamodb:us-east-1:615608124862:table/khaya-prod \
  --s3-bucket projectkhaya-backups \
  --s3-prefix dynamodb-backup-$(date +%Y%m%d) \
  --export-format DYNAMODB_JSON

# Or scan and save locally
aws dynamodb scan --table-name khaya-prod > khaya-db-backup-$(date +%Y%m%d).json
```

## Recovery Testing

### Test Restore Process
1. Extract backup to new directory
2. Install dependencies
3. Run tests
4. Deploy to staging environment
5. Verify functionality

### Last Tested
- **Date:** 2025-11-19
- **Status:** ✅ Backup created successfully
- **Restore Test:** Not yet performed

## Security Notes

### ⚠️ Important
- **Never commit secrets to Git**
- **Never share backup files publicly** (they contain code and config)
- **Store backups securely** (encrypted storage recommended)
- **Rotate secrets regularly** (every 90 days)
- **Test restore process** (quarterly)

### Backup Storage Recommendations
1. **AWS S3** with encryption and versioning
2. **Private GitHub repository** (code only, no secrets)
3. **Encrypted external drive** (offline backup)
4. **Cloud storage** (Google Drive, Dropbox) with encryption

## Version Information

### Current Deployment
- **Frontend:** CloudFront Distribution E4J3KAA9XDTHS
- **Backend:** Lambda function project-khaya-api-KhayaFunction-I6k37ZDJBMEw
- **Database:** DynamoDB table khaya-prod
- **Domain:** projectkhaya.co.za

### Git Information
- **Repository:** https://github.com/lante007/Khaya.git
- **Branch:** main (to be pushed)
- **Last Commit:** (to be created)

## Contact

For backup restoration assistance:
- Check documentation in this repository
- Review CloudFormation template for infrastructure
- Consult AWS Console for deployed resources

---

**Backup Created:** 2025-11-19 08:15:34 UTC  
**Next Backup Due:** 2025-11-20 (daily schedule)
