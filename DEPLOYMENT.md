# WaiterCall Deployment Guide

## 🚀 Deployment Overview

This guide covers deploying the WaiterCall application with all the recent enhancements including database transactions, authorization, standardized status handling, input validation, performance monitoring, and comprehensive testing.

## 📋 Prerequisites

### Required Services
- **Node.js**: v18.0 or higher
- **PostgreSQL**: v13 or higher
- **Redis**: For session storage (optional but recommended)
- **Supabase**: For realtime functionality and database hosting
- **Vercel**: For hosting (recommended) or any Node.js hosting platform

### Environment Variables
Create a `.env.local` file with the following variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/waiter_call"
DIRECT_URL="postgresql://username:password@localhost:5432/waiter_call"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Push Notifications
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_EMAIL="your-email@example.com"

# Performance Monitoring
PUSH_ENABLED=true
MONITORING_ENABLED=true

# Application
NODE_ENV="production"
PORT=3000
```

## 🗄️ Database Setup

### Option 1: Supabase (Recommended)
1. Create a new Supabase project
2. Run the provided SQL schema from `prisma/schema.prisma`
3. Set up authentication and Row Level Security (RLS)
4. Configure realtime subscriptions
5. Get your connection string and keys

### Option 2: Self-Hosted PostgreSQL
1. Install PostgreSQL 13+
2. Create database:
   ```sql
   CREATE DATABASE waiter_call;
   CREATE USER waiter_call_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE waiter_call TO waiter_call_user;
   ```
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

#### Automatic Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Manual Deployment with Environment Variables
1. Go to Vercel dashboard
2. Create new project or use existing
3. Add all environment variables from `.env.local`
4. Connect your GitHub repository
5. Deploy

#### Vercel Configuration
Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "NEXTAUTH_URL": "@nextauth_url",
    "VAPID_PUBLIC_KEY": "@vapid_public_key",
    "VAPID_PRIVATE_KEY": "@vapid_private_key",
    "VAPID_EMAIL": "@vapid_email",
    "PUSH_ENABLED": "@push_enabled",
    "MONITORING_ENABLED": "@monitoring_enabled"
  },
  "build": {
    "env": {
      "DATABASE_URL": "@database_url",
      "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
      "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key",
      "NEXTAUTH_SECRET": "@nextauth_secret",
      "NEXTAUTH_URL": "@nextauth_url",
      "VAPID_PUBLIC_KEY": "@vapid_public_key",
      "VAPID_PRIVATE_KEY": "@vapid_private_key",
      "VAPID_EMAIL": "@vapid_email",
      "PUSH_ENABLED": "@push_enabled",
      "MONITORING_ENABLED": "@monitoring_enabled"
    }
  }
}
```

### Option 2: Docker Deployment

#### Create Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma/
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

#### Create docker-compose.yml
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/waiter_call
      - NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
      - SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=waiter_call
      - POSTGRES_USER=waiter_call_user
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

### Option 3: Traditional Hosting

#### Build for Production
```bash
# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build application
npm run build

# Start production server
npm start
```

## 🔧 Pre-Deployment Checklist

### Database Preparation
- [ ] Database server is running and accessible
- [ ] Database schema is up-to-date (`npx prisma migrate deploy`)
- [ ] Database user has proper permissions
- [ ] Connection string is correct and secure

