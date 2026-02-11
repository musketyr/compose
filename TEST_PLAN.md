# Scribe Test Plan

## Prerequisites
- ✅ Dev server running
- ⏳ DATABASE_URL configured
- ⏳ Database initialized
- ⏳ API token created

## Test Checklist

### 1. Database Setup ⏳
```bash
# Add DATABASE_URL to .env.local
echo 'DATABASE_URL=postgresql://...' >> .env.local

# Initialize database
curl http://localhost:3000/api/init
# Expected: {"success":true,"message":"Database initialized"}

# Create API token
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Token"}'
# Save the returned token
```

### 2. UI Testing

#### Token Authentication
- [ ] Visit http://localhost:3000
- [ ] Paste token in input field
- [ ] Click "Continue"
- [ ] Should see editor interface

#### Editor Functionality
- [ ] Type text in editor
- [ ] Test bold (Ctrl/Cmd+B)
- [ ] Test italic (Ctrl/Cmd+I)
- [ ] Test headings (H1, H2 buttons)
- [ ] Test bullet list
- [ ] Test numbered list
- [ ] Test blockquote
- [ ] Add link (click link button, enter URL)
- [ ] Add image (click image button, enter URL)
- [ ] Add YouTube video (click YouTube button, enter URL)
- [ ] Test undo/redo

#### Draft Management
- [ ] Change draft title
- [ ] Click "Save" button
- [ ] Verify "Saving..." indicator
- [ ] Click "New Draft" button
- [ ] Verify new empty draft loads
- [ ] Switch back to previous draft
- [ ] Verify content persists
- [ ] Delete a draft
- [ ] Confirm deletion dialog works

#### Export
- [ ] Click export button on a draft
- [ ] Select "HTML"
- [ ] Verify .html file downloads
- [ ] Click export button again
- [ ] Select "Markdown"
- [ ] Verify .md file downloads
- [ ] Open exported files and verify content

#### Auto-Save
- [ ] Create new draft
- [ ] Type some content
- [ ] Wait 30 seconds
- [ ] Verify draft saves automatically (check network tab)
- [ ] Refresh page
- [ ] Verify draft persists

#### Chat Sidebar
- [ ] Verify connection status indicator
- [ ] Type message in chat input
- [ ] Click send or press Enter
- [ ] Verify message appears in chat
- [ ] If OpenClaw Gateway is running, verify response

#### Responsive Design
- [ ] Resize browser window
- [ ] Verify sidebars collapse on mobile
- [ ] Test draft list toggle button
- [ ] Verify editor remains usable

### 3. API Testing

#### Token Creation
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"name":"API Test Token"}' | jq -r '.token')

echo "Token: $TOKEN"
```
- [ ] Verify token is returned
- [ ] Verify token is 64 characters (hex)

#### Create Draft
```bash
DRAFT_ID=$(curl -s -X POST http://localhost:3000/api/drafts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Article",
    "content": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {"type": "text", "text": "Hello, world!"}
          ]
        }
      ]
    }
  }' | jq -r '.id')

echo "Draft ID: $DRAFT_ID"
```
- [ ] Verify draft is created
- [ ] Verify UUID is returned
- [ ] Verify status code 201

#### List Drafts
```bash
curl -s http://localhost:3000/api/drafts \
  -H "Authorization: Bearer $TOKEN" | jq
```
- [ ] Verify array of drafts returned
- [ ] Verify created draft is in list
- [ ] Verify drafts are sorted by updated_at DESC

#### Get Draft
```bash
curl -s http://localhost:3000/api/drafts/$DRAFT_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```
- [ ] Verify draft details returned
- [ ] Verify title matches
- [ ] Verify content matches

#### Update Draft
```bash
curl -s -X PUT http://localhost:3000/api/drafts/$DRAFT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "content": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {"type": "text", "text": "Updated content!"}
          ]
        }
      ]
    }
  }' | jq
```
- [ ] Verify draft is updated
- [ ] Verify updated_at changed
- [ ] Verify new content returned

