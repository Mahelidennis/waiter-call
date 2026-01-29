# 🚀 Production Deployment Guide

## 📋 Prerequisites Checklist

### ✅ Required Environment Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=your_supabase_database_url

# Push Notifications (Stage 4)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=admin@yourrestaurant.com
PUSH_ENABLED=true

# Optional
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://yourdomain.com
```

---

## 🌐 Option 1: Deploy to Vercel (Recommended)

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy Project
```bash
cd c:\Users\user\Desktop\smartservice\waiter-call
vercel --prod
```

### Step 4: Configure Environment Variables in Vercel
```bash
vercel env add
# Add all required environment variables
```

### Step 5: Redeploy with Environment Variables
```bash
vercel --prod
```

---

## 🐳 Option 2: Deploy with Docker

### Step 1: Create Dockerfile
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./

EXPOSE 3000
ENV PORT 3000
CMD ["npm", "start"]
```

### Step 2: Build and Run
```bash
docker build -t waiter-call .
docker run -p 3000:3000 --env-file .env waiter-call
```

---

## 🔧 Option 3: Manual Deployment

### Step 1: Build Project
```bash
cd c:\Users\user\Desktop\smartservice\waiter-call
npm run build
```

### Step 2: Start Production Server
```bash
npm start
```

### Step 3: Set Up Reverse Proxy (Nginx)
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔍 Pre-Deployment Testing

### Test Build Process
```bash
npm run build
```

### Test Environment Variables
```bash
node -e "console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

### Test Database Connection
```bash
npx prisma db pull
```

---

## 📱 PWA Configuration

### Service Worker Registration
The service worker is automatically registered and will work in production.

### Manifest.json
Located at `public/manifest.json` - automatically configured for PWA installation.

### HTTPS Requirement
PWA requires HTTPS - Vercel provides this automatically.

---

## 🚀 Deployment Commands

### Quick Deploy to Vercel
```bash
# One-command deployment
vercel --prod --env DATABASE_URL --env NEXT_PUBLIC_SUPABASE_URL --env NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Generate VAPID Keys (if not done)
```bash
npx web-push generate-vapid-keys
```

### Database Migration
```bash
npx prisma migrate deploy
```

---

## 📊 Post-Deployment Checklist

### ✅ Test All Features
- [ ] Customer QR code scanning works
- [ ] Waiter login functions
- [ ] Call creation and acknowledgment
- [ ] Push notifications (if enabled)
- [ ] PWA installation on mobile
- [ ] Real-time updates

### ✅ Monitor Performance
- [ ] Page load times < 3 seconds
- [ ] Push notification delivery > 90%
- [ ] Database response times < 500ms
- [ ] No console errors

### ✅ Security Check
- [ ] HTTPS enabled
- [ ] Environment variables secure
- [ ] Database connections encrypted
- [ ] API endpoints protected

---

## 🔄 Continuous Deployment

### GitHub Actions (Optional)
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 🆘 Troubleshooting

### Common Issues
1. **Build fails** → Check environment variables
2. **Database connection** → Verify DATABASE_URL
3. **Push notifications** → Check VAPID keys
4. **PWA not installing** → Ensure HTTPS and valid manifest

### Debug Commands
```bash
# Check build logs
vercel logs

# Test environment variables
vercel env ls

# Check deployment
vercel inspect
```

---

## 📈 Monitoring Setup

### Vercel Analytics
- Enabled by default
- Monitor page views and performance
- Track API response times

### Custom Monitoring
```javascript
// Add to app/layout.tsx
if (process.env.NODE_ENV === 'production') {
  // Add analytics tracking
}
```

---

## 🎯 Success Metrics

### Performance Targets
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### Business Metrics
- **Call response time**: < 2 minutes
- **Push notification delivery**: > 90%
- **User engagement**: > 70% return rate
- **System uptime**: > 99.9%

---

## 🎉 Ready to Launch!

Your PWA restaurant call system is now ready for production deployment!
