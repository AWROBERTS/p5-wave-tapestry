# p5-wave-tapestry

Audio-reactive WEBGL helix with a VHS-ish post FX pass and a dissolve mixer (clean ↔ FX).

This repo intentionally ships **without media assets** so anyone can drop in their own audio/video.

## Requirements

- A modern browser (Chrome / Firefox / Safari)
- A local web server (recommended; required for loading audio/video reliably)

> Browsers generally block autoplay audio. This sketch starts after the audio is loaded **and you click**.

## Run locally

From the project folder, start a server:

### Option A: Python (built-in)

bash python3 -m http.server 8000

Then open:
- `http://localhost:8000`

### Option B: Node (if you already have it)

bash npx serve .


## Add your own assets

Place files at these paths (see also `assets/README.md`):

- `assets/audio/main.wav` — main audible track (required)
- `assets/audio/kick.wav` — kick/bass driver (optional; used for displacement)
- `assets/video/strands.mp4` — helix strand texture (required)
- `assets/video/nodes.mp4` — node sphere texture (optional; falls back to `strands.mp4`)

You can change the paths in `src/config.js` under `CONFIG.assets`.

## Project structure (no build step)

Scripts are loaded directly via `<script>` tags in `index.html`:

- `src/config.js` — tweak knobs + asset paths
- `src/shaders.js` — GLSL strings
- `src/tunnelField.js` — displacement history buffer
- `src/dnaHelix.js` — helix renderer
- `src/scene.js` — audio analysis + breathing + camera + scene draw
- `src/post.js` — VHS pass + dissolve + present
- `sketch.js` — p5 lifecycle + wiring

## Notes

- For 4K output, keep `pixelDensity: 1` unless you specifically want retina supersampling.
- If performance is tight, reduce `CONFIG.canvas.w/h` or lower `CONFIG.dna.nodes`.