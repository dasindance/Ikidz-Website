# Deployment Guide

This guide covers multiple deployment options for the Classroom Parent Portal.

## Quick Start Deployment Matrix

| Option | Best For | Cost | Difficulty | Setup Time |
|--------|----------|------|------------|------------|
| Vercel | Production | Free-$20/mo | Easy | 10 min |
| Docker | Self-hosting | Server cost only | Medium | 30 min |
| Railway | Quick deploy | ~$5-20/mo | Easy | 15 min |
| VPS | Full control | $5-50/mo | Hard | 1-2 hours |

---

## Option 1: Vercel (Recommended for Production)

### Advantages
- Zero-configuration deployment
- Automatic HTTPS
- Built-in cron jobs
- Generous free tier
- Automatic scaling

### Setup Steps

1. **Prepare Your Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **Create a Database**
   
   Choose a hosted PostgreSQL provider:
   - **Neon** (recommended): [neon.tech](https://neon.tech) - Generous free tier
   - **Supabase**: [supabase.com](https://supabase.com) - Free tier available
   - **Railway**: [railway.app](https://railway.app) - Simple setup

   Get your connection string: `postgresql://user:pass@host:5432/dbname`

3. **Deploy to Vercel**
   
   a. Go to [vercel.com/new](https://vercel.com/new)
   
   b. Import your GitHub repository
   
   c. Configure project:
      - Framework Preset: Next.js
      - Root Directory: `parent-portal`
      - Build Command: `npm run build`
      - Install Command: `npm install`

4. **Add Environment Variables**
   
   In Vercel dashboard, add these variables:
   
   ```env
   # Database
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   
   # Auth (generate: openssl rand -base64 32)
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-generated-secret
   
   # Storage (AWS S3 or Cloudflare R2)
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=your-bucket
   # AWS_ENDPOINT=https://account.r2.cloudflarestorage.com  # Only for R2
   
   # Email (from resend.com)
   RESEND_API_KEY=re_your_key
   EMAIL_FROM=noreply@yourdomain.com
   
   # App
   NEXT_PUBLIC_APP_NAME=Classroom Portal
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   
   # Cron (generate random string)
   CRON_SECRET=random-secret-string
   ```

5. **Deploy and Initialize Database**
   
   After deployment:
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   vercel login
   
   # Link to your project
   vercel link
   
   # Run migrations
   vercel env pull .env.local
   npx prisma migrate deploy
   
   # Seed database
   npx prisma db seed
   ```

6. **Verify Deployment**
   - Visit your Vercel URL
   - Log in with demo credentials
   - Test functionality

### Vercel Cron Jobs

Cron jobs are automatically configured via `vercel.json`:
- Membership checks: Daily at 9 AM
- Homework reminders: Daily at 6 PM

No additional setup needed!

---

## Option 2: Docker (Self-Hosted)

### Advantages
- Complete control
- Run on any server
- Includes database
- Easy updates

### Setup Steps

1. **Install Docker**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   
   # Install Docker Compose
   sudo apt install docker-compose
   ```

2. **Create Environment File**
   ```bash
   cd parent-portal
   cp .env.example .env
   nano .env  # Edit with your values
   ```

3. **Update docker-compose.yml**
   
   Change the default passwords in `docker-compose.yml`:
   ```yaml
   POSTGRES_PASSWORD: your-secure-password-here
   ```
   
   And update the DATABASE_URL accordingly.

4. **Start Services**
   ```bash
   docker-compose up -d
   ```

5. **Initialize Database**
   ```bash
   # Run migrations
   docker-compose exec app npx prisma migrate deploy
   
   # Seed data
   docker-compose exec app npm run db:seed
   ```

6. **Set Up Cron Jobs**
   
   Add to host machine's crontab:
   ```bash
   crontab -e
   ```
   
   Add these lines:
   ```cron
   0 9 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/check-memberships
   0 18 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/check-homework
   ```

7. **Set Up Nginx Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **Set Up SSL with Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

### Docker Management Commands

```bash
# View logs
docker-compose logs -f app

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Update application
git pull
docker-compose build
docker-compose up -d

# Backup database
docker-compose exec postgres pg_dump -U classroom classroom_portal > backup.sql

# Restore database
docker-compose exec -T postgres psql -U classroom classroom_portal < backup.sql
```

---

## Option 3: Railway

### Advantages
- Automatic deployments from GitHub
- Includes database
- Simple pricing
- Easy setup

### Setup Steps

1. **Go to Railway**
   - Visit [railway.app](https://railway.app)
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add PostgreSQL**
   - Click "New"
   - Select "Database" → "PostgreSQL"
   - Copy the connection string

4. **Configure Environment Variables**
   
   In Railway dashboard, add all variables from `.env.example`:
   - Use the PostgreSQL connection string from Railway
   - Generate new secrets for NEXTAUTH_SECRET and CRON_SECRET

5. **Deploy**
   - Railway automatically builds and deploys
   - Get your public URL from the dashboard

6. **Initialize Database**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and run migrations
   railway login
   railway link
   railway run npx prisma migrate deploy
   railway run npm run db:seed
   ```

7. **Set Up Cron Jobs**
   
   Create a separate cron service:
   - Deploy [EasyCron](https://www.easycron.com) or similar
   - Or use GitHub Actions (see below)

---

## Option 4: Traditional VPS

### Requirements
- Ubuntu 22.04 LTS
- 1GB+ RAM
- Node.js 20+
- PostgreSQL 14+
- Nginx

### Full Setup Script

```bash
#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql -c "CREATE USER classroom WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "CREATE DATABASE classroom_portal OWNER classroom;"

# Install Nginx
sudo apt install -y nginx

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Install PM2
sudo npm install -g pm2

# Clone your repository
cd /var/www
sudo git clone <your-repo-url> classroom-portal
cd classroom-portal/parent-portal

# Install dependencies
npm ci --production

# Set up environment variables
sudo nano .env  # Paste your production .env

# Build application
npm run build

# Run migrations
npx prisma migrate deploy
npm run db:seed

# Start with PM2
pm2 start npm --name classroom-portal -- start
pm2 save
pm2 startup

# Configure Nginx
sudo nano /etc/nginx/sites-available/classroom-portal
# Paste nginx config (see above)

sudo ln -s /etc/nginx/sites-available/classroom-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Set up SSL
sudo certbot --nginx -d yourdomain.com

# Set up cron jobs
crontab -e
# Add cron entries (see above)
```

---

## Storage Setup

### AWS S3

1. **Create Bucket**
   - Go to AWS S3 Console
   - Create new bucket
   - Uncheck "Block all public access"

2. **Configure CORS**
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["PUT", "POST", "GET"],
       "AllowedOrigins": ["https://yourdomain.com"],
       "ExposeHeaders": []
     }
   ]
   ```

3. **Create IAM User**
   - Create user with programmatic access
   - Attach policy: `AmazonS3FullAccess`
   - Save credentials

### Cloudflare R2

1. **Create R2 Bucket**
   - Go to Cloudflare Dashboard
   - Navigate to R2
   - Create bucket

2. **Generate API Token**
   - Create API token with R2 read/write access
   - Save access key and secret

3. **Set Environment Variables**
   ```env
   AWS_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_S3_BUCKET_NAME=your-bucket
   ```

---

## Email Setup (Resend)

1. **Sign Up**
   - Go to [resend.com](https://resend.com)
   - Create account

2. **Add Domain**
   - Add your domain
   - Add DNS records provided by Resend
   - Verify domain

3. **Create API Key**
   - Generate API key
   - Set `RESEND_API_KEY` in environment

4. **Test Email**
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "noreply@yourdomain.com",
       "to": "test@example.com",
       "subject": "Test",
       "html": "<p>Test email</p>"
     }'
   ```

---

## Monitoring & Maintenance

### Application Monitoring

**For Vercel:**
- Built-in analytics in dashboard
- Real-time logs
- Automatic error tracking

**For Self-Hosted:**
```bash
# Install monitoring tools
npm install -g pm2
pm2 install pm2-logrotate

# View logs
pm2 logs classroom-portal

# Monitor resources
pm2 monit
```

### Database Backups

**Automated Backup Script:**
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/classroom-portal"
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T postgres pg_dump -U classroom classroom_portal > $BACKUP_DIR/db_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/db_$DATE.sql s3://your-backup-bucket/
```

Add to crontab:
```cron
0 2 * * * /path/to/backup.sh
```

---

## Troubleshooting

### Common Issues

**Build Fails:**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

**Database Connection:**
```bash
# Test connection
npx prisma db execute --stdin <<< "SELECT 1;"

# Reset migrations
npx prisma migrate reset
```

**Port Already in Use:**
```bash
# Find process
lsof -i :3000
# Kill process
kill -9 <PID>
```

**File Upload Errors:**
- Check AWS credentials
- Verify bucket permissions
- Test with AWS CLI: `aws s3 ls`

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Set up SSL/HTTPS
- [ ] Configure firewall (ufw or cloud provider)
- [ ] Enable automatic security updates
- [ ] Set up database backups
- [ ] Use environment variables (never commit secrets)
- [ ] Configure CORS correctly
- [ ] Set up monitoring and alerts
- [ ] Regular dependency updates

---

## Performance Optimization

### Database
```sql
-- Add indexes for common queries
CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
```

### Caching
- Enable Redis for session storage (optional)
- Configure CDN for static assets
- Use ISR (Incremental Static Regeneration) for public pages

### Monitoring
- Set up Sentry for error tracking
- Use Datadog or New Relic for APM
- Monitor database performance

---

## Scaling Considerations

### When to Scale

- Database: >1000 students
- Storage: >100GB files
- Traffic: >10k daily users

### Scaling Options

1. **Database:**
   - Read replicas
   - Connection pooling (PgBouncer)
   - Upgrade to managed database

2. **Application:**
   - Horizontal scaling (multiple instances)
   - Load balancer
   - CDN for static assets

3. **Storage:**
   - Separate storage tier
   - CDN for file delivery
   - Archive old submissions

---

## Support

For deployment issues:
1. Check application logs
2. Verify all environment variables
3. Test database connection
4. Review error messages

Need help? Check the main README.md for troubleshooting tips.

