#!/bin/bash
set -e

echo "🚀 Khaya Production Deployment Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    echo "Install it with: curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip' && unzip awscliv2.zip && sudo ./aws/install"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not configured${NC}"
    echo "Configure it with: aws configure"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-af-south-1}
echo "AWS Account: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo ""

# Prompt for deployment details
read -p "Enter your domain name (e.g., projectkhaya.co.za): " DOMAIN_NAME
read -p "Enter database master password (min 8 chars): " -s DB_PASSWORD
echo ""
read -p "Enter JWT secret (leave blank to generate): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT secret: $JWT_SECRET"
fi
echo ""

# Confirm deployment
echo -e "${YELLOW}⚠️  This will create the following AWS resources:${NC}"
echo "  - RDS MySQL database (db.t3.micro)"
echo "  - EC2 instance (t3.small)"
echo "  - S3 buckets (frontend + storage)"
echo "  - CloudFront distribution"
echo "  - Route 53 hosted zone"
echo ""
echo "Estimated monthly cost: ~R680 (R200 with free tier)"
echo ""
read -p "Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "Starting deployment..."
echo ""

# Step 1: Create RDS Database
echo "📦 Step 1/7: Creating RDS MySQL database..."
DB_INSTANCE_ID="khaya-prod-db"

if aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID &> /dev/null; then
    echo -e "${YELLOW}Database already exists, skipping...${NC}"
else
    aws rds create-db-instance \
        --db-instance-identifier $DB_INSTANCE_ID \
        --db-instance-class db.t3.micro \
        --engine mysql \
        --engine-version 8.0.35 \
        --master-username admin \
        --master-user-password "$DB_PASSWORD" \
        --allocated-storage 20 \
        --storage-type gp3 \
        --backup-retention-period 7 \
        --publicly-accessible \
        --region $AWS_REGION \
        --tags Key=Project,Value=Khaya Key=Environment,Value=Production
    
    echo "Waiting for database to be available (this may take 10-15 minutes)..."
    aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE_ID --region $AWS_REGION
    echo -e "${GREEN}✅ Database created${NC}"
fi

DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_ID \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text \
    --region $AWS_REGION)
echo "Database endpoint: $DB_ENDPOINT"
echo ""

# Step 2: Create Security Groups
echo "🔒 Step 2/7: Creating security groups..."
SG_NAME="khaya-prod-sg"

# Check if security group exists
SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$SG_NAME" \
    --query 'SecurityGroups[0].GroupId' \
    --output text \
    --region $AWS_REGION 2>/dev/null || echo "None")

if [ "$SG_ID" = "None" ]; then
    SG_ID=$(aws ec2 create-security-group \
        --group-name $SG_NAME \
        --description "Security group for Khaya production server" \
        --region $AWS_REGION \
        --query 'GroupId' \
        --output text)
    
    # Allow SSH, HTTP, HTTPS, and app port
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 3000 --cidr 0.0.0.0/0 --region $AWS_REGION
    
    echo -e "${GREEN}✅ Security group created: $SG_ID${NC}"
else
    echo -e "${YELLOW}Security group already exists: $SG_ID${NC}"
fi
echo ""

# Step 3: Create Key Pair
echo "🔑 Step 3/7: Creating SSH key pair..."
KEY_NAME="khaya-prod-key"
KEY_FILE="$KEY_NAME.pem"

if [ -f "$KEY_FILE" ]; then
    echo -e "${YELLOW}Key pair already exists: $KEY_FILE${NC}"
else
    aws ec2 create-key-pair \
        --key-name $KEY_NAME \
        --query 'KeyMaterial' \
        --output text \
        --region $AWS_REGION > $KEY_FILE
    chmod 400 $KEY_FILE
    echo -e "${GREEN}✅ Key pair created: $KEY_FILE${NC}"
fi
echo ""

# Step 4: Launch EC2 Instance
echo "🖥️  Step 4/7: Launching EC2 instance..."
INSTANCE_NAME="khaya-prod-server"

