# Khaya - 24 Hour Deployment Plan

## 🎯 Mission: Deploy to AWS Production within 24 Hours

**Target**: projectkhaya.co.za live and accessible
**Deadline**: 24 hours from now
**Approach**: Traditional EC2 + RDS (fastest, lowest risk)

---

## ⏰ Hour-by-Hour Timeline

### Hours 0-2: Preparation & AWS Setup

#### Hour 0-1: Prerequisites
- [ ] Create AWS account (if not exists)
- [ ] Add payment method and verify account
- [ ] Install AWS CLI
- [ ] Configure AWS credentials
- [ ] Verify GitHub repository access
- [ ] Document all passwords and secrets

**Commands:**
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure
aws configure
# Enter: Access Key, Secret Key, Region: af-south-1, Output: json

# Verify
aws sts get-caller-identity
```

#### Hour 1-2: Domain Setup
- [ ] Verify domain ownership (projectkhaya.co.za)
- [ ] Access domain registrar
- [ ] Prepare to update nameservers
- [ ] Document current DNS settings

---

### Hours 2-4: Infrastructure Deployment

#### Hour 2-3: Automated Infrastructure Setup
- [ ] Clone repository locally
- [ ] Review deployment script
- [ ] Run automated deployment

**Commands:**
```bash
cd /workspaces/Khaya
./deploy-production.sh
```

**This creates:**
- ✅ RDS MySQL database
- ✅ EC2 instance (t3.small)
- ✅ Security groups
- ✅ S3 buckets (storage + frontend)
- ✅ IAM users and policies
- ✅ SSH key pair

**Expected Output:**
- Database endpoint
- EC2 instance IP
- S3 bucket names
- IAM credentials
- SSH key file (khaya-prod-key.pem)

#### Hour 3-4: Verify Infrastructure
- [ ] Check RDS database is available
- [ ] Verify EC2 instance is running
- [ ] Test SSH connection
- [ ] Verify S3 buckets created
- [ ] Save all credentials securely

**Commands:**
```bash
# Check RDS
aws rds describe-db-instances --db-instance-identifier khaya-prod-db

# Check EC2
aws ec2 describe-instances --filters "Name=tag:Name,Values=khaya-prod-server"

# Test SSH
ssh -i khaya-prod-key.pem ubuntu@<INSTANCE_IP>
```

---

### Hours 4-6: Application Deployment

#### Hour 4-5: Deploy Backend to EC2
- [ ] Copy deployment script to EC2
- [ ] SSH into EC2 instance
- [ ] Run application setup script
- [ ] Configure environment variables
- [ ] Run database migrations

**Commands:**
```bash
# Copy script
scp -i khaya-prod-key.pem deploy-to-ec2.sh ubuntu@<INSTANCE_IP>:/home/ubuntu/

# SSH and deploy
ssh -i khaya-prod-key.pem ubuntu@<INSTANCE_IP>
bash /home/ubuntu/deploy-to-ec2.sh
```

**Script does:**
- Installs Node.js 22.x
- Installs pnpm, PM2, nginx
- Clones repository
- Installs dependencies
- Creates .env file
- Runs migrations
- Builds application
- Starts with PM2
- Configures nginx

#### Hour 5-6: Deploy Frontend to S3
- [ ] Build frontend locally
- [ ] Upload to S3
- [ ] Verify files uploaded
- [ ] Test S3 website endpoint

**Commands:**
```bash
# Build
cd /workspaces/Khaya
pnpm install
pnpm build

# Upload
aws s3 sync dist/public/ s3://<FRONTEND_BUCKET> --delete

# Verify
aws s3 ls s3://<FRONTEND_BUCKET> --recursive
```

---

### Hours 6-8: DNS & SSL Configuration

#### Hour 6-7: Configure Route 53
- [ ] Create hosted zone in Route 53
- [ ] Note nameservers
- [ ] Update domain registrar with nameservers
- [ ] Create A record for domain
- [ ] Create CNAME for www subdomain
- [ ] Wait for DNS propagation (15-30 minutes)

**Commands:**
```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name projectkhaya.co.za \
  --caller-reference $(date +%s)

# Get nameservers
aws route53 list-hosted-zones-by-name --dns-name projectkhaya.co.za