### Environment Setup
- [ ] All required environment variables are set
- [ `.env.local` file is created (not committed to git)
- [ ] Environment variables are configured for production
- [ ] Sensitive data is properly secured

### Application Testing
- [ ] All tests pass: `npm test`
- [ ] Integration tests pass: `npm run test:integration`
- [ ] Build completes successfully: `npm run build`
- [ ] Performance tests pass: `npm run test:performance`

### Security Configuration
- [ ] Database credentials are secure and not hardcoded
- [ ] API keys are properly configured
- [ CORS is configured for production domains
- [ ] HTTPS is enabled in production
- [ ] Rate limiting is properly configured

### Performance Optimization
- [ ] Database indexes are created for performance
- [ ] Caching is configured for static assets
- [ ] Image optimization is enabled
- [ ] Bundle size is optimized
- [ ] Service worker is configured for PWA

## 🚀 Deployment Steps

### 1. Environment Setup
```bash
# Clone repository
git clone https://github.com/Mahelidennis/waiter-call.git
cd waiter-call

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your actual values
```

### 2. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Verify database connection
npx prisma db seed
```

### 3. Build Application
```bash
# Build for production
npm run build

# Verify build output
ls -la .next/
```

### 4. Deploy
#### For Vercel:
```bash
# Deploy to Vercel
vercel --prod
```

#### For Docker:
```bash
# Build and run with Docker
docker-compose up -d
```

#### For Traditional Hosting:
```bash
# Start production server
npm start
```

## 🔍 Post-Deployment Verification

### Health Checks
```bash
# Test API endpoints
curl -X POST http://localhost:3000/api/calls \
  -H "Content-Type: application/json" \
  -d '{"tableId":"test","restaurantId":"test"}'

# Test database connection
npx prisma db pull
```

### Performance Monitoring
- Check performance metrics in logs
- Monitor database query performance
- Verify API response times
- Check memory usage and trends

### Realtime Testing
- Test realtime connection establishment
- Verify push notification delivery
- Test call status updates in real-time
- Verify connection cleanup on page navigation

### Integration Testing
```bash
# Run integration tests
npm run test:integration

# Run performance tests
npm run test:performance

# Run all tests
npm test
```

## 📊 Monitoring and Logging

### Application Logs
- Check application logs for errors
- Monitor database connection status
- Track API response times
- Monitor realtime connection health

### Performance Metrics
- Monitor API response times
- Track database query performance
- Monitor memory usage trends
- Track error rates and patterns

### Error Monitoring
- Set up error tracking (Sentry, LogRocket, etc.)
- Monitor database connection errors
- Track API failure rates
- Monitor realtime connection failures

## 🔄 Update and Maintenance

### Regular Updates
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Run database migrations if needed
npx prisma migrate deploy

# Rebuild application
npm run build

# Restart services
```

### Database Maintenance
```bash
# Backup database
pg_dump waiter_call > backup-$(date +%Y%m%d).sql

# Optimize database
VACUUM ANALYZE waiter_call

# Update statistics
ANALYZE waiter_call.calls
```

### Security Updates
- Regularly update dependencies
- Review and update environment variables
- Rotate API keys and secrets
- Update CORS configuration
- Review and update rate limiting rules

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors
- **Error**: "Can't reach database server"
- **Solution**: Check DATABASE_URL and ensure database is running
- **Solution**: Verify network connectivity and firewall settings

#### Build Errors
- **Error**: "Prisma generate failed"
- **Solution**: Check file permissions and close any database connections
- **Solution**: Clear node_modules and reinstall dependencies

#### Runtime Errors
- **Error**: "500 Internal Server Error"
- **Solution**: Check application logs for specific error details
- **Solution**: Verify environment variables and database connection

#### Realtime Issues
- **Error**: "Realtime connection failed"
- **Solution**: Check Supabase configuration and network connectivity
- **Solution**: Verify API keys and permissions

### Performance Issues
- **Issue**: Slow API response times
- **Solution**: Check database indexes and query optimization
- **Solution**: Monitor and optimize slow queries

### Deployment Issues
- **Error**: "Build failed"
- **Solution**: Check Node.js version and dependencies
- **Solution**: Verify environment variables and database connection

## 📞 Support and Documentation

### Documentation
- [API Documentation](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Deployment Guide](./docs/deployment.md)
- [Troubleshooting Guide](./docs/troubleshooting.md)

### Community Support
- GitHub Issues: [Create Issue](https://github.com/Mahelidennis/waiter-call/issues)
- Discussions: [Start Discussion](https://github.com/Mahelidennis/waiter-call/discussions)
- Wiki: [Project Wiki](https://github.com/Mahelidennis/waiter-call/wiki)

### Technical Support
- Email: support@example.com
- Documentation: [Read the Docs](./docs/)
- Issues: [GitHub Issues](https://github.com/Mahelidennis/waiter-call/issues)

## 🎉 Rollback Plan

If deployment fails, use this rollback plan:

### 1. Quick Rollback
```bash
# Revert to previous commit
git revert HEAD~1

# Redeploy
vercel --prod
```

### 2. Database Rollback
```bash
# Rollback database migrations
npx prisma migrate reset

# Restore database from backup
psql < backup-file.sql
```

### 3. Full Rollback
```bash
# Reset to previous commit
git reset --hard HEAD~1

# Clean and reinstall
rm -rf node_modules
npm install
npm run build
```

## 📈 Success Metrics

After successful deployment, verify:

- ✅ Application is accessible at the deployed URL
- ✅ All API endpoints are responding correctly
- ✅ Database operations are working
- ✅ Realtime connections are established
- ✅ Push notifications are being sent
- ✅ Performance metrics are within acceptable ranges
- ✅ Error rates are below thresholds
- ✅ Monitoring and logging is functioning

---

## 🎉 Deployment Complete!

Your WaiterCall application has been successfully deployed with all the enhanced features:

- ✅ **Database Transactions**: Atomic operations with notification retry logic
- ✅ **Authorization System**: Role-based access control
- ✅ **Standardized Status Handling**: Centralized status management
- ✅ **Input Validation**: Comprehensive security validation
- ✅ **Performance Monitoring**: Real-time performance tracking
- ✅ **Realtime Cleanup**: Memory leak prevention
- ✅ **Integration Tests**: Comprehensive test coverage

The application is now ready for production use with enterprise-grade features including security, performance monitoring, and comprehensive testing! 🚀
