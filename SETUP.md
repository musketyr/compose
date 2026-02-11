# Scribe Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd /home/ubuntu/clawd/scribe
npm install
```

### 2. Configure Environment

Create `.env.local`:
```bash
DATABASE_URL=your_neon_postgres_url
API_SECRET=$(openssl rand -hex 32)
OPENCLAW_WS_URL=ws://localhost:18789
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Initialize Database
```bash
curl http://localhost:3000/api/init
```

### 5. Create Your First Token
```bash
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"name":"My First Token"}' | jq -r '.token'
```

### 6. Open the App
Visit http://localhost:3000 and paste your token!

## Setting Up Neon Postgres

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string
4. Add to `.env.local` as `DATABASE_URL`

## API Usage Examples

### Create a Draft via API
```bash
TOKEN="your_token_here"

curl -X POST http://localhost:3000/api/drafts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Article",
    "content": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Hello, world!"
            }
          ]
        }
      ]
    }
  }'
```

### List All Drafts
```bash
curl http://localhost:3000/api/drafts \
  -H "Authorization: Bearer $TOKEN"
```

### Get Specific Draft
```bash
curl http://localhost:3000/api/drafts/DRAFT_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Update Draft
```bash
curl -X PUT http://localhost:3000/api/drafts/DRAFT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "content": {...}
  }'
```

### Delete Draft
```bash
curl -X DELETE http://localhost:3000/api/drafts/DRAFT_ID \
  -H "Authorization: Bearer $TOKEN"
```

## Deployment to Vercel

### Prerequisites
- GitHub repository
- Vercel account
- Neon Postgres database

### Steps

1. **Push to GitHub**
```bash
cd /home/ubuntu/clawd/scribe
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. **Deploy to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Configure environment variables:
     - `DATABASE_URL` - Your Neon connection string
     - `API_SECRET` - Random secret (same as local)
     - `NEXT_PUBLIC_OPENCLAW_WS_URL` - WebSocket URL (if using chat)

3. **Initialize Production Database**
```bash
curl https://your-app.vercel.app/api/init
```

4. **Create Production Token**
```bash
curl -X POST https://your-app.vercel.app/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"name":"Production Token"}'
```

## OpenClaw Gateway Integration

The chat sidebar connects to OpenClaw Gateway via WebSocket for AI assistance.

### Local Development
Default: `ws://localhost:18789`

### Production
Set environment variable:
```
NEXT_PUBLIC_OPENCLAW_WS_URL=wss://your-gateway-url.com
```

### Chat Protocol
Messages are sent as JSON:
```json
{
  "message": "Your message text"
}
```

Responses are received as:
```json
{
  "message": "Assistant response",
  "text": "Alternative field"
}
```

## Troubleshooting

### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Check Neon project is active
- Ensure SSL is enabled in connection string

### Token Authentication Fails
- Verify token is saved correctly
- Check API_SECRET matches between environments
- Token must be sent as `Bearer YOUR_TOKEN`

### WebSocket Connection Issues
- Verify OpenClaw Gateway is running
- Check WebSocket URL is correct
- Ensure no firewall blocking WebSocket connections

### Editor Not Loading
- Clear browser cache
- Check browser console for errors
- Verify all TipTap extensions are installed

## Development Tips

### Auto-Save
Drafts auto-save every 30 seconds. Manual save button is also available.

### Keyboard Shortcuts
- `Ctrl/Cmd + B` - Bold
- `Ctrl/Cmd + I` - Italic
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo

### Export Formats
- **HTML** - For Substack and similar platforms
- **Markdown** - For GitHub, Dev.to, etc.

## Security Best Practices

1. **Never commit tokens** - Always use environment variables
2. **Rotate tokens regularly** - Create new tokens periodically
3. **Use HTTPS in production** - Secure your API endpoints
4. **Secure WebSocket** - Use WSS in production

## Advanced Configuration

### Custom User IDs
```bash
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"user_id":"custom_user","name":"Custom Token"}'
```

### Multi-User Setup
- Each user needs their own token
- Drafts are isolated by user_id
- Tokens can share user_id for team collaboration

## Database Maintenance

### Backup Neon Database
Use Neon console to create point-in-time backups.

### View Database Contents
```sql
-- List all drafts
SELECT id, title, user_id, created_at, updated_at FROM drafts ORDER BY updated_at DESC;

-- List all tokens
SELECT id, user_id, name, created_at FROM api_tokens ORDER BY created_at DESC;

-- Count drafts per user
SELECT user_id, COUNT(*) as draft_count FROM drafts GROUP BY user_id;
```

## Support

- **Documentation**: See README.md
- **Database Schema**: See db/schema.sql
- **API Reference**: See README.md API section

## Next Steps

1. Customize the editor toolbar
2. Add more TipTap extensions
3. Implement version history
4. Add collaborative editing
5. Integrate more AI features
