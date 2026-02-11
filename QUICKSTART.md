# ⚡ Scribe Quick Start

## 🚀 Get Running in 5 Minutes

### 1. You Already Have
- ✅ Project created at `/home/ubuntu/clawd/scribe`
- ✅ Dependencies installed
- ✅ Dev server running on http://localhost:3000
- ✅ All code complete and functional

### 2. What You Need
Just a Neon Postgres database URL!

### 3. Get Database URL

**Option A: Create New Neon Database**
1. Go to https://console.neon.tech/
2. Click "Create Project"
3. Name it "scribe"
4. Copy the connection string

**Option B: Use Existing Database**
Just use your existing Neon Postgres connection string.

### 4. Configure Environment

```bash
cd /home/ubuntu/clawd/scribe
nano .env.local
```

Paste your database URL:
```env
DATABASE_URL=postgresql://user:password@host/database
API_SECRET=any_random_string_here
OPENCLAW_WS_URL=ws://localhost:18789
```

Save and exit (Ctrl+X, Y, Enter).

### 5. Initialize Database

```bash
curl http://localhost:3000/api/init
```

Expected response:
```json
{"success":true,"message":"Database initialized"}
```

### 6. Create Your Token

```bash
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"name":"My Token"}'
```

Copy the token from the response!

### 7. Open the App

1. Visit http://localhost:3000
2. Paste your token
3. Click "Continue"
4. Start writing! ✍️

## 🎯 What You Can Do Now

- **Write articles** with rich formatting
- **Save drafts** automatically
- **Chat with AI** in the sidebar
- **Export** as HTML or Markdown
- **Access via API** with your token

## 📖 Next Steps

- Read **README.md** for full features
- See **SETUP.md** for detailed configuration
- Check **DEPLOYMENT.md** to deploy to Vercel
- Review **TODO.md** for future features

## 🆘 Need Help?

All documentation is in the project folder:
```bash
ls /home/ubuntu/clawd/scribe/*.md
```

- `README.md` - User guide
- `SETUP.md` - Setup details
- `DEPLOYMENT.md` - Deploy guide
- `PROJECT.md` - Architecture
- `BUILD_SUMMARY.md` - What was built
- `HANDOFF.md` - Complete report
- `TODO.md` - Roadmap

## 🔥 Quick API Test

Once setup is complete:

```bash
# Save your token
TOKEN="your_token_here"

# Create a draft
curl -X POST http://localhost:3000/api/drafts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello World","content":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"My first article!"}]}]}}'

# List your drafts
curl http://localhost:3000/api/drafts \
  -H "Authorization: Bearer $TOKEN"
```

## ✨ That's It!

You're ready to write. Happy writing! ✍️

---

**Need the full docs?** → Read `README.md`
**Want to deploy?** → Read `DEPLOYMENT.md`
**Curious how it works?** → Read `PROJECT.md`