# Create A record (see DEPLOYMENT_GUIDE.md for full command)
```

#### Hour 7-8: Install SSL Certificate
- [ ] SSH into EC2
- [ ] Install Certbot
- [ ] Request SSL certificate
- [ ] Verify HTTPS works
- [ ] Test auto-renewal

**Commands:**
```bash
# On EC2
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d projectkhaya.co.za -d www.projectkhaya.co.za

# Test renewal
sudo certbot renew --dry-run
```

---

### Hours 8-10: Testing & Verification

#### Hour 8-9: Automated Testing
- [ ] Run deployment test script
- [ ] Verify all endpoints
- [ ] Check performance
- [ ] Test security

**Commands:**
```bash
./test-deployment.sh projectkhaya.co.za
```

#### Hour 9-10: Manual Testing
- [ ] Test user registration
- [ ] Test login/logout
- [ ] Test job posting
- [ ] Test bidding system
- [ ] Test material listings
- [ ] Test file uploads
- [ ] Test on mobile devices
- [ ] Test on different browsers

**Test Checklist:**
- [ ] Homepage loads
- [ ] Navigation works
- [ ] Forms submit correctly
- [ ] Images load
- [ ] API responses are fast
- [ ] No console errors
- [ ] Mobile responsive
- [ ] SSL certificate valid

---

### Hours 10-12: Monitoring & Documentation

#### Hour 10-11: Set Up Monitoring
- [ ] Configure PM2 monitoring
- [ ] Set up log rotation
- [ ] Configure CloudWatch (optional)
- [ ] Set up uptime monitoring
- [ ] Configure error alerts

**Commands:**
```bash
# On EC2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# View logs
pm2 logs khaya-api
pm2 monit
```

#### Hour 11-12: Documentation & Handoff
- [ ] Document all credentials
- [ ] Create operations manual
- [ ] Document backup procedures
- [ ] Create troubleshooting guide
- [ ] Prepare user announcement

---

### Hours 12-24: Buffer & Optimization

#### Hours 12-16: Buffer Time
- Reserved for troubleshooting
- DNS propagation delays
- Unexpected issues
- Additional testing

#### Hours 16-20: Optimization (Optional)
- [ ] Configure CloudFront CDN
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Configure caching
- [ ] Compress assets

#### Hours 20-24: Go-Live Preparation
- [ ] Final security review
- [ ] Backup database
- [ ] Test rollback procedure
- [ ] Prepare announcement
- [ ] Monitor for issues

---

## 📋 Critical Paths & Dependencies

### Must Complete (Critical Path)
1. AWS account setup → Infrastructure deployment
2. Infrastructure deployment → Application deployment
3. Application deployment → DNS configuration
4. DNS configuration → SSL certificate
5. SSL certificate → Testing
6. Testing → Go-live

### Can Parallelize
- Frontend build while backend deploys
- Documentation while DNS propagates
- Monitoring setup while testing

### Can Defer
- CloudFront CDN setup
- Advanced monitoring
- Performance optimization
- CI/CD pipeline setup

---

## 🚨 Risk Mitigation

### High Risk Items
1. **DNS Propagation Delays**
   - Mitigation: Start DNS changes early
   - Fallback: Use IP address temporarily

2. **Database Migration Issues**
   - Mitigation: Test migrations locally first
   - Fallback: Manual SQL scripts ready

3. **SSL Certificate Fails**
   - Mitigation: Ensure DNS is propagated first
   - Fallback: Use CloudFlare for SSL

4. **Application Crashes**
   - Mitigation: PM2 auto-restart configured
   - Fallback: Rollback to previous version

### Medium Risk Items
1. **Performance Issues**
   - Mitigation: Load testing before go-live
   - Fallback: Scale up instance size

2. **OAuth Integration**
   - Mitigation: Test authentication thoroughly
   - Fallback: Implement basic auth temporarily

---

## 💰 Cost Tracking

### One-Time Costs
- Domain registration: R150-300/year
- SSL certificate: R0 (Let's Encrypt free)

### Monthly Recurring Costs
- EC2 t3.small: ~R350
- RDS db.t3.micro: ~R250
- S3 storage: ~R20
- Data transfer: ~R50
- Route 53: ~R10
- **Total: ~R680/month**

### Free Tier Benefits (First 12 Months)
- Reduces cost to ~R200/month

---

## 📞 Emergency Contacts & Resources

### AWS Support
- Console: https://console.aws.amazon.com/support
- Documentation: https://docs.aws.amazon.com

### Critical Files
- `DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
- `QUICK_START.md` - Quick reference guide
- `deploy-production.sh` - Automated infrastructure setup
- `deploy-to-ec2.sh` - Application deployment script
- `test-deployment.sh` - Testing script
- `DEPLOYMENT_SUMMARY.txt` - Generated after infrastructure setup

