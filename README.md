# ✍️ Scribe

A collaborative article writing app with AI assistance powered by OpenClaw Gateway.

## Features

- **Split View UI**: Rich text editor (left) + Chat with Jean (right)
- **TipTap Editor**: Full formatting support including:
  - Bold, italic, strikethrough, code
  - Headings (H1, H2)
  - Lists (bullet, ordered)
  - Blockquotes
  - Images
  - Links
  - YouTube embeds
  - Code blocks with syntax highlighting
- **Draft Management**: Save, load, and delete drafts with database persistence
- **REST API**: Token-authenticated API with OpenAPI documentation
- **Chat Integration**: Real-time WebSocket connection to OpenClaw Gateway
- **Export Options**: Copy as HTML (for Substack) or Markdown

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Editor**: TipTap (rich text editor)
- **Database**: Neon Postgres (via @vercel/postgres)
- **Icons**: Lucide React
- **Chat**: WebSocket to OpenClaw Gateway

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Neon Postgres database
- OpenClaw Gateway running (for chat features)

### Installation

1. Clone the repository:
```bash
cd /home/ubuntu/clawd/scribe
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your configuration:
- `POSTGRES_URL`: Your Neon Postgres connection string
- `NEXT_PUBLIC_OPENCLAW_WS`: OpenClaw Gateway WebSocket URL (default: ws://localhost:18789)

4. Initialize the database:
```bash
# Start the dev server first
npm run dev

# Then visit http://localhost:3000/api/init to initialize the database
curl http://localhost:3000/api/init
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

### Users
- `id` (UUID, primary key)
- `email` (varchar, unique)
- `name` (varchar)
- `password_hash` (varchar)
- `created_at` (timestamp)

### Drafts
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key)
- `title` (varchar)
- `content` (JSONB) - TipTap JSON format
- `created_at` (timestamp)
- `updated_at` (timestamp)

### API Tokens
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key)
- `name` (varchar)
- `token_hash` (varchar, unique)
- `token_prefix` (varchar)
- `last_used_at` (timestamp)
- `created_at` (timestamp)

## API Documentation

The REST API is documented with OpenAPI 3.0. View the specification at:
```
http://localhost:3000/api/docs
```

### Authentication

All API endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer scribe_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Endpoints

- `GET /api/drafts` - List all drafts
- `POST /api/drafts` - Create a new draft
- `GET /api/drafts/:id` - Get a draft by ID
- `PUT /api/drafts/:id` - Update a draft
- `DELETE /api/drafts/:id` - Delete a draft

## Chat Integration

Scribe connects to the OpenClaw Gateway via WebSocket for real-time AI assistance. The chat:

1. Sends your current editor content as context with each message
2. Receives responses from Jean (OpenClaw agent)
3. Supports "insert at cursor" actions (planned feature)

Make sure OpenClaw Gateway is running at the configured WebSocket URL.

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables:
   - `POSTGRES_URL`
   - `NEXT_PUBLIC_OPENCLAW_WS`
4. Deploy!

After deployment, initialize the database:
```bash
curl https://your-app.vercel.app/api/init
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Project Structure

```
scribe/
├── app/
│   ├── api/
│   │   ├── drafts/
│   │   │   ├── route.ts         # List/create drafts
│   │   │   └── [id]/route.ts    # Get/update/delete draft
│   │   ├── docs/route.ts        # OpenAPI spec
│   │   └── init/route.ts        # Database initialization
│   ├── layout.tsx
│   └── page.tsx                 # Main editor page
├── components/
│   ├── editor.tsx               # TipTap editor component
│   └── chat.tsx                 # Chat component
├── lib/
│   ├── db.ts                    # Database utilities
│   ├── api-auth.ts              # API token authentication
│   └── cn.ts                    # Tailwind class merger
└── public/
```

## TODO

- [ ] User authentication (NextAuth)
- [ ] Collaborative editing (multiple users)
- [ ] Version history
- [ ] Rich export options (PDF, DOCX)
- [ ] "Insert at cursor" action from chat
- [ ] Image upload (instead of URL only)
- [ ] Dark mode
- [ ] Mobile responsive improvements

## License

MIT
