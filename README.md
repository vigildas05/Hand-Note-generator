# Handwriter

Upload a typed or handwritten PDF (or an image / .txt) and get a realistic handwritten copy as a PDF or PNGs.

- 16 handwriting styles, or upload your own font
- Ink colours, pen thickness, 5 paper types, line spacing
- Human touches: wobble, slant, pen pressure, fatigue, crossed-out typos, scribbles, inserted words, ink blots
- Clean, scanned or phone-photo look
- Everything runs in the browser — uploaded files never leave the user's device

## Run it locally

Needs [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build for production

```bash
npm run build      # outputs a static site to dist/
npm run preview    # serve dist/ locally to check it
```

## Settings (.env)

Copy `.env.example` to `.env` and edit. Values are built into the public site, so never put secrets there.

| Variable           | Default      | What it does                         |
| ------------------ | ------------ | ------------------------------------ |
| `VITE_APP_NAME`    | `Handwriter` | Name in the header and browser tab   |
| `VITE_MAX_FILE_MB` | `25`         | Largest upload allowed               |
| `VITE_MAX_PAGES`   | `30`         | Max PDF pages converted              |

## Deploy

It's a static site, so any static host works. Settings for all of them:

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variables:** the `VITE_*` values above (optional)

Vercel, Netlify and Cloudflare Pages all detect Vite automatically when you import the GitHub repo.

## Project layout

```
index.html        page markup
public/           static files copied as-is (favicon)
src/main.js       UI: controls, uploads, downloads
src/writer.js     handwriting engine (layout, jitter, mistakes)
src/paper.js      paper textures and scan/photo looks
src/extract.js    PDF text extraction + OCR
src/typos.js      realistic typos
src/random.js     seeded random helpers
src/config.js     fonts, inks, papers, .env settings
src/styles.css    styles
```