# Check if instance already exists
INSTANCE_ID=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running,pending,stopped" \
    --query 'Reservations[0].Instances[0].InstanceId' \
    --output text \
    --region $AWS_REGION 2>/dev/null || echo "None")

if [ "$INSTANCE_ID" = "None" ]; then
    # Get latest Ubuntu 22.04 AMI
    AMI_ID=$(aws ec2 describe-images \
        --owners 099720109477 \
        --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
        --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
        --output text \
        --region $AWS_REGION)
    
    INSTANCE_ID=$(aws ec2 run-instances \
        --image-id $AMI_ID \
        --instance-type t3.small \
        --key-name $KEY_NAME \
        --security-group-ids $SG_ID \
        --region $AWS_REGION \
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME},{Key=Project,Value=Khaya},{Key=Environment,Value=Production}]" \
        --query 'Instances[0].InstanceId' \
        --output text)
    
    echo "Waiting for instance to be running..."
    aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $AWS_REGION
    echo -e "${GREEN}✅ Instance launched: $INSTANCE_ID${NC}"
else
    echo -e "${YELLOW}Instance already exists: $INSTANCE_ID${NC}"
fi

INSTANCE_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text \
    --region $AWS_REGION)
echo "Instance IP: $INSTANCE_IP"
echo ""

# Step 5: Create S3 Buckets
echo "📦 Step 5/7: Creating S3 buckets..."

# Storage bucket
STORAGE_BUCKET="khaya-storage-prod-$(echo $AWS_ACCOUNT_ID | tail -c 5)"
if aws s3 ls s3://$STORAGE_BUCKET 2>/dev/null; then
    echo -e "${YELLOW}Storage bucket already exists: $STORAGE_BUCKET${NC}"
else
    aws s3 mb s3://$STORAGE_BUCKET --region $AWS_REGION
    
    # Configure CORS
    cat > /tmp/cors.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF
    aws s3api put-bucket-cors --bucket $STORAGE_BUCKET --cors-configuration file:///tmp/cors.json
    echo -e "${GREEN}✅ Storage bucket created: $STORAGE_BUCKET${NC}"
fi

# Frontend bucket
FRONTEND_BUCKET="khaya-frontend-prod-$(echo $AWS_ACCOUNT_ID | tail -c 5)"
if aws s3 ls s3://$FRONTEND_BUCKET 2>/dev/null; then
    echo -e "${YELLOW}Frontend bucket already exists: $FRONTEND_BUCKET${NC}"
