# Khaya - Production Deployment Guide (24-Hour Timeline)

## Quick Decision Matrix

### Option A: Traditional EC2 + RDS (RECOMMENDED for 24h)
- **Time to Deploy**: 4-6 hours
- **Monthly Cost**: R500-800
- **Risk Level**: Low
- **Code Changes**: Minimal
- **Best For**: Quick production launch

### Option B: Serverless (Lambda + DynamoDB)
- **Time to Deploy**: 16-20 hours
- **Monthly Cost**: R250-500
- **Risk Level**: Medium-High
- **Code Changes**: Extensive
- **Best For**: Long-term scalability

---

## OPTION A: Traditional Deployment (RECOMMENDED)

### Prerequisites Checklist

- [ ] AWS Account created
- [ ] AWS CLI installed and configured
- [ ] Domain name registered (projectkhaya.co.za)
- [ ] GitHub repository access
- [ ] Environment variables documented

### Step 1: AWS Account Setup (15 minutes)

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: af-south-1 (Johannesburg)
# - Default output format: json

# Verify
aws sts get-caller-identity
```

### Step 2: Create RDS MySQL Database (20 minutes)

```bash
# Create RDS instance via AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier khaya-prod-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --engine-version 8.0.35 \
  --master-username admin \
  --master-user-password "YOUR_SECURE_PASSWORD" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --publicly-accessible \
  --region af-south-1

# Wait for database to be available (10-15 minutes)
aws rds wait db-instance-available --db-instance-identifier khaya-prod-db

# Get database endpoint
aws rds describe-db-instances \
  --db-instance-identifier khaya-prod-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

### Step 3: Create EC2 Instance (30 minutes)

```bash
# Create key pair for SSH access
aws ec2 create-key-pair \
  --key-name khaya-prod-key \
  --query 'KeyMaterial' \
  --output text > khaya-prod-key.pem
chmod 400 khaya-prod-key.pem

# Create security group
aws ec2 create-security-group \
  --group-name khaya-prod-sg \
  --description "Security group for Khaya production server" \
  --region af-south-1

# Get security group ID
SG_ID=$(aws ec2 describe-security-groups \
  --group-names khaya-prod-sg \
  --query 'SecurityGroups[0].GroupId' \
  --output text)

# Allow SSH, HTTP, HTTPS
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 3000 --cidr 0.0.0.0/0

# Launch EC2 instance (Ubuntu 22.04 LTS)
aws ec2 run-instances \
  --image-id ami-0c2f25c1f66a1ff4d \
  --instance-type t3.small \
  --key-name khaya-prod-key \
  --security-group-ids $SG_ID \
  --region af-south-1 \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=khaya-prod-server}]'

# Get instance public IP
INSTANCE_IP=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=khaya-prod-server" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "Instance IP: $INSTANCE_IP"
```

### Step 4: Configure EC2 Instance (45 minutes)

```bash
# SSH into instance
ssh -i khaya-prod-key.pem ubuntu@$INSTANCE_IP

# On the EC2 instance, run:
sudo apt update && sudo apt upgrade -y

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
sudo npm install -g pnpm pm2

# Install nginx
sudo apt install -y nginx

# Install git
sudo apt install -y git

# Clone repository
cd /home/ubuntu
git clone https://github.com/lante007/Khaya.git
cd Khaya

# Install dependencies
pnpm install

# Create .env file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000

# Database (use RDS endpoint from Step 2)
DATABASE_URL=mysql://admin:YOUR_PASSWORD@khaya-prod-db.xxxxx.af-south-1.rds.amazonaws.com:3306/khaya

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# OAuth (if using Manus, or configure your own)
OAUTH_SERVER_URL=https://your-oauth-server.com
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com

# AWS S3 (for file uploads)
AWS_REGION=af-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=khaya-storage-prod

# Optional: OpenAI for AI features
OPENAI_API_KEY=your-openai-key
EOF

# Run database migrations
pnpm db:push

# Build application
pnpm build

# Start with PM2
pm2 start dist/index.js --name khaya-api
pm2 startup
pm2 save

# Configure nginx as reverse proxy
sudo tee /etc/nginx/sites-available/khaya << 'EOF'
server {
    listen 80;
    server_name projectkhaya.co.za www.projectkhaya.co.za;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/khaya /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL certificate (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d projectkhaya.co.za -d www.projectkhaya.co.za
```

### Step 5: Create S3 Bucket for Storage (10 minutes)

```bash
# Create S3 bucket
aws s3 mb s3://khaya-storage-prod --region af-south-1

# Configure CORS
cat > cors.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://projectkhaya.co.za", "https://www.projectkhaya.co.za"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors --bucket khaya-storage-prod --cors-configuration file://cors.json

# Create IAM user for S3 access
aws iam create-user --user-name khaya-s3-user
aws iam attach-user-policy --user-name khaya-s3-user --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam create-access-key --user-name khaya-s3-user
```