#### Delete Draft
```bash
curl -s -X DELETE http://localhost:3000/api/drafts/$DRAFT_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```
- [ ] Verify {"success":true} returned
- [ ] List drafts again
- [ ] Verify deleted draft is gone

#### Authentication Tests
```bash
# Test without token
curl -s http://localhost:3000/api/drafts | jq
# Expected: {"error":"Unauthorized"}, status 401

# Test with invalid token
curl -s http://localhost:3000/api/drafts \
  -H "Authorization: Bearer invalid_token" | jq
# Expected: {"error":"Invalid token"}, status 401
```
- [ ] Verify 401 without token
- [ ] Verify 401 with invalid token

### 4. Database Verification

```sql
-- Connect to your database and run:

-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
-- Expected: drafts, api_tokens

-- Check draft count
SELECT COUNT(*) FROM drafts;

-- View drafts
SELECT id, title, user_id, created_at, updated_at FROM drafts 
ORDER BY updated_at DESC;

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('drafts', 'api_tokens');
-- Expected: idx_drafts_user_id, idx_drafts_updated_at, etc.

-- Check token count
SELECT COUNT(*) FROM api_tokens;

-- View tokens (without hashes)
SELECT id, user_id, name, created_at FROM api_tokens 
ORDER BY created_at DESC;
```

### 5. WebSocket Testing (Optional)

If OpenClaw Gateway is running:
- [ ] Start OpenClaw Gateway on ws://localhost:18789
- [ ] Open Scribe UI
- [ ] Verify "Connected" status in chat
- [ ] Send a message
- [ ] Verify response appears
- [ ] Stop Gateway
- [ ] Verify "Disconnected" status

### 6. Error Handling

#### API Errors
- [ ] Try to get non-existent draft ID
  - Expected: 404 "Draft not found"
- [ ] Try to update non-existent draft
  - Expected: 404 "Draft not found"
- [ ] Try to delete non-existent draft
  - Expected: 404 "Draft not found"
- [ ] Send malformed JSON
  - Expected: 500 error

#### UI Errors
- [ ] Enter invalid token
- [ ] Verify error message displays
- [ ] Try to save without database
- [ ] Verify error message displays

### 7. Performance Testing

- [ ] Create 10 drafts via API
- [ ] Load draft list in UI
- [ ] Verify load time is reasonable
- [ ] Open and switch between drafts
- [ ] Verify switching is fast
- [ ] Type rapidly in editor
- [ ] Verify no lag

### 8. Mobile Testing

- [ ] Open on mobile device (or browser mobile mode)
- [ ] Verify sidebars are collapsible
- [ ] Test touch interactions
- [ ] Test keyboard on mobile
- [ ] Verify editor toolbar scrolls/wraps

### 9. Export Verification

#### HTML Export
- [ ] Create draft with various formatting
  - Heading, bold, italic, list, link, image
- [ ] Export as HTML
- [ ] Open in browser
- [ ] Verify formatting preserved
- [ ] Check it works on Substack (paste HTML)

#### Markdown Export
- [ ] Export same draft as Markdown
- [ ] Open in text editor
- [ ] Verify Markdown syntax correct
- [ ] Paste into GitHub issue/comment
- [ ] Verify formatting works

### 10. Security Testing

- [ ] Verify tokens are hashed in database (not plain text)
- [ ] Try to access another user's drafts
  - Create token with different user_id
  - Verify drafts are isolated
- [ ] Check for SQL injection
  - Try draft with title: `'; DROP TABLE drafts; --`
  - Verify it's safely stored
- [ ] Check for XSS
  - Try draft with content: `<script>alert('XSS')</script>`
  - Verify it's escaped in UI

## Test Results

Date: __________
Tester: __________

### Summary
- [ ] All UI tests passed
- [ ] All API tests passed
- [ ] Database schema correct
- [ ] Performance acceptable
- [ ] Security checks passed
- [ ] Export functions work
- [ ] Mobile responsive

### Issues Found
1. 
2. 
3. 

### Notes


## Automated Testing (Future)

To add in the future:
- Unit tests with Jest
- Integration tests with Playwright
- API tests with Supertest
- E2E tests with Playwright

See TODO.md for roadmap.
