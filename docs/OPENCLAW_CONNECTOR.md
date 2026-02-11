# Compose (Scribe) → OpenClaw Connector Design

Last updated: 2025-02-11

## Problem

Compose's chat sidebar was removed because it required exposing the OpenClaw Gateway publicly via Tailscale Funnel. We need chat to work like first-class OpenClaw channels (Telegram, Slack, Discord) — with proper session management, security, and message routing — without exposing the Gateway to the internet.

## 1. Architecture Overview

### How OpenClaw Channels Work

OpenClaw has a plugin-based channel system. Each channel (Telegram, Slack, etc.) implements a `ChannelPlugin` interface (see `plugin-sdk/channels/plugins/types.plugin.d.ts`) with adapters for:

- **Config** — account discovery and resolution
- **Gateway** — starting/stopping the channel's listener within the Gateway process
- **Outbound** — sending messages back to the channel
- **Security** — DM policies, allowlists
- **Session** — mapping inbound messages to OpenClaw sessions

The Gateway is a single long-running process (`openclaw gateway`) that owns all channel connections and the agent runtime. It exposes a WebSocket on loopback (default `:18789`) with a JSON-RPC-like protocol.

### Where Compose Fits

There are **two viable architectures**:

#### Option A: WebSocket Client (Recommended)

Compose's backend connects to the OpenClaw Gateway WebSocket as a client — the same way the macOS WebChat UI works. It uses `chat.send`, `chat.history`, and listens for `agent`/`chat` events.

```
┌─────────────┐     HTTPS      ┌──────────────────┐    WS (loopback/tailnet)    ┌─────────────┐
│  Compose UI  │ ◄──────────► │  Compose Backend   │ ◄──────────────────────►   │  OpenClaw    │
│  (browser)   │    WebSocket  │  (Next.js API)     │    Gateway WS protocol     │  Gateway     │
└─────────────┘               └──────────────────┘                              └─────────────┘
```

**Pros:** No public Gateway exposure. Compose backend mediates. Uses existing WebChat protocol.
**Cons:** Compose backend must maintain a persistent WS connection to Gateway.

#### Option B: Custom Channel Plugin

Register Compose as a new OpenClaw channel plugin (`compose`). The Gateway calls out to Compose's webhook when there's a reply, and Compose POSTs inbound messages to the Gateway's HTTP API.

```
┌─────────────┐     HTTPS      ┌──────────────────┐    HTTP webhook (both dirs)  ┌─────────────┐
│  Compose UI  │ ◄──────────► │  Compose Backend   │ ◄──────────────────────►    │  OpenClaw    │
│  (browser)   │               │                    │                             │  Gateway     │
└─────────────┘               └──────────────────┘                              └─────────────┘
```

**Pros:** Full channel semantics (reactions, sessions, heartbeat). Richer integration.
**Cons:** Requires writing an OpenClaw plugin. Gateway still needs to reach Compose (webhook).

### Recommendation: Option A (WebSocket Client)

Start with Option A. It's simpler, uses existing Gateway protocol, and keeps the Gateway on loopback. The Compose backend acts as a bridge — no new OpenClaw plugin code needed.

## 2. Authentication Flow

### Gateway Authentication

The Gateway requires auth on every WS connection (`gateway.auth.token` or `gateway.auth.password`). Compose's backend stores this token as a server-side secret (env var).

```
OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789    # or tailnet address
OPENCLAW_GATEWAY_TOKEN=<token>
```

### Compose User Authentication

Compose already has its own user auth. The flow:

1. User authenticates with Compose (existing auth system)
2. User opens chat sidebar → Compose UI opens a WebSocket to Compose backend
3. Compose backend relays to OpenClaw Gateway using the shared token
4. **All Gateway auth is server-side** — users never see or need the Gateway token

### Connection Handshake

Compose backend connects to Gateway with the standard `connect` frame:

```json
{
  "type": "req",
  "id": "1",
  "method": "connect",
  "params": {
    "minProtocol": 1,
    "maxProtocol": 1,
    "client": {
      "id": "compose",
      "displayName": "Compose",
      "version": "1.0.0",
      "platform": "web",
      "mode": "client"
    },
    "auth": { "token": "<OPENCLAW_GATEWAY_TOKEN>" }
  }
}
```

## 3. Message Routing

### Inbound (User → Agent)

1. User types in Compose chat sidebar
2. Compose UI sends message via its own WebSocket to Compose backend
3. Compose backend calls Gateway `chat.send` (or `agent` method) with:
   - Session key derived from user + document context
   - Message text
   - Optional document context (current article content, cursor position)
4. Gateway runs the agent, streams `agent` events back
5. Compose backend relays streamed responses to the Compose UI

### Outbound (Agent → User)

1. Gateway emits `agent` events with streamed output
2. Compose backend receives events on its WS connection
3. Backend routes to the correct Compose UI WebSocket based on session key
4. UI renders the streamed response

### Document Context Injection

The key differentiator from plain chat: Compose can inject document context into each message. Use `chat.inject` or prepend context to the `agent` request:

```json
{
  "method": "agent",
  "params": {
    "message": "Help me improve this paragraph",
    "sessionKey": "compose:doc:abc123:user:vlad",
    "context": {
      "documentId": "abc123",
      "selection": "The quick brown fox...",
      "cursorPosition": 42
    }
  }
}
```

The agent's system prompt can be configured to understand Compose context (article title, content, collaborators).

## 4. Session Management

### Session Key Structure

```
compose:<chatType>:<scopeId>:<userId>
```

Examples:
- `compose:doc:abc123:vlad` — Vlad chatting about document abc123
- `compose:global:vlad` — Vlad's general chat (no document context)
- `compose:doc:abc123:shared` — Shared chat for all collaborators on doc abc123

### Session Persistence

OpenClaw sessions are stored in the Gateway's state dir (`~/.openclaw/state/sessions/`). The `recordInboundSession` function (from `plugin-sdk/channels/session.d.ts`) handles:

- Creating sessions on first message
- Recording `lastChannel` for reply routing
- Group key resolution for shared document chats

### Multiple Connections

Compose backend maintains a **single** WS connection to the Gateway (or a small pool). It multiplexes all user sessions over this connection using session keys. This avoids per-user Gateway connections.

### Connection Lifecycle

```
Compose Backend                          OpenClaw Gateway
     │                                        │
     ├──── connect (auth) ──────────────────►│
     │◄─── hello-ok (snapshot) ──────────────┤
     │                                        │
     │  [user sends message]                  │
     ├──── agent (sessionKey, message) ─────►│
     │◄─── res (accepted, runId) ────────────┤
     │◄─── event:agent (streaming) ──────────┤
     │◄─── event:agent (streaming) ──────────┤
     │◄─── res (final, runId) ───────────────┤
     │                                        │
     │  [keepalive]                           │
     │◄─── event:tick ───────────────────────┤
```

## 5. Implementation Steps

### Phase 1: Basic Chat (MVP)
1. **Gateway WS client module** — Compose backend connects to OpenClaw Gateway, handles connect/reconnect/auth
2. **Chat API route** — `POST /api/chat/send` accepts message + session context, relays to Gateway
3. **Chat WebSocket endpoint** — Compose UI connects to backend, receives streamed responses
4. **Chat sidebar UI** — Restore the removed sidebar, connect to new backend API
5. **Session routing** — Map Compose user+document to OpenClaw session keys

### Phase 2: Document-Aware Chat
6. **Context injection** — Send current document state with each message
7. **Agent prompt tuning** — Configure OpenClaw agent to understand Compose/article context
8. **Inline suggestions** — Agent can suggest edits that apply to the document

### Phase 3: Collaboration Features
9. **Shared document chat** — Multiple collaborators in one session
10. **Chat history persistence** — Show history when reopening sidebar
11. **Typing indicators** — Relay Gateway streaming state to show "agent is typing"

### Phase 4: Polish
12. **Reconnection handling** — Auto-reconnect on Gateway restart (`shutdown` event)
13. **Error states** — Graceful degradation when Gateway is unreachable
14. **Rate limiting** — Prevent abuse from the Compose side

## 6. Security Considerations

### No Public Gateway Exposure

The core security win: the Gateway stays on loopback (or tailnet). Only the Compose backend connects to it. This eliminates the Tailscale Funnel attack surface.

```
Internet → Compose (HTTPS, Vercel) → Compose Backend → [private network] → OpenClaw Gateway
```

### Token Security

- Gateway token stored as server-side env var only (`OPENCLAW_GATEWAY_TOKEN`)
- Never exposed to browser/client
- Rotate via `openclaw.json` → `gateway.auth.token`

### User Authorization

- Compose backend must verify the user is authenticated before relaying to Gateway
- Per-document authorization: only collaborators on a document can chat in its context
- Rate limiting per user to prevent token abuse

### Network Architecture Options

| Setup | Gateway Reachable From | Security |
|-------|----------------------|----------|
| **Same host** | `ws://127.0.0.1:18789` | Best — loopback only |
| **Tailscale** | `ws://gateway.tailnet:18789` | Good — encrypted tailnet |
| **SSH tunnel** | `ws://127.0.0.1:18789` via tunnel | Good — encrypted tunnel |
| ~~Tailscale Funnel~~ | ~~Public internet~~ | ~~Bad — what we're avoiding~~ |

### Input Sanitization

- Strip/escape any prompt injection attempts from document content before sending to agent
- Limit document context size (don't send entire 50-page articles)
- Validate session keys server-side

### Session Isolation

- Each user+document combination gets its own session
- Users cannot access other users' chat history
- Shared document chats require document-level authorization

## Appendix: Key OpenClaw References

| Topic | Path |
|-------|------|
| Channel plugin interface | `plugin-sdk/channels/plugins/types.plugin.d.ts` |
| Channel adapters | `plugin-sdk/channels/plugins/types.adapters.d.ts` |
| Session management | `plugin-sdk/channels/session.d.ts` |
| Gateway protocol | `docs/gateway/index.md` |
| WebChat (existing web UI) | `docs/web/webchat.md` |
| Remote access patterns | `docs/gateway/remote.md` |
| Security | `docs/gateway/security/index.md` |
| Gateway WS methods | `connect`, `agent`, `chat.send`, `chat.history`, `chat.inject`, `health` |
| Gateway events | `agent` (streaming), `chat`, `tick`, `shutdown`, `presence` |

## Open Questions

1. **Vercel serverless vs persistent backend?** — Vercel functions can't hold WS connections. If Compose runs on Vercel, we need a separate persistent process (or use HTTP polling + Gateway HTTP API `/v1/chat/completions`).
2. **Shared vs per-user sessions for documents?** — Start with per-user, add shared later.
3. **How much document context per message?** — Need to balance usefulness vs token cost. Consider sending just the current section + outline.