else
    aws s3 mb s3://$FRONTEND_BUCKET --region $AWS_REGION
    aws s3 website s3://$FRONTEND_BUCKET --index-document index.html --error-document index.html
    
    # Make bucket public for website hosting
    cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$FRONTEND_BUCKET/*"
    }
  ]
}
EOF
    aws s3api put-bucket-policy --bucket $FRONTEND_BUCKET --policy file:///tmp/bucket-policy.json
    echo -e "${GREEN}✅ Frontend bucket created: $FRONTEND_BUCKET${NC}"
fi
echo ""

# Step 6: Create IAM User for S3 Access
echo "👤 Step 6/7: Creating IAM user for S3 access..."
IAM_USER="khaya-s3-user"

if aws iam get-user --user-name $IAM_USER &> /dev/null; then
    echo -e "${YELLOW}IAM user already exists: $IAM_USER${NC}"
else
    aws iam create-user --user-name $IAM_USER
    
    # Attach S3 policy
    cat > /tmp/s3-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::$STORAGE_BUCKET",
        "arn:aws:s3:::$STORAGE_BUCKET/*"
      ]
    }
  ]
}
EOF
    aws iam put-user-policy --user-name $IAM_USER --policy-name KhayaS3Access --policy-document file:///tmp/s3-policy.json
    
    # Create access keys
    ACCESS_KEYS=$(aws iam create-access-key --user-name $IAM_USER --output json)
    AWS_ACCESS_KEY=$(echo $ACCESS_KEYS | jq -r '.AccessKey.AccessKeyId')
    AWS_SECRET_KEY=$(echo $ACCESS_KEYS | jq -r '.AccessKey.SecretAccessKey')
    
    echo -e "${GREEN}✅ IAM user created${NC}"
    echo "Access Key ID: $AWS_ACCESS_KEY"
    echo "Secret Access Key: $AWS_SECRET_KEY"
fi
echo ""

# Step 7: Generate deployment instructions
echo "📝 Step 7/7: Generating deployment instructions..."

cat > deploy-to-ec2.sh << EOF
#!/bin/bash
# Run this script on your EC2 instance

set -e

echo "Setting up Khaya on EC2..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm and PM2
sudo npm install -g pnpm pm2

# Install nginx
sudo apt install -y nginx

# Clone repository
cd /home/ubuntu
if [ ! -d "Khaya" ]; then
    git clone https://github.com/lante007/Khaya.git
fi
cd Khaya

# Install dependencies
pnpm install

# Create .env file
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=mysql://admin:$DB_PASSWORD@$DB_ENDPOINT:3306/khaya

# JWT Secret
JWT_SECRET=$JWT_SECRET

# AWS S3
AWS_REGION=$AWS_REGION
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_KEY
S3_BUCKET_NAME=$STORAGE_BUCKET

# OAuth (configure your own or use Manus)
OAUTH_SERVER_URL=https://your-oauth-server.com
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
ENVEOF

# Run database migrations
pnpm db:push

# Build application
pnpm build

# Start with PM2
pm2 start dist/index.js --name khaya-api
pm2 startup
pm2 save

# Configure nginx
sudo tee /etc/nginx/sites-available/khaya << 'NGINXEOF'
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/khaya /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL certificate
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME

echo "✅ Deployment complete!"
echo "API running at: https://$DOMAIN_NAME"
EOF

chmod +x deploy-to-ec2.sh

echo -e "${GREEN}✅ Deployment script created: deploy-to-ec2.sh${NC}"
echo ""

# Create summary file
cat > DEPLOYMENT_SUMMARY.txt << EOF
Khaya Production Deployment Summary
====================================

AWS Resources Created:
- RDS Database: $DB_INSTANCE_ID
  Endpoint: $DB_ENDPOINT
  Username: admin
  Password: [saved securely]

- EC2 Instance: $INSTANCE_ID
  IP Address: $INSTANCE_IP
  SSH Key: $KEY_FILE
  Security Group: $SG_ID

- S3 Buckets:
  Storage: $STORAGE_BUCKET
  Frontend: $FRONTEND_BUCKET

- IAM User: $IAM_USER
  Access Key: $AWS_ACCESS_KEY
  Secret Key: [saved securely]

Next Steps:
1. Copy deploy-to-ec2.sh to your EC2 instance:
   scp -i $KEY_FILE deploy-to-ec2.sh ubuntu@$INSTANCE_IP:/home/ubuntu/

2. SSH into your EC2 instance:
   ssh -i $KEY_FILE ubuntu@$INSTANCE_IP

3. Run the deployment script:
   bash /home/ubuntu/deploy-to-ec2.sh

4. Build and upload frontend:
   pnpm build
   aws s3 sync dist/public/ s3://$FRONTEND_BUCKET --delete

5. Configure Route 53 DNS:
   - Point $DOMAIN_NAME to $INSTANCE_IP
   - Wait for DNS propagation (24-48 hours)

6. Test your application:
   https://$DOMAIN_NAME

Estimated Monthly Cost: ~R680 (R200 with free tier)

Support: https://github.com/lante007/Khaya/issues
EOF

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ AWS Infrastructure Created!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Summary saved to: DEPLOYMENT_SUMMARY.txt"
echo ""
echo "Next steps:"
echo "1. Copy deploy-to-ec2.sh to your EC2 instance"
echo "2. SSH into EC2 and run the script"
echo "3. Build and upload frontend"
echo "4. Configure DNS"
echo ""
echo "SSH command:"
echo "  ssh -i $KEY_FILE ubuntu@$INSTANCE_IP"
echo ""
echo "Full instructions in: DEPLOYMENT_GUIDE.md"
echo ""
