# CLAUDE.md — Photography Portfolio

This is a **static photography portfolio** deployed to GitHub Pages. No build step, no framework. Everything runs in the browser directly from flat files.

---

## Stack & file map

```
index.html          — Shell only. All DOM is injected by main.js at runtime.
style.css           — All layout + design tokens. Loaded after win95.css.
win95.css           — Reusable Win95 chrome components (.w95-window, .w95-titlebar, etc.)
main.js             — Entry point. Fetches data/projects.json, renders every section.
corner-gif.js       — Canvas animation module. Exported as initCornerGif(), called from main.js.
data/projects.json  — Single source of truth for all content.
scripts/generate-captions.js — Node.js script (local only, never deployed). Calls Claude API.
images/<project-id>/<filename>.jpg — Photos. Filenames must match data/projects.json exactly.
```

---

## Data model — `data/projects.json`

Every content change starts here. Structure:

```json
[
  {
    "id": "project-slug",
    "title": "Display Title",
    "description": "One sentence shown under the Win95 title bar.",
    "aiPrompt": "Instruction sent to Claude to generate captions. One prompt per project.",
    "photos": [
      {
        "file": "project-slug/filename.jpg",
        "alt": "Short description",
        "caption": "AI-generated 2-sentence caption. Pre-generated, committed.",
        "spotifyId": "SPOTIFY_TRACK_ID"
      }
    ]
  }
]
```

**Rules:**
- `id` must be URL-safe (lowercase, hyphens). It doubles as the image subfolder name.
- `file` paths are relative to the `images/` directory.
- `caption` fields are pre-generated locally via `npm run captions` and committed. They are **not** generated at runtime.
- `spotifyId` is the track ID only — not the full URL. Embed URL is built in `main.js` as `https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`.
- Project order in the array = display order on the page.

---

## Rendering pattern

`main.js` fetches the JSON once on `DOMContentLoaded` and passes the array to every render function. **All HTML is injected via `innerHTML`** — `index.html` contains only empty shell elements.

Shell elements in `index.html`: `#nav`, `#projects`, `#about`, `#contact`, `#footer`, `#lightbox` (lightbox HTML is static in `index.html` because it needs to exist before `initLightbox()` queries it).

**Bootstrap sequence in `init()` — order matters:**
```js
renderNav(projects)
renderProjects(projects)
renderAbout()
renderContact()
renderFooter()
initLightbox(projects)
initCornerGif()
```

New render functions follow the same pattern: accept `projects` if they need data, inject into a dedicated shell element, call from `init()`.

---

## Win95 component system (`win95.css`)

Reusable CSS classes. Use these for all new UI sections — never invent new chrome styles.

| Class | Purpose |
|---|---|
| `.w95-window` | Outer container. Raised bevel border. |
| `.w95-titlebar` | Title bar. Gradient from `--window-accent` to `--w95-titlebar-to`. |
| `.w95-titlebar-title` | Title text. Uses `var(--sys-font)` (VT323). |
| `.w95-titlebar-controls` | Right-aligned button group. |
| `.w95-btn` | Button. Raised bevel, collapses to sunken on `:active`. |
| `.w95-window-body` | Content area. Sunken bevel, `margin: 6px`. |
| `.w95-statusbar` | Bottom bar. Contains `.w95-statusbar-pane` children. |
| `.w95-statusbar-pane` | Individual status bar cell. Sunken bevel, `flex: 1`. |

**Accent color injection:** Pass `style="--window-accent: #FF2D78aa"` on `.w95-window` to tint the title bar gradient. Used per-project in `renderProjects()`.

**Bevel system** (defined in `style.css :root`):
- `--bevel-raised` — Use on buttons and window frames.
- `--bevel-sunken` — Use on content areas and input-like elements.
- Bevel thickness: 4px (2px inner + 2px outer). Do not reduce — it is intentional.

---

## Design tokens (`style.css :root`)

```css
/* Typography */
--sys-font:  'VT323', monospace;          /* Win95 chrome, status bars, labels */
--head-font: 'Anton', sans-serif;         /* Project titles, nav, contact email */
--body-font: 'Space Grotesk', sans-serif; /* Body text, captions */

/* Accent palette — assigned to projects in order */
--accent-0: #FF2D78;   /* hot pink */
--accent-1: #FFE600;   /* electric yellow */
--accent-2: #00E5FF;   /* cyan */
--accent-3: #B4FF3C;   /* acid green */
--accent-4: #FF6B00;   /* orange */
```

