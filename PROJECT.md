# Scribe Project Overview

## What is Scribe?

Scribe is a modern, collaborative article writing application that combines a powerful rich-text editor with AI chat assistance. Think of it as a hybrid between Medium's editor and ChatGPT, designed specifically for writers who want both creative freedom and intelligent assistance.

## Key Features

### ✍️ Rich Text Editor
- **TipTap-powered** - Modern, extensible rich text editor
- **Full formatting** - Bold, italic, headings, lists, quotes, code blocks
- **Media support** - Images (via URL), YouTube embeds
- **Syntax highlighting** - Code blocks with lowlight
- **Real-time editing** - Instant visual feedback
- **Undo/Redo** - Full history support

### 💾 Draft Management
- **Auto-save** - Drafts save automatically every 30 seconds
- **Manual save** - Save button for instant persistence
- **List view** - See all your drafts at a glance
- **Quick actions** - Delete and export from the list
- **Database-backed** - Neon Postgres for reliability

### 💬 AI Chat Assistant
- **WebSocket connection** - Real-time chat with OpenClaw Gateway
- **Context-aware** - Can discuss your draft content
- **Writing help** - Get suggestions, improvements, ideas
- **Always available** - Side-by-side with your editor

### 📤 Export Options
- **HTML export** - Perfect for Substack, Medium, etc.
- **Markdown export** - For GitHub, Dev.to, and more
- **One-click download** - Export directly from draft list

### 🔐 Secure API
- **Token authentication** - Simple, secure API access
- **REST endpoints** - Full CRUD for drafts
- **OpenAPI spec** - Complete API documentation
- **Multi-user support** - Isolated drafts per user

### 📱 Responsive Design
- **Mobile-friendly** - Works great on phones and tablets
- **Collapsible sidebars** - Maximize space when needed
- **Touch-optimized** - Smooth interactions on all devices

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **TipTap** - Headless rich text editor
- **Lucide React** - Beautiful icon system

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Neon Postgres** - Serverless PostgreSQL database
- **WebSocket** - Real-time chat integration

### Developer Experience
- **TypeScript** - Full type safety
- **ESLint** - Code quality
- **Turbopack** - Fast development builds
- **Hot reload** - Instant feedback during development

## Architecture

### Database Schema
```sql
-- Drafts table
drafts (
  id UUID PRIMARY KEY,
  title TEXT,
  content JSONB,  -- TipTap JSON format
  user_id TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- API tokens table
api_tokens (
  id UUID PRIMARY KEY,
  token_hash TEXT,  -- SHA-256 hashed
  user_id TEXT,
  name TEXT,
  created_at TIMESTAMPTZ
)
```

### API Structure
```
/api
  /auth/token    → POST: Create API token
  /init          → GET: Initialize database
  /drafts        → GET: List drafts
                 → POST: Create draft
  /drafts/[id]   → GET: Get draft
                 → PUT: Update draft
                 → DELETE: Delete draft
```

### Component Hierarchy
```
App Layout
├── DraftList Sidebar
│   ├── New Draft Button
│   └── Draft Items (with delete/export)
├── Main Editor Area
│   ├── Title Input
│   ├── Save Button
│   └── TipTap Editor
│       └── Formatting Toolbar
└── Chat Sidebar
    ├── Message List
    └── Input Area
```

## File Structure

```
/scribe
├── app/
│   ├── api/
│   │   ├── auth/token/route.ts    # Token generation
│   │   ├── drafts/route.ts        # List/create drafts
│   │   ├── drafts/[id]/route.ts   # Get/update/delete draft
│   │   └── init/route.ts          # DB initialization
│   ├── globals.css                # Global styles + TipTap CSS
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main application page
│
├── components/
│   ├── chat-sidebar.tsx           # WebSocket chat UI
│   ├── draft-list.tsx             # Draft management sidebar
│   └── editor.tsx                 # TipTap editor component
│
├── lib/
│   ├── auth.ts                    # Token auth utilities
│   ├── db.ts                      # Database connection
│   └── utils.ts                   # Helper functions (cn)
│
├── db/
│   └── schema.sql                 # Database schema
│
├── .env.example                   # Environment template
├── .env.local                     # Local environment vars
├── next.config.ts                 # Next.js configuration
├── openapi.yaml                   # API specification
├── package.json                   # Dependencies
├── PROJECT.md                     # This file
├── README.md                      # User documentation
├── SETUP.md                       # Setup guide
├── TODO.md                        # Feature roadmap
└── tsconfig.json                  # TypeScript config
```

