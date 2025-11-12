# Quick Setup Guide

Get the Classroom Parent Portal running in minutes!

## 🚀 5-Minute Local Setup

### Step 1: Prerequisites

Install these first:
- [Node.js 20+](https://nodejs.org/) (includes npm)
- [PostgreSQL](https://www.postgresql.org/download/)
- [Git](https://git-scm.com/)

### Step 2: Get the Code

```bash
cd parent-portal
npm install
```

### Step 3: Set Up Environment

```bash
# Copy the example file
cp .env.example .env.local
```

Edit `.env.local` with minimal required settings:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://postgres:password@localhost:5432/classroom_portal"

# Auth - Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_SECRET="paste-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# For now, use placeholder values (you can add real ones later)
AWS_ACCESS_KEY_ID="placeholder"
AWS_SECRET_ACCESS_KEY="placeholder"
AWS_S3_BUCKET_NAME="placeholder"
RESEND_API_KEY="placeholder"
EMAIL_FROM="noreply@example.com"
CRON_SECRET="dev-secret"
```

### Step 4: Set Up Database

```bash
# Create database and tables
npm run db:push

# Add demo data
npm run db:seed
```

### Step 5: Start the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 6: Log In

Use these demo accounts:
- **Teacher**: `teacher@example.com` / `teacher123`
- **Parent**: `parent@example.com` / `parent123`

🎉 **Done!** You're now running the classroom portal locally.

---

## 🔧 Optional: Enable Full Features

The app works without these, but to enable all features:

### File Uploads (Choose One)

**Option A: AWS S3**
1. Create AWS account
2. Create S3 bucket
3. Create IAM user with S3 access
4. Update `.env.local`:
   ```env
   AWS_ACCESS_KEY_ID="your-key"
   AWS_SECRET_ACCESS_KEY="your-secret"
   AWS_REGION="us-east-1"
   AWS_S3_BUCKET_NAME="your-bucket"
   ```

**Option B: Cloudflare R2** (Recommended - has free tier)
1. Create Cloudflare account
2. Create R2 bucket
3. Generate API token
4. Update `.env.local`:
   ```env
   AWS_ACCESS_KEY_ID="your-r2-key"
   AWS_SECRET_ACCESS_KEY="your-r2-secret"
   AWS_S3_BUCKET_NAME="your-bucket"
   AWS_ENDPOINT="https://account-id.r2.cloudflarestorage.com"
   ```

### Email Notifications

1. Sign up at [Resend.com](https://resend.com) (100 emails/day free)
2. Verify your domain or use their test domain
3. Generate API key
4. Update `.env.local`:
   ```env
   RESEND_API_KEY="re_your_key_here"
   EMAIL_FROM="noreply@yourdomain.com"
   ```

---

## 📱 Using the Application

### As a Teacher

1. **Post a Lesson**
   - Go to "Post Lesson"
   - Select class, date, unit, and topics
   - Add optional notes
   - Click "Post Lesson"

2. **Create Homework**
   - Go to "Homework"
   - Click "New Assignment"
   - Fill in details and due date
   - Click "Create" - parents get notified automatically

3. **Make Announcements**
   - Go to "Announcements"
   - Click "New Announcement"
   - Write your message
   - Select category and priority

4. **Add Holidays**
   - Go to "Calendar"
   - Click "Add Holiday"
   - Set date and description

### As a Parent

1. **View Dashboard**
   - See all student information at a glance
   - Check class memberships
   - View upcoming homework

2. **Submit Homework**
   - Go to "Homework"
   - Click on an assignment
   - Click "Submit Work"
   - Upload file and submit

3. **Track Lessons**
   - Go to "Lessons"
   - See what topics were covered
   - Read teacher notes

4. **Check Notifications**
   - Click notification bell
   - Mark as read
   - Receive emails for important updates

---

## 🛠️ Development Tips

### Useful Commands

```bash
# Start development server
npm run dev

# View database in browser
npm run db:studio

# Create database migration
npm run db:migrate

# Reset database (warning: deletes all data)
npx prisma migrate reset

# Check for TypeScript errors
npx tsc --noEmit

# Format code
npm run lint
```

### Database Management

**View Data:**
```bash
npm run db:studio
```
This opens Prisma Studio at [http://localhost:5555](http://localhost:5555)

**Add Test Data:**
```bash
npm run db:seed
```

**Reset Everything:**
```bash
npx prisma migrate reset
```

### Common Issues

**Port 3000 is busy:**
```bash
# Kill process on port 3000 (Mac/Linux)
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

**Database connection error:**
- Make sure PostgreSQL is running
- Verify DATABASE_URL in `.env.local`
- Check username/password

**Module not found:**
```bash
rm -rf node_modules
npm install
```

---

## 🚀 Ready to Deploy?

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment options:
- Vercel (easiest)
- Docker (self-hosted)
- Railway (simple)
- Traditional VPS (most control)

---

## 📚 Next Steps

### Customize the Application

**Change Colors:**
Edit `tailwind.config.ts` to change the theme colors.

**Add Features:**
- New notification types in `prisma/schema.prisma`
- Custom API routes in `app/api/`
- Additional pages in `app/(parent)/` or `app/(teacher)/`

**Modify Email Templates:**
Edit files in `lib/notifications/email.ts`

### Add Real Data

1. **Create Classes:**
   - Use Prisma Studio or add via code
   - Update seed script for your classes

2. **Add Students:**
   - Create parent accounts
   - Add students via Prisma Studio
   - Create enrollments

3. **Configure Settings:**
   - Set up actual email domain
   - Configure file storage
   - Customize notification schedules

---

## 🤝 Getting Help

**Check These First:**
1. Error messages in terminal
2. Browser console (F12)
3. Database connection
4. Environment variables

**Common Solutions:**
- Restart development server
- Clear browser cache
- Reset database with fresh seed data
- Check all environment variables are set

---

## 📝 Production Checklist

Before deploying to production:

- [ ] Set up real database (not local)
- [ ] Configure file storage (S3/R2)
- [ ] Set up email service (Resend)
- [ ] Generate secure secrets
- [ ] Set NEXTAUTH_URL to production domain
- [ ] Test all features
- [ ] Set up backups
- [ ] Configure monitoring
- [ ] Set up SSL/HTTPS
- [ ] Test on mobile devices

---

## 🎓 Learn More

**Technologies Used:**
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query)

**Component Library:**
- [Radix UI](https://www.radix-ui.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

Ready to build something amazing? Let's go! 🚀


