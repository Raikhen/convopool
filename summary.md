# ConvoPool — Project Summary

## What this is
A Chrome extension that lets users voluntarily share their ChatGPT conversations with a public HuggingFace dataset for AI safety research. Users install the extension, consent to data collection, and click a button to share individual conversations.

## Architecture
- **extension/** — Chrome extension (Manifest V3, TypeScript, webpack)
- **backend/** — Hono API server deployed as Vercel serverless functions

## Current State
- All code is written and the extension builds cleanly (`cd extension && bun run build`)
- Backend is deploying to Vercel (connected to GitHub repo `Raikhen/convopool`, deploys on push to main)
- Vercel root directory is set to `backend`
- The backend has no build script — Vercel auto-compiles the `api/` directory
- HuggingFace dataset repo `convopool-data` has been created

## File Structure
```
convopool/
├── extension/
│   ├── manifest.json              # Manifest V3, targets chatgpt.com
│   ├── package.json               # devDeps: webpack, ts-loader, copy-webpack-plugin, @types/chrome
│   ├── tsconfig.json
│   ├── webpack.config.js          # 3 entry points: background, content, popup
│   ├── src/
│   │   ├── types.ts               # Message, ConversationPayload, ExtractedConversation
│   │   ├── content.ts             # Extracts conversation from ChatGPT DOM on message
│   │   ├── popup.html / .ts / .css # Consent flow + "Share this conversation" button
│   │   └── background.ts          # POSTs to backend, retry queue in chrome.storage.local
│   ├── icons/                     # Placeholder PNGs (16, 48, 128)
│   └── dist/                      # Built output (load this as unpacked extension)
│
├── backend/
│   ├── package.json               # deps: hono, @huggingface/hub, @types/node
│   ├── tsconfig.json
│   ├── vercel.json                # Rewrites /api/* to /api
│   ├── api/
│   │   └── index.ts               # Vercel entry: Hono app with GET/POST handlers
│   └── src/
│       ├── types.ts               # Message, ConversationPayload, EnrichedConversation
│       ├── config.ts              # Reads HF_TOKEN, HF_REPO_ID, API_KEY from env
│       ├── storage.ts             # uploadConversation() — uploads directly to HF dataset
│       └── routes.ts              # GET /health, POST /conversations (auth + validate + upload)
│
├── .gitignore
├── README.md
└── summary.md                     # This file
```

## Key Design Decisions
- **No buffer/flush**: Originally designed with JSONL buffering for HF Spaces. Refactored to upload each conversation directly to HuggingFace on every request since Vercel is serverless (no persistent disk or setInterval).
- **User-triggered capture**: No MutationObserver. Content script snapshots the DOM when user clicks "Share".
- **Retry queue**: Failed uploads are stored in chrome.storage.local and drained on next successful send.

## TODOs Before It Works End-to-End
1. **Vercel deploy must succeed** — was hitting TS compilation errors, last fix was adding @types/node
2. **Update `extension/src/background.ts`** — replace the two TODO placeholders at the top:
   - `BACKEND_URL` → your Vercel deployment URL (e.g. `https://convopool.vercel.app`)
   - `API_KEY` → same secret set in Vercel env vars
3. **Vercel env vars must be set** (Settings → Environment Variables):
   - `HF_TOKEN` — HuggingFace write token
   - `HF_REPO_ID` — e.g. `Raikhen/convopool-data`
   - `API_KEY` — shared secret (generate with `openssl rand -hex 32`)
4. **Rebuild extension** after updating background.ts: `cd extension && bun run build`
5. **Load extension** in Chrome: `chrome://extensions` → Developer mode → Load unpacked → select `extension/dist`

## Endpoints
- `GET /api/health` → `{ "status": "ok" }`
- `POST /api/conversations` → requires `X-API-Key` header, body is `ConversationPayload`, returns `{ "status": "accepted", "conversation_id": "..." }`

## Test the Backend
```bash
curl -X POST https://YOUR-VERCEL-URL/api/conversations \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"conversation_id":"test-1","platform":"chatgpt","turns":[{"role":"user","content":"hello"},{"role":"assistant","content":"hi"}],"captured_at":"2026-02-28T10:00:00Z","extension_version":"0.1.0"}'
```
