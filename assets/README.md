# Assets

This project does **not** include audio/video files. Add your own media in the folders below.

## Required

### `assets/audio/main.wav`
- The main audible track.
- Recommended: PCM WAV (44.1kHz or 48kHz), stereo OK.

### `assets/video/strands.mp4`
- Video used as the texture for the two helix strands.
- Recommended: H.264 MP4, “fast start” (moov atom at front) if you’re hosting it.

## Optional

### `assets/audio/kick.wav`
- Separate kick/bass driver used for displacement “shockwaves”.
- This can be:
  - a copy of `main.wav`, or
  - a bass-only render, or
  - silence (the sketch still runs; it just won’t kick-react the same way).

### `assets/video/nodes.mp4`
- Video texture for the node spheres.
- If missing/unloadable, the sketch will fall back to using `strands.mp4`.

## Change filenames / paths

Edit `src/config.js`:

- `CONFIG.assets.audioMain`
- `CONFIG.assets.audioKick`
- `CONFIG.assets.videoStrands`
- `CONFIG.assets.videoNodes`