# Khaya - Quick Start Deployment (24 Hours)

## ⏱️ Timeline Overview

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Setup** | 1 hour | AWS account, CLI, prerequisites |
| **Infrastructure** | 2 hours | RDS, EC2, S3, networking |
| **Application** | 2 hours | Deploy code, configure, test |
| **DNS & SSL** | 1 hour | Domain, certificates |
| **Testing** | 1 hour | End-to-end testing |
| **Buffer** | 1 hour | Troubleshooting |
| **Total** | **8 hours** | Ready for production |

## 🚀 Quick Deploy (Automated)

### Prerequisites (15 minutes)

1. **AWS Account**
   - Create at https://aws.amazon.com
   - Enable billing alerts
   - Note your account ID

2. **Install AWS CLI**
   ```bash
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   aws --version
   ```

3. **Configure AWS CLI**
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Default region: af-south-1
   # Default output format: json
   ```

4. **Verify Configuration**
   ```bash
   aws sts get-caller-identity
   ```

### One-Command Deploy (45 minutes)

```bash
cd /workspaces/Khaya
./deploy-production.sh
```

This script will:
- ✅ Create RDS MySQL database
- ✅ Launch EC2 instance
- ✅ Configure security groups
- ✅ Create S3 buckets
- ✅ Set up IAM users
- ✅ Generate deployment scripts

### Manual Steps After Automation (2 hours)

1. **Deploy Application to EC2**
   ```bash
   # Copy deployment script to EC2
   scp -i khaya-prod-key.pem deploy-to-ec2.sh ubuntu@<INSTANCE_IP>:/home/ubuntu/
   
   # SSH into EC2
   ssh -i khaya-prod-key.pem ubuntu@<INSTANCE_IP>
   
   # Run deployment
   bash /home/ubuntu/deploy-to-ec2.sh
   ```

2. **Build and Upload Frontend**
   ```bash
   # On your local machine
   cd /workspaces/Khaya
   pnpm install
   pnpm build
   
   # Upload to S3
   aws s3 sync dist/public/ s3://<FRONTEND_BUCKET> --delete
   ```

3. **Configure DNS (Route 53)**
   ```bash
   # Create hosted zone
   aws route53 create-hosted-zone \
     --name projectkhaya.co.za \
     --caller-reference $(date +%s)
   
   # Get nameservers and update your domain registrar
   aws route53 list-hosted-zones-by-name \
     --dns-name projectkhaya.co.za
   
   # Create A record pointing to EC2 IP
   # (See DEPLOYMENT_GUIDE.md for full instructions)
   ```

4. **Install SSL Certificate**
   ```bash
   # On EC2 instance
   sudo certbot --nginx -d projectkhaya.co.za -d www.projectkhaya.co.za
   ```

5. **Test Deployment**
   ```bash
   # Test API
   curl https://projectkhaya.co.za/api/health
   
   # Test frontend
   curl https://projectkhaya.co.za
   
   # Check logs
   ssh -i khaya-prod-key.pem ubuntu@<INSTANCE_IP>
   pm2 logs khaya-api
   ```

## 📋 Pre-Deployment Checklist

- [ ] AWS account created and verified
- [ ] AWS CLI installed and configured
- [ ] Domain name registered (projectkhaya.co.za)
- [ ] GitHub repository access
- [ ] Database password chosen (min 8 chars)
- [ ] JWT secret generated
- [ ] OAuth configuration ready (or using Manus)
- [ ] S3 bucket names available
- [ ] Email for SSL certificate

## 🔧 Configuration Files Needed

### 1. Environment Variables (.env)

```bash
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=mysql://admin:PASSWORD@RDS_ENDPOINT:3306/khaya

# JWT
JWT_SECRET=your-super-secret-jwt-key

# AWS S3
AWS_REGION=af-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=khaya-storage-prod

# OAuth (configure based on your setup)
OAUTH_SERVER_URL=https://your-oauth-server.com
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com