### Step 6: Deploy Frontend to S3 + CloudFront (30 minutes)

```bash
# Create S3 bucket for frontend
aws s3 mb s3://khaya-frontend-prod --region af-south-1

# Configure bucket for static website hosting
aws s3 website s3://khaya-frontend-prod --index-document index.html --error-document index.html

# Build frontend locally
cd /workspaces/Khaya
pnpm build

# Upload to S3
aws s3 sync dist/public/ s3://khaya-frontend-prod --delete

# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name khaya-frontend-prod.s3-website-af-south-1.amazonaws.com \
  --default-root-object index.html

# Get CloudFront distribution domain
# Configure in Route 53 (next step)
```

### Step 7: Configure Route 53 DNS (20 minutes)

```bash
# Create hosted zone (if not exists)
aws route53 create-hosted-zone --name projectkhaya.co.za --caller-reference $(date +%s)

# Get hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name projectkhaya.co.za \
  --query 'HostedZones[0].Id' \
  --output text)

# Create A record pointing to EC2 instance
cat > change-batch.json << EOF
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "projectkhaya.co.za",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "$INSTANCE_IP"}]
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch file://change-batch.json
```

### Step 8: Monitoring & Logging (15 minutes)

```bash
# On EC2 instance
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# View logs
pm2 logs khaya-api

# Monitor
pm2 monit

# Set up CloudWatch (optional)
sudo apt install -y amazon-cloudwatch-agent
```

### Step 9: Testing & Verification (30 minutes)

```bash
# Test API endpoint
curl https://projectkhaya.co.za/api/health

# Test frontend
curl https://projectkhaya.co.za

# Test database connection
ssh -i khaya-prod-key.pem ubuntu@$INSTANCE_IP
cd /home/ubuntu/Khaya
pnpm exec tsx -e "import {getDb} from './server/db'; getDb().then(db => console.log('DB Connected'))"

# Load testing (optional)
npm install -g artillery
artillery quick --count 10 --num 100 https://projectkhaya.co.za
```

---

## OPTION B: Serverless Deployment

See [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) for full serverless deployment guide.

**Note**: This requires significant code changes and is not recommended for 24-hour timeline.

---

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] SSL certificate installed
- [ ] DNS propagated (can take 24-48 hours)
- [ ] API endpoints responding
- [ ] Frontend loading correctly
- [ ] File uploads working (S3)
- [ ] Authentication working
- [ ] Email notifications configured (if applicable)
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Security groups reviewed
- [ ] Environment variables secured

---

## Rollback Plan

If deployment fails:

```bash
# Stop application
pm2 stop khaya-api

# Restore database from backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier khaya-prod-db-restored \
  --db-snapshot-identifier khaya-prod-db-snapshot-YYYYMMDD

# Revert code
cd /home/ubuntu/Khaya
git reset --hard HEAD~1
pnpm install
pnpm build
pm2 restart khaya-api
```

---

## Cost Breakdown (Option A)

| Service | Configuration | Monthly Cost (ZAR) |
|---------|--------------|-------------------|
| EC2 t3.small | 2 vCPU, 2GB RAM | ~R350 |
| RDS db.t3.micro | 20GB storage | ~R250 |
| S3 Storage | 10GB | ~R20 |
| CloudFront | 50GB transfer | ~R50 |
| Route 53 | Hosted zone | ~R10 |
| **Total** | | **~R680/month** |

Free tier eligible for first 12 months (reduces cost to ~R200/month).

---

## Support & Troubleshooting

### Common Issues

**Database connection fails:**
```bash
# Check security group allows EC2 to access RDS
# Verify DATABASE_URL in .env
# Test connection: mysql -h <rds-endpoint> -u admin -p
```

**PM2 not starting:**
```bash
pm2 logs khaya-api
pm2 restart khaya-api
```

**Nginx 502 error:**
```bash
sudo nginx -t
sudo systemctl status nginx
pm2 status
```

**SSL certificate issues:**
```bash
sudo certbot renew --dry-run
sudo certbot certificates
```

---

## Next Steps After Deployment

1. **Set up monitoring**: CloudWatch, Sentry, or similar
2. **Configure backups**: Automated RDS snapshots
3. **Set up CI/CD**: GitHub Actions for automated deployments
4. **Performance optimization**: CDN caching, database indexing
5. **Security hardening**: WAF, rate limiting, DDoS protection
6. **Load testing**: Ensure application handles expected traffic
7. **Documentation**: Update API docs, user guides

---

## Emergency Contacts

- AWS Support: https://console.aws.amazon.com/support
- GitHub Issues: https://github.com/lante007/Khaya/issues
- Development Team: [Your contact info]

---

Built with ❤️ for small town communities
