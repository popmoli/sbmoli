# Photography Portfolio

A minimalist photography portfolio with a Windows 95 art direction twist. Multiple project galleries, AI-generated captions per photo, and a Spotify embed in each lightbox.

## Local development

This site uses `fetch()` to load project data, so it requires a local HTTP server — **opening `index.html` directly as a `file://` URL will not work**.

```bash
npx serve .
# → open http://localhost:3000
```

## Adding projects

Edit `data/projects.json`. Each project needs:

- `id` — URL-safe slug (e.g. `"urban-decay"`)
- `title` — displayed in nav and window title bar
- `description` — shown under the title bar
- `aiPrompt` — instruction sent to Claude to generate captions for this project's photos
- `photos[]` — each photo needs `file`, `alt`, `caption`, `spotifyId`

Photos go in `images/<project-id>/`. Spotify track IDs come from the share URL:
`https://open.spotify.com/track/{TRACK_ID}` → use `TRACK_ID`.

## Generating AI captions

Captions are pre-generated locally and committed in `data/projects.json`.

```bash
# 1. Install script dependencies (one-time)
npm install

# 2. Create .env with your Anthropic API key
echo "ANTHROPIC_API_KEY=sk-..." > .env

# 3. Generate captions (rewrites data/projects.json)
npm run captions

# 4. Commit the updated data file
git add data/projects.json
git commit -m "chore: regenerate captions"
```

Run `npm run captions` again any time you add photos or change a project's `aiPrompt`.

## Deployment

Push to `main` — GitHub Actions deploys to GitHub Pages automatically.

Enable Pages in: **Repository Settings → Pages → Source → GitHub Actions**
