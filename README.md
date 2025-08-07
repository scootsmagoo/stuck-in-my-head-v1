# Stuck in My Head — Starter (Next.js + Spotify Lyrics Search + Hum Stub)

A pretty, production-ready starter for your Shazam-but-for-hums app. This version includes:

- **Lyrics mode**: live search against Spotify’s full catalog via the Web API (free).
- **Hum mode**: backend endpoint scaffolded for ACRCloud/AudD or your own model (currently returns a placeholder).
- **UI**: Tailwind CSS + Framer Motion + accessible controls.
- **Privacy**: no audio leaves the browser unless you submit it.

## Quick Start

1. **Install**

```bash
npm i
```

2. **Create `.env.local`**

Copy `.env.example` to `.env.local` and fill in:

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
# Optional if you wire up ACRCloud later:
ACRCLOUD_HOST=
ACRCLOUD_ACCESS_KEY=
ACRCLOUD_ACCESS_SECRET=
```

Get Spotify credentials at https://developer.spotify.com/dashboard

3. **Run**

```bash
npm run dev
```

Visit http://localhost:3000

## Architecture

- `/pages/api/spotify-token.ts` — server-only Client Credentials flow.
- `/pages/api/lyrics-search.ts` — proxy to Spotify Search (type=track).
- `/pages/api/hum-search.ts` — accepts audio (webm/wav), returns placeholder; code comments show how to integrate ACRCloud.
- `/pages/index.tsx` — UI with two tabs: **Hum** and **Lyrics**.

## Notes

- This starter keeps your secrets server-side; the frontend hits your own API routes.
- For humming, you can:
  - Plug in **ACRCloud** / **AudD** in `hum-search.ts` (fastest to Shazam-level accuracy).
  - Or implement your own pitch contour → embedding → FAISS index (longer project).