## Development Workflow

### Local Development
1. Install dependencies: `npm install`
2. Set up `.env.local` with database URL
3. Start dev server: `npm run dev`
4. Initialize database: `curl localhost:3000/api/init`
5. Create token: `curl -X POST localhost:3000/api/auth/token`
6. Open browser and start writing!

### Deployment
1. Push to GitHub repository
2. Connect to Vercel
3. Configure environment variables
4. Deploy automatically
5. Initialize production database
6. Create production tokens

## Use Cases

### Solo Bloggers
- Write articles with AI assistance
- Save multiple drafts
- Export to your blogging platform
- Keep everything organized

### Content Teams
- Multiple users with separate tokens
- Isolated drafts per team member
- API access for automation
- Export for review/approval

### Developers
- API-first architecture
- Programmatic draft management
- Custom integrations possible
- OpenAPI spec available

### Writers
- Distraction-free interface
- Real-time chat assistance
- Rich formatting options
- Auto-save for peace of mind

## Future Vision

Scribe is designed to evolve into a comprehensive writing platform:

1. **Collaborative editing** - Real-time co-authoring
2. **Publishing integrations** - Direct publish to platforms
3. **Advanced AI** - Grammar checking, style suggestions
4. **Version control** - Track changes and revisions
5. **Templates** - Start from proven structures
6. **Analytics** - Understand your writing patterns
7. **Mobile apps** - Write anywhere, anytime

## Why Scribe?

### For Users
- **Simple** - No complicated setup
- **Powerful** - Professional-grade editor
- **Smart** - AI assistance when you need it
- **Portable** - Export to any format
- **Reliable** - Auto-save and cloud storage

### For Developers
- **Modern stack** - Latest Next.js and React
- **Type-safe** - Full TypeScript coverage
- **API-first** - RESTful with OpenAPI spec
- **Extensible** - Easy to add new features
- **Well-documented** - Clear code and docs

## Getting Help

- **README.md** - User documentation
- **SETUP.md** - Detailed setup guide
- **openapi.yaml** - Complete API reference
- **TODO.md** - Roadmap and planned features
- **Code comments** - Inline explanations

## Contributing

The codebase is structured for easy contributions:

1. **Components** - Self-contained React components
2. **API routes** - Standard Next.js patterns
3. **Type safety** - TypeScript catches errors
4. **Clear structure** - Logical file organization
5. **Documentation** - Every major feature documented

## Technical Highlights

### Performance
- **Turbopack** - Fast development builds
- **Serverless** - Auto-scaling infrastructure
- **Connection pooling** - Efficient database access
- **Optimized queries** - Indexed database columns

### Security
- **Token hashing** - SHA-256 for stored tokens
- **SQL injection prevention** - Parameterized queries
- **XSS protection** - React's built-in escaping
- **HTTPS ready** - Secure by default on Vercel

### Developer Experience
- **Hot reload** - Instant feedback
- **Type checking** - Catch errors early
- **ESLint** - Consistent code style
- **Clear errors** - Helpful error messages

## License

MIT License - Free to use, modify, and distribute.

## Acknowledgments

Built with amazing open-source tools:
- TipTap for the editor
- Next.js for the framework
- Neon for the database
- Tailwind for the styling
- Lucide for the icons

---

**Version**: 0.1.0  
**Status**: MVP Complete  
**Last Updated**: February 2026
