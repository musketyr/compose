# Scribe Deployment Guide

## Quick Deploy to Vercel

### Step 1: Prepare Your Repository

```bash
cd /home/ubuntu/clawd/scribe

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial Scribe deployment"

# Add your GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/scribe.git
git branch -M main
git push -u origin main
```

### Step 2: Create Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Click "Create Project"
3. Choose a name (e.g., "scribe-production")
4. Select a region close to your users
5. Copy the connection string (starts with `postgresql://`)

### Step 3: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click "Import Project"
3. Select your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### Step 4: Configure Environment Variables

In Vercel project settings, add:

```bash
# Required
DATABASE_URL=postgresql://your-neon-connection-string
API_SECRET=your-random-secret-here

# Optional (for chat integration)
NEXT_PUBLIC_OPENCLAW_WS_URL=wss://your-gateway-url.com
```

To generate a secure API_SECRET:
```bash
openssl rand -hex 32
```

### Step 5: Initialize Production Database

After deployment completes:

```bash
# Get your Vercel URL from deployment log
curl https://your-app.vercel.app/api/init
```

Expected response:
```json
{"success":true,"message":"Database initialized"}
```

### Step 6: Create Your First Token

```bash
curl -X POST https://your-app.vercel.app/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"name":"Production Token"}'
```

Save the returned token securely!

### Step 7: Test Your Deployment

1. Visit `https://your-app.vercel.app`
2. Paste your token
3. Create a draft
4. Test the editor
5. Verify auto-save works

## Environment Variables Explained

### DATABASE_URL (Required)
Your Neon Postgres connection string. Format:
```
postgresql://user:password@host/database?sslmode=require
```

### API_SECRET (Required)
Random string for token hashing. Generate with:
```bash
openssl rand -hex 32
```

### NEXT_PUBLIC_OPENCLAW_WS_URL (Optional)
WebSocket URL for chat integration. Must be publicly accessible.
- Development: `ws://localhost:18789`
- Production: `wss://your-gateway.com`

## Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Neon database created
- [ ] Vercel project created
- [ ] Environment variables configured
- [ ] Database initialized (`/api/init`)
- [ ] API token created
- [ ] Application tested in production
- [ ] DNS configured (if using custom domain)
- [ ] SSL certificate active (automatic with Vercel)

## Custom Domain Setup

1. Go to Vercel project settings
2. Click "Domains"
3. Add your domain
4. Follow DNS configuration instructions
5. Wait for SSL certificate (automatic)

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature X"
git push origin main
```

Deployment starts automatically! Monitor at:
- Vercel Dashboard → Your Project → Deployments

## Rolling Back

If something goes wrong:

1. Go to Vercel Dashboard
2. Click your project
3. Find previous working deployment
4. Click "Promote to Production"

## Environment-Specific Configs

### Development
```env
DATABASE_URL=postgresql://localhost/scribe_dev
API_SECRET=dev_secret_not_for_production
OPENCLAW_WS_URL=ws://localhost:18789
```

### Staging
```env
DATABASE_URL=postgresql://staging-db.neon.tech/scribe
API_SECRET=staging_secret_different_from_prod
NEXT_PUBLIC_OPENCLAW_WS_URL=wss://staging-gateway.example.com
```

### Production
```env
DATABASE_URL=postgresql://prod-db.neon.tech/scribe
API_SECRET=super_secure_random_string
NEXT_PUBLIC_OPENCLAW_WS_URL=wss://gateway.example.com
```

## Database Backups

### Neon Built-in Backups
Neon automatically backs up your database. To restore:
1. Go to Neon Console
2. Select your project
3. Click "Restore" → Choose point in time

### Manual Export
```bash
# Export database
pg_dump $DATABASE_URL > scribe_backup.sql

# Import database
psql $DATABASE_URL < scribe_backup.sql
```

## Monitoring

### Vercel Analytics
Enable in Vercel dashboard for:
- Page views
- User locations
- Performance metrics
- Error tracking

### Database Monitoring
Neon console provides:
- Connection counts
- Query performance
- Storage usage
- Database activity

## Troubleshooting

### Build Fails
- Check Node.js version (requires 20+)
- Verify all dependencies in package.json
- Check for TypeScript errors locally first

### Database Connection Fails
- Verify DATABASE_URL is correct
- Check Neon database is active
- Ensure SSL mode is enabled
- Verify IP allowlist (if configured)

### API Returns 500
- Check Vercel function logs
- Verify environment variables
- Test API locally first
- Check database connectivity

### Chat Not Connecting
- Verify WebSocket URL is correct
- Check gateway is running
- Ensure WSS (not WS) in production
- Check firewall/proxy settings

## Performance Optimization

### Enable Edge Runtime (Future)
For ultra-fast API responses, add to API routes:
```typescript
export const runtime = 'edge';
```

### Database Connection Pooling
Already enabled with Neon serverless driver.

### Image Optimization
Add to `next.config.ts` if adding image uploads:
```typescript
images: {
  domains: ['your-cdn.com'],
}
```

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Rotate tokens** - Generate new tokens periodically
3. **Monitor access** - Check Vercel logs regularly
4. **Use HTTPS** - Enabled by default on Vercel
5. **Keep dependencies updated** - Run `npm audit` regularly

## Scaling

Scribe automatically scales on Vercel:
- **Serverless functions** - Scale to zero when idle
- **Edge network** - Global CDN for static assets
- **Database** - Neon scales automatically

## Cost Estimates

### Free Tier (Good for personal use)
- **Vercel**: Free for hobby projects
- **Neon**: 0.5GB storage, 100 hours compute
- **Total**: $0/month

### Pro Tier (For production apps)
- **Vercel Pro**: $20/month
- **Neon Scale**: Starts at $19/month
- **Total**: ~$40/month + usage

## Alternative Deployments

### Railway
```bash
railway init
railway add postgresql
railway up
```

### AWS Amplify
Use the Amplify console to import from GitHub.

### Self-Hosted
```bash
npm run build
npm start
```
Requires:
- Node.js server
- PostgreSQL database
- Reverse proxy (nginx)
- SSL certificate

## Post-Deployment

1. **Create tokens for users**
   ```bash
   for i in {1..5}; do
     curl -X POST https://your-app.vercel.app/api/auth/token \
       -H "Content-Type: application/json" \
       -d "{\"name\":\"Token $i\"}"
   done
   ```

2. **Share with users**
   - Send them the URL
   - Provide their token (securely)
   - Share user guide (README.md)

3. **Monitor usage**
   - Check Vercel analytics
   - Monitor database size
   - Track API usage

4. **Set up alerts**
   - Vercel deployment notifications
   - Neon database alerts
   - Error tracking (Sentry)

## Support

If you run into issues:
1. Check Vercel deployment logs
2. Check Neon database logs
3. Test API endpoints with curl
4. Review environment variables
5. Check this guide's troubleshooting section

---

**Happy Deploying!** 🚀
