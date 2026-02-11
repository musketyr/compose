# Scribe TODO

## Phase 1: Core Features ✅ DONE
- [x] Next.js 15 setup with TypeScript and Tailwind
- [x] TipTap editor with rich text formatting
- [x] Draft CRUD API endpoints
- [x] Token-based authentication
- [x] Database schema and initialization
- [x] Split view UI (editor + chat sidebar)
- [x] Draft list sidebar
- [x] Export as HTML and Markdown
- [x] Auto-save functionality
- [x] Mobile responsive design

## Phase 2: Chat Integration 🚧 IN PROGRESS
- [x] WebSocket connection to OpenClaw Gateway
- [x] Chat sidebar UI
- [ ] Context-aware chat (send current draft content)
- [ ] Chat commands (/summarize, /improve, /expand)
- [ ] Inline suggestions from chat
- [ ] Chat history persistence

## Phase 3: Enhanced Features 📋 TODO

### Editor Enhancements
- [ ] Table support
- [ ] Emoji picker
- [ ] File upload for images (not just URLs)
- [ ] Drag & drop images
- [ ] Math equations (KaTeX)
- [ ] Mentions (@user)
- [ ] Hashtags
- [ ] Word count display
- [ ] Reading time estimate

### Collaboration
- [ ] Real-time collaborative editing (Yjs/WebRTC)
- [ ] Comments on text selections
- [ ] Change tracking
- [ ] Version history
- [ ] Share draft with read-only link
- [ ] Team workspaces

### AI Features
- [ ] Grammar and style checking
- [ ] AI-powered rewriting
- [ ] Tone adjustment (formal/casual/etc.)
- [ ] SEO optimization suggestions
- [ ] Auto-generate title from content
- [ ] Content ideas generator
- [ ] Fact-checking

### Organization
- [ ] Folders/categories for drafts
- [ ] Tags for drafts
- [ ] Search across drafts
- [ ] Archive drafts
- [ ] Duplicate draft
- [ ] Templates system

### Export & Publishing
- [ ] PDF export
- [ ] Direct publish to Substack
- [ ] Direct publish to Medium
- [ ] Direct publish to Dev.to
- [ ] WordPress integration
- [ ] Ghost CMS integration
- [ ] Custom CSS for HTML export
- [ ] Email draft as newsletter

### User Experience
- [ ] Dark mode
- [ ] Customizable editor theme
- [ ] Keyboard shortcuts panel
- [ ] Command palette (Cmd+K)
- [ ] Focus mode (hide sidebars)
- [ ] Distraction-free writing
- [ ] Writing goals (word count targets)
- [ ] Writing streaks tracker

### API & Integration
- [ ] OpenAPI/Swagger UI at /api/docs
- [ ] Webhooks for draft events
- [ ] GraphQL API
- [ ] Zapier integration
- [ ] Make.com integration
- [ ] Browser extension
- [ ] Mobile apps (React Native)

### Security & Performance
- [ ] Rate limiting
- [ ] OAuth authentication (Google, GitHub)
- [ ] Two-factor authentication
- [ ] Audit logs
- [ ] GDPR compliance tools
- [ ] Data encryption at rest
- [ ] Image optimization
- [ ] CDN for static assets

## Phase 4: Analytics & Insights 📊 FUTURE
- [ ] Writing analytics dashboard
- [ ] Time spent per draft
- [ ] Writing patterns analysis
- [ ] Productivity insights
- [ ] Reading level analysis
- [ ] Sentiment analysis

## Bugs to Fix 🐛
- [ ] None reported yet

## Technical Debt 🔧
- [ ] Add comprehensive test suite (Jest + Playwright)
- [ ] Set up CI/CD pipeline
- [ ] Add logging and monitoring (Sentry)
- [ ] Implement caching strategy
- [ ] Database query optimization
- [ ] Add API documentation generator
- [ ] Set up staging environment

## Documentation 📚
- [x] README.md
- [x] SETUP.md
- [x] OpenAPI specification
- [ ] Video tutorial
- [ ] Blog post announcement
- [ ] API usage examples
- [ ] Deployment guides (AWS, Railway, etc.)
- [ ] Contribution guidelines

## Ideas for Future Consideration 💡
- Voice-to-text dictation
- Offline support (PWA)
- Browser sync across devices
- Desktop app (Tauri)
- AI voice narration of articles
- Translation to multiple languages
- Plagiarism detection
- Readability scoring
- A/B testing for headlines
- Social media preview generator
- Integration with research tools (Zotero, etc.)

## Known Limitations ⚠️
- No collaborative editing yet (single user per draft)
- WebSocket connection required for chat (no fallback)
- No image hosting (URLs only)
- No user management UI (API tokens only)
- No draft versioning
- Limited to Neon Postgres (no other DB support)

## Priority Order
1. ✅ Get MVP working
2. 🚧 Complete chat integration with context
3. Add OpenAPI docs UI
4. Implement user authentication
5. Add collaborative features
6. Build publishing integrations