### Credentials Storage
- AWS credentials: ~/.aws/credentials
- SSH key: khaya-prod-key.pem
- Database password: DEPLOYMENT_SUMMARY.txt
- IAM keys: DEPLOYMENT_SUMMARY.txt

---

## ✅ Go-Live Checklist

### Pre-Launch (Must Complete)
- [ ] All infrastructure deployed
- [ ] Application running on EC2
- [ ] Frontend deployed to S3
- [ ] DNS configured and propagated
- [ ] SSL certificate installed
- [ ] Database migrations completed
- [ ] All tests passing
- [ ] Monitoring configured
- [ ] Backups enabled
- [ ] Credentials documented

### Launch Day
- [ ] Final smoke test
- [ ] Monitor error logs
- [ ] Watch server metrics
- [ ] Test from multiple locations
- [ ] Verify mobile experience
- [ ] Check analytics tracking

### Post-Launch (First 24 Hours)
- [ ] Monitor for errors
- [ ] Check performance metrics
- [ ] Respond to user feedback
- [ ] Fix critical bugs immediately
- [ ] Document any issues

---

## 🎯 Success Criteria

Your deployment is successful when:

1. **Accessibility**
   - ✅ Site loads at https://projectkhaya.co.za
   - ✅ SSL certificate is valid
   - ✅ All pages accessible

2. **Functionality**
   - ✅ User registration works
   - ✅ Login/logout works
   - ✅ Job posting works
   - ✅ Bidding works
   - ✅ File uploads work

3. **Performance**
   - ✅ Page load < 3 seconds
   - ✅ API response < 500ms
   - ✅ No errors in console

4. **Security**
   - ✅ HTTPS enforced
   - ✅ Database secured
   - ✅ Credentials protected

5. **Reliability**
   - ✅ Application auto-restarts
   - ✅ Backups configured
   - ✅ Monitoring active

---

## 🔄 Rollback Plan

If deployment fails:

1. **Stop Application**
   ```bash
   ssh -i khaya-prod-key.pem ubuntu@<INSTANCE_IP>
   pm2 stop khaya-api
   ```

2. **Restore Database**
   ```bash
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier khaya-prod-db-restored \
     --db-snapshot-identifier <snapshot-id>
   ```

3. **Revert Code**
   ```bash
   cd /home/ubuntu/Khaya
   git reset --hard <previous-commit>
   pnpm install
   pnpm build
   pm2 restart khaya-api
   ```

4. **Notify Users**
   - Post maintenance message
   - Communicate timeline
   - Provide updates

---

## 📊 Progress Tracking

Use this to track your progress:

```
Hour 0-2:  Preparation        [    ] 0%
Hour 2-4:  Infrastructure     [    ] 0%
Hour 4-6:  Application        [    ] 0%
Hour 6-8:  DNS & SSL          [    ] 0%
Hour 8-10: Testing            [    ] 0%
Hour 10-12: Monitoring        [    ] 0%
Hour 12-24: Buffer            [    ] 0%

Overall Progress: [          ] 0%
```

---

## 🚀 Let's Deploy!

**Start Time**: _______________
**Target Completion**: _______________
**Actual Completion**: _______________

**Team Members**:
- Deployment Lead: _______________
- Backend Support: _______________
- Frontend Support: _______________
- QA/Testing: _______________

**Communication Channel**: _______________

---

**Good luck! You've got this! 🎉**

Remember:
- Stay calm and methodical
- Follow the checklist
- Document everything
- Test thoroughly
- Ask for help if needed

The scripts and documentation are ready. Just execute step by step.
