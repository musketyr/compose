# Deployment Guide for Scribe

## Prerequisites

1. **GitHub Account**: Push the code to a GitHub repository
2. **Vercel Account**: Sign up at https://vercel.com (free tier is fine)
3. **Neon Database**: Create a free Postgres database at https://neon.tech

## Step 1: Set up Neon Database

1. Go to https://neon.tech and create an account
2. Create a new project
3. Copy the connection string (it looks like: `postgresql://user:password@host.neon.tech/database`)
4. Save this for later - you'll need it in Vercel

## Step 2: Push to GitHub

```bash
cd /home/ubuntu/clawd/scribe

# Create a new repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/scribe.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

1. Go to https://vercel.com and sign in
2. Click "Add New Project"
3. Import your GitHub repository (scribe)
4. Configure the project:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

5. Add Environment Variables:
   ```
   POSTGRES_URL=postgresql://user:password@host.neon.tech/database
   NEXT_PUBLIC_OPENCLAW_WS=ws://localhost:18789
   ```
   (Replace with your actual Neon connection string)

6. Click "Deploy"

## Step 4: Initialize the Database

After deployment completes:

```bash
curl https://your-app.vercel.app/api/init
```

This will create all the necessary database tables.

## Step 5: Configure OpenClaw Gateway

Update the `NEXT_PUBLIC_OPENCLAW_WS` environment variable in Vercel to point to your production OpenClaw Gateway WebSocket URL (if different from localhost).

## Continuous Deployment

Once connected to GitHub, Vercel will automatically deploy:
- **Production**: Every push to `main` branch
- **Preview**: Every pull request

## Environment Variables

### Required
- `POSTGRES_URL`: Neon Postgres connection string

### Optional
- `NEXT_PUBLIC_OPENCLAW_WS`: OpenClaw Gateway WebSocket URL (default: ws://localhost:18789)

## Troubleshooting

### Database Connection Issues
- Verify your `POSTGRES_URL` is correct
- Check that Neon database is active
- Run `/api/init` after any schema changes

### Chat Not Connecting
- Check `NEXT_PUBLIC_OPENCLAW_WS` is set correctly
- Ensure OpenClaw Gateway is running and accessible
- Check browser console for WebSocket errors

### Build Failures
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure TypeScript compiles locally: `npm run build`

## API Access

To use the REST API:

1. Create an API token (you'll need to add a UI for this, or use the database directly)
2. Use the token in your requests:
   ```bash
   curl -H "Authorization: Bearer scribe_..." https://your-app.vercel.app/api/drafts
   ```

## Monitoring

- **Vercel Dashboard**: View deployment status, logs, and analytics
- **Neon Dashboard**: Monitor database usage and performance
- **API Docs**: Access at `https://your-app.vercel.app/api/docs`
