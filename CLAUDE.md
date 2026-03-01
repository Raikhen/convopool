# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is ConvoPool

A Chrome extension that lets users voluntarily share their AI chat conversations with a public HuggingFace dataset for AI safety research. Two packages in a monorepo: a Chrome extension and a Next.js web app (landing site + API).

## Architecture

```
AI Chat DOM → Content Script → Popup → Background Worker → Next.js API → HuggingFace Dataset
```

- **extension/** — Chrome Manifest V3 extension (TypeScript, Webpack). Platform-specific content scripts extract conversations from ChatGPT, Claude, Grok, and Gemini. Popup handles consent/share UI, background service worker manages uploads with offline retry queue.
- **web/** — Next.js App Router on Vercel. Serves the public landing page (`/`), privacy policy (`/privacy`), and API routes (`/api/health`, `/api/conversations`). API validates requests, enriches payloads with server metadata, appends JSONL to a HuggingFace Hub dataset via `@huggingface/hub`.

## Build & Dev Commands

### Extension
```bash
cd extension
bun install
bun run build    # production build → dist/
bun run dev      # webpack watch mode
```
Load `extension/dist/` as unpacked extension in Chrome.

### Web
```bash
cd web
bun install
bun run dev      # Next.js dev server at localhost:3000
bun run build    # production build
```

## Key Files

**Extension:**
- `extension/src/content.ts` — DOM scraping for ChatGPT conversations
- `extension/src/content-claude.ts` — DOM scraping for Claude conversations
- `extension/src/content-grok.ts` — DOM scraping for Grok conversations
- `extension/src/content-gemini.ts` — DOM scraping for Gemini conversations (handles Shadow DOM)
- `extension/src/background.ts` — Service worker handling API uploads + retry queue (max 100)
- `extension/src/popup.ts` — Two-view UI flow: consent → share, detects platform from tab URL
- `extension/src/types.ts` — Shared `Message`, `ExtractedConversation`, `ConversationPayload` interfaces

**Web:**
- `web/src/app/page.tsx` — Landing page (hero, how it works, supported platforms, privacy callout)
- `web/src/app/privacy/page.tsx` — Privacy policy (required for Chrome Web Store)
- `web/src/app/api/conversations/route.ts` — `POST /api/conversations` (validation + HuggingFace upload)
- `web/src/app/api/health/route.ts` — `GET /api/health`
- `web/src/lib/storage.ts` — HuggingFace Hub upload (downloads existing `data/train.jsonl`, appends, re-uploads)
- `web/src/lib/config.ts` — Lazy environment variable validation (`HF_TOKEN`, `HF_REPO_ID`, `API_KEY`)
- `web/src/lib/types.ts` — Shared `Message`, `ConversationPayload`, `EnrichedConversation` interfaces

## Environment Variables (web)

- `HF_TOKEN` — HuggingFace write token
- `HF_REPO_ID` — Target dataset repo (e.g., `user/convopool-data`)
- `API_KEY` — (Optional) Reserved for future admin endpoints

## Deployment

The `web/` directory is deployed to Vercel at `convopool.vercel.app`. Set the Vercel project Root Directory to `web/`. Environment variables (`HF_TOKEN`, `HF_REPO_ID`) must be configured in the Vercel dashboard.

## Conventions

- Both packages use TypeScript with strict mode
- Web uses Next.js App Router with Tailwind v4 (teal design palette)
- Extension backend URL is hardcoded in `background.ts` (`BACKEND_URL` constant)
- No test framework is currently configured
- Bun is the package manager (but npm works for the extension)
