# Classroom Parent Portal

A modern, full-stack web application for classroom management designed for teachers and parents. Track homework, lessons, class memberships, and stay connected with automated notifications.

## Features

### For Parents
- **Dashboard Overview**: View student progress, class memberships, and upcoming assignments
- **Homework Management**: View assignments and submit completed work
- **Lesson History**: See what topics were covered in recent classes
- **Notifications**: Receive in-app and email notifications for important updates
- **Calendar**: View holidays, schedule changes, and upcoming events
- **Announcements**: Stay informed with teacher announcements

### For Teachers
- **Admin Dashboard**: Comprehensive overview of all classes and students
- **Post Lessons**: Record daily lessons with units and topics covered
- **Homework Assignments**: Create and manage homework with automatic parent notifications
- **Announcements**: Broadcast important updates to all parents
- **Student Management**: Track enrollments and class memberships
- **Calendar Management**: Set holidays and schedule changes

### System Features
- **Role-Based Access Control**: Separate interfaces for parents and teachers
- **Automated Notifications**: Email and in-app alerts for:
  - Class membership renewals
  - New homework assignments
  - Upcoming due dates
  - Schedule changes and holidays
- **File Upload System**: Secure cloud storage for homework submissions
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Frontend**: Next.js 14 (React), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **File Storage**: AWS S3 or Cloudflare R2
- **Email**: Resend API
- **UI Components**: Radix UI + shadcn/ui

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL database
- AWS S3 or Cloudflare R2 account (for file uploads)
- Resend API key (for email notifications)

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd parent-portal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Copy `.env.example` to `.env.local` and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

   Required environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/classroom_portal"

   # NextAuth (generate secret with: openssl rand -base64 32)
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-here"

   # AWS S3 or Cloudflare R2
   AWS_ACCESS_KEY_ID="your-key"
   AWS_SECRET_ACCESS_KEY="your-secret"
   AWS_REGION="us-east-1"
   AWS_S3_BUCKET_NAME="your-bucket"
   # For R2, also set:
   # AWS_ENDPOINT="https://account-id.r2.cloudflarestorage.com"

   # Email (get from resend.com)
   RESEND_API_KEY="re_..."
   EMAIL_FROM="noreply@yourdomain.com"

   # App Settings
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # Cron Secret (generate random string)
   CRON_SECRET="random-secret-for-cron-jobs"
   ```

4. **Set up the database:**
   ```bash
   # Push the schema to your database
   npm run db:push

   # Seed with demo data (optional but recommended)
   npm run db:seed
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Demo Accounts

After seeding, you can log in with:

- **Teacher**: `teacher@example.com` / `teacher123`
- **Parent**: `parent@example.com` / `parent123`

## Deployment

### Option 1: Vercel (Recommended)

1. **Push your code to GitHub**

2. **Import to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository

3. **Configure environment variables:**
   - Add all environment variables from `.env.example`
   - Set `NEXTAUTH_URL` to your production domain

4. **Set up database:**
   - Use a hosted PostgreSQL service (Neon, Supabase, Railway, etc.)
   - Run migrations: `npx prisma migrate deploy`
   - Run seed script: `npm run db:seed`

5. **Deploy!**
   - Vercel will automatically deploy on push
   - Cron jobs are configured in `vercel.json`

### Option 2: Docker (Self-Hosted)

1. **Create a `.env` file** with your production values

2. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **Run migrations:**
   ```bash
   docker-compose exec app npx prisma migrate deploy
   docker-compose exec app npm run db:seed
   ```

4. **Access the application:**
   - App: http://localhost:3000
   - Database: localhost:5432

### Option 3: Traditional VPS

1. **Set up Node.js 20+ on your server**

2. **Install dependencies and build:**
   ```bash
   npm ci --production
   npm run build
   ```

3. **Set up environment variables:**
   ```bash
   export DATABASE_URL="..."
   export NEXTAUTH_SECRET="..."
   # ... set all other variables
   ```

4. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

5. **Start the application:**
   ```bash
   npm start
   ```

6. **Set up a process manager** (PM2 recommended):
   ```bash
   npm install -g pm2
   pm2 start npm --name "classroom-portal" -- start
   pm2 save
   pm2 startup
   ```

7. **Configure nginx** as a reverse proxy

## Database Management

### View your data:
```bash
npm run db:studio
```

### Create a migration:
```bash
npm run db:migrate
```

### Reset database (development only):
```bash
npx prisma migrate reset
```

## Automated Tasks

The application includes automated background tasks:

1. **Membership Renewal Checker** (daily at 9 AM)
   - Checks for low class balances
   - Sends renewal reminders

2. **Homework Reminder** (daily at 6 PM)
   - Sends reminders for upcoming homework

For Vercel, these are configured in `vercel.json`.

For self-hosted deployments, set up cron jobs:
```cron
# Check memberships daily at 9 AM
0 9 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/check-memberships

# Check homework daily at 6 PM
0 18 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/check-homework
```

## File Storage Setup

### AWS S3

1. Create an S3 bucket
2. Set CORS configuration:
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
3. Create an IAM user with S3 access
4. Set environment variables

### Cloudflare R2

1. Create an R2 bucket
2. Generate an API token
3. Set environment variables including `AWS_ENDPOINT`

## Email Setup with Resend

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Generate an API key
4. Set `RESEND_API_KEY` and `EMAIL_FROM` in environment variables

## Project Structure

```
parent-portal/
├── app/                    # Next.js app directory
│   ├── (parent)/          # Parent portal pages
│   ├── (teacher)/         # Teacher portal pages
│   ├── api/               # API routes
│   └── login/             # Authentication pages
├── components/            # React components
│   └── ui/                # UI components (shadcn)
├── lib/                   # Utility functions
│   ├── auth.ts           # Authentication config
│   ├── db.ts             # Database client
│   ├── notifications/    # Notification system
│   └── storage/          # File upload utilities
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
└── public/               # Static files
```

## Security Considerations

- All routes are protected with authentication middleware
- Role-based access control prevents unauthorized access
- File uploads are validated and sanitized
- Passwords are hashed with bcrypt
- Database queries use Prisma to prevent SQL injection
- Environment variables keep secrets secure

## Support & Customization

This application is designed to be easily customizable:

- Modify the color scheme in `tailwind.config.ts`
- Add new notification types in `prisma/schema.prisma`
- Extend the API with new routes in `app/api/`
- Customize email templates in `lib/notifications/email.ts`

## License

This project is provided as-is for educational and commercial use.

## Troubleshooting

### Database Connection Issues
- Verify your DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check firewall settings

### File Upload Errors
- Verify AWS/R2 credentials
- Check bucket permissions
- Confirm CORS settings

### Email Not Sending
- Verify Resend API key
- Check domain verification
- Review email quotas

For additional help, check the application logs and error messages.


