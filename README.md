# ConvoPool

A Chrome extension that lets you voluntarily share your AI chat conversations with a public dataset for AI safety research.

**One click, always opt-in.** No personal data is collected — you choose exactly which conversations to share.

## How It Works

1. **Install** the ConvoPool Chrome extension
2. **Chat** on ChatGPT, Claude, Grok, or Gemini as you normally would
3. **Share** by clicking the extension icon and hitting "Share" — your conversation is appended to the public dataset

Shared conversations go to the [ConvoPool HuggingFace dataset](https://huggingface.co/datasets/Raikhen/convopool-data).

## Project Structure

```
extension/   Chrome Manifest V3 extension (TypeScript, Webpack)
web/         Next.js landing site + API (Vercel)
```

## Development

### Extension

```bash
cd extension
bun install
bun run build    # production build → dist/
bun run dev      # webpack watch mode
```

Load `extension/dist/` as an unpacked extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked).

### Web

```bash
cd web
bun install
bun run dev      # http://localhost:3000
```

Requires `HF_TOKEN` and `HF_REPO_ID` environment variables for the API routes (create a `.env.local` in `web/`).

## Privacy

ConvoPool only collects data when you explicitly click "Share." No cookies, no tracking, no personal identifiers. See the full [Privacy Policy](https://convopool.vercel.app/privacy).

## License

MIT