# Optional: OpenAI
OPENAI_API_KEY=your-openai-key
```

### 2. GitHub Secrets (for CI/CD)

Add these to your GitHub repository settings:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `EC2_HOST` (instance IP)
- `EC2_SSH_KEY` (private key content)
- `FRONTEND_BUCKET` (S3 bucket name)
- `CLOUDFRONT_DISTRIBUTION_ID`
- `DOMAIN_NAME`

## 🎯 Success Criteria

Your deployment is successful when:

- [ ] API responds at https://projectkhaya.co.za/api/health
- [ ] Frontend loads at https://projectkhaya.co.za
- [ ] SSL certificate is valid (green padlock)
- [ ] Database connections work
- [ ] File uploads to S3 work
- [ ] Authentication works
- [ ] All pages load without errors
- [ ] Mobile responsive design works
- [ ] Performance is acceptable (< 3s load time)

## 🐛 Common Issues & Solutions

### Issue: AWS CLI not configured
```bash
aws configure
# Enter your credentials
```

### Issue: Database connection fails
```bash
# Check security group allows EC2 to access RDS
# Verify DATABASE_URL in .env
# Test: mysql -h <rds-endpoint> -u admin -p
```

### Issue: PM2 not starting
```bash
pm2 logs khaya-api
pm2 restart khaya-api
pm2 status
```

### Issue: Nginx 502 error
```bash
sudo nginx -t
sudo systemctl status nginx
pm2 status
```

### Issue: SSL certificate fails
```bash
# Ensure DNS is propagated first
# Check domain points to correct IP
sudo certbot certificates
sudo certbot renew --dry-run
```

### Issue: Frontend not loading
```bash
# Check S3 bucket policy allows public read
# Verify CloudFront distribution is enabled
# Check DNS points to CloudFront
```

## 📊 Monitoring After Deployment

### Application Logs
```bash
# SSH into EC2
ssh -i khaya-prod-key.pem ubuntu@<INSTANCE_IP>

# View logs
pm2 logs khaya-api

# Monitor resources
pm2 monit

# Check nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Monitoring
```bash
# Check RDS metrics in AWS Console
# Monitor connections, CPU, storage

# Connect to database
mysql -h <rds-endpoint> -u admin -p

# Check tables
SHOW TABLES;
SELECT COUNT(*) FROM users;
```

### S3 Storage
```bash
# Check bucket size
aws s3 ls s3://<bucket-name> --recursive --summarize

# Monitor costs
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

## 💰 Cost Optimization

### Free Tier Benefits (First 12 Months)
- EC2: 750 hours/month of t2.micro (upgrade to t3.small costs ~R350/month)
- RDS: 750 hours/month of db.t2.micro (upgrade to t3.micro costs ~R250/month)
- S3: 5GB storage free
- CloudFront: 50GB data transfer free

### Cost Reduction Tips
1. Use t3.micro instead of t3.small if traffic is low
2. Enable RDS auto-scaling storage
3. Set up CloudWatch billing alerts
4. Use S3 lifecycle policies to archive old files
5. Enable CloudFront caching to reduce origin requests

## 🔄 Rollback Plan

If deployment fails:

```bash
# Stop application
ssh -i khaya-prod-key.pem ubuntu@<INSTANCE_IP>
pm2 stop khaya-api

# Restore database from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier khaya-prod-db-restored \
  --db-snapshot-identifier <snapshot-id>

# Revert code
cd /home/ubuntu/Khaya
git reset --hard <previous-commit>
pnpm install
pnpm build
pm2 restart khaya-api

# Restore frontend
aws s3 sync s3://<backup-bucket>/ s3://<frontend-bucket>/ --delete
```

## 📞 Support

- **Documentation**: See DEPLOYMENT_GUIDE.md for detailed instructions
- **AWS Support**: https://console.aws.amazon.com/support
- **GitHub Issues**: https://github.com/lante007/Khaya/issues
- **Emergency**: Check DEPLOYMENT_SUMMARY.txt for all resource IDs

## 🎉 Post-Deployment Tasks

After successful deployment:

1. **Set up monitoring**
   - CloudWatch alarms for CPU, memory, disk
   - Uptime monitoring (UptimeRobot, Pingdom)
   - Error tracking (Sentry, Rollbar)

2. **Configure backups**
   - RDS automated backups (already enabled)
   - S3 versioning for critical files
   - Database snapshots before major changes

3. **Security hardening**
   - Review security group rules
   - Enable AWS WAF for DDoS protection
   - Set up rate limiting
   - Regular security updates

4. **Performance optimization**
   - Enable CloudFront caching
   - Optimize database queries
   - Add database indexes
   - Compress images

5. **Documentation**
   - Update API documentation
   - Create user guides
   - Document deployment process
   - Train team members

## 🚦 Go-Live Checklist

Before announcing to users:

- [ ] All features tested and working
- [ ] Performance acceptable under load
- [ ] Security review completed
- [ ] Backups configured and tested
- [ ] Monitoring and alerts set up
- [ ] SSL certificate valid
- [ ] DNS propagated globally
- [ ] Error pages configured
- [ ] Contact forms working
- [ ] Payment integration tested (if applicable)
- [ ] Mobile experience verified
- [ ] SEO basics configured
- [ ] Analytics tracking set up
- [ ] Terms of service and privacy policy published
- [ ] Support channels ready

---

**Estimated Total Time**: 6-8 hours for full deployment
**Estimated Monthly Cost**: R680 (R200 with free tier)

Good luck with your deployment! 🚀