Accents are assigned per-project index via the `ACCENTS` array in `main.js`. The `nth-child` nav hover rules in `style.css` are coupled to this order — if you add a 5th project, add a 5th accent to both places.

**Left spine:** `body::after` — a 3px animated gradient line fixed to the left edge. Design signature; do not remove.

**Grain texture:** `body::before` — SVG fractal noise at 5.5% opacity, `z-index: 9999`. Sits above everything. This is intentional.

**Body padding:** `padding-left: var(--spine-pad)` (28px) offsets all content from the spine. `#nav` and `#footer .footer-bar` use `left: var(--spine-w)` (3px) to align flush with the spine edge.

---

## Gallery layout rules

- **First photo** in each project spans full width (`grid-column: 1 / -1`), aspect ratio `21/8`. Put the strongest image at index 0.
- Remaining photos: 3-column grid, `4/3` aspect ratio.
- `object-fit: cover` on all images. Brightness `0.82` at rest, `1.0` on hover.
- Missing images: `onerror` handler adds `.gallery-item-placeholder` and hides the `<img>`.

---

## Lightbox

- Navigation is **global across all projects** — arrows move through every photo in `allItems[]` order.
- Spotify iframe `src` is only updated when the track ID changes (avoids reloading mid-play).
- On close, `lbSpotify.src = ''` stops playback.
- Title bar tint (`--window-accent`) updates to the current project's accent on every open.
- Keyboard: `Escape` = close, `←` = prev, `→` = next.

---

## Adding a new project

1. Create `images/<new-id>/` and add photos.
2. Add the project object to `data/projects.json` (order = display order).
3. Add a Spotify track ID for each photo (from `open.spotify.com/track/{ID}`).
4. Run `npm run captions` to generate AI captions (requires `ANTHROPIC_API_KEY` in `.env`).
5. Commit `data/projects.json` and the images.
6. Push to `main` — GitHub Actions deploys automatically.

If the new project is the 5th or beyond, add a new hex value to `ACCENTS` in `main.js` and a matching `:nth-child` nav hover rule in `style.css`.

---

## Adding a new JS feature (module pattern)

`corner-gif.js` is the reference:

```js
// new-feature.js
export function initNewFeature() {
  // self-contained, no globals
}

// main.js
import { initNewFeature } from './new-feature.js';
// call at the end of init()
initNewFeature();
```

Add DOM hook to `index.html`, styles to `style.css` (or a new `feature.css`). Features are disabled by simply not calling `initNewFeature()`.

---

## Local development

Requires a local HTTP server — `fetch('./data/projects.json')` fails on `file://` URLs.

```bash
npm run serve    # → npx serve . on http://localhost:3000
```

`node_modules/` and `.env` are gitignored. `npm install` is only needed to run the caption script.

---

## Deployment

- **Branch:** `main` → auto-deploys via `.github/workflows/deploy.yml`.
- **Pages source:** GitHub Actions (not a branch). Enabled in repo Settings → Pages.
- **Feature branches:** develop on `feature/xxx`, merge to `main` to deploy.
- **Images are committed** to the repo directly. Keep photos under ~2MB each.
- Live URL: `https://popmoli.github.io/sbmoli/`
- GitHub repo: `https://github.com/popmoli/sbmoli`

---

## Caption generation

```bash
npm install                             # one-time
echo "ANTHROPIC_API_KEY=sk-..." > .env  # one-time

npm run captions   # rewrites data/projects.json in place

git add data/projects.json && git commit -m "chore: regenerate captions"
```

- Model: `claude-opus-4-6`. One API call per project.
- Each call returns a JSON array of strings (one 2-sentence caption per photo).
- Script throws on JSON parse failure — never silently writes empty captions.
- Re-run when: new photos added, `aiPrompt` changes, or captions need refreshing.

---

## What not to do

- Do not add a build step or bundler — zero runtime dependencies is a constraint.
- Do not add a framework. Rendering is template-literal HTML injected into shell elements.
- Do not reduce bevel thickness — the 4px bevel is a visual identity choice.
- Do not remove the left spine (`body::after`) or grain overlay (`body::before`).
- Do not generate captions at runtime — it would expose the API key in the browser.
- Do not open `index.html` directly as `file://` — the fetch call will fail.
