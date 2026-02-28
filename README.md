# ConvoPool

A Chrome extension that lets users voluntarily share their LLM conversations with a public HuggingFace dataset for AI safety research.

## Architecture

- **extension/** — Chrome extension (Manifest V3, TypeScript, webpack)
- **backend/** — Bun + Hono API server, deployed on HuggingFace Spaces

## Backend Setup

```bash
cd backend
bun install
```

Set environment variables:
```
HF_TOKEN=hf_...           # HuggingFace write token
HF_REPO_ID=user/dataset   # Target dataset repo
API_KEY=your-secret-key    # Shared secret for extension auth
```

Run:
```bash
bun run dev
```

Test:
```bash
curl -X POST http://localhost:7860/conversations \
  -H "X-API-Key: your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"conversation_id":"test-1","platform":"chatgpt","turns":[{"role":"user","content":"hello"},{"role":"assistant","content":"hi"}],"captured_at":"2026-02-27T10:00:00Z","extension_version":"0.1.0"}'
```

## Extension Setup

```bash
cd extension
bun install   # or npm install
bun run build
```

Then load `extension/dist/` as an unpacked extension in Chrome (`chrome://extensions` > Developer mode > Load unpacked).

## Deployment

The backend deploys as a Docker Space on HuggingFace:

1. Create a new HF Space (Docker SDK)
2. Set secrets: `HF_TOKEN`, `HF_REPO_ID`, `API_KEY`
3. Push the `backend/` directory

Update `extension/src/background.ts` with your Space URL and API key before building the extension.
