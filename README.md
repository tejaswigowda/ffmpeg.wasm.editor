# ffmpeg.wasm Editor

A browser-based video editor powered by [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm). **No uploads, no servers -- all processing happens locally** in your browser using WebAssembly.

---

## Use Cases

### 🎞 GIF Maker
Convert any video clip into an animated GIF. Set the frame rate and output width; height scales automatically to preserve the aspect ratio. Uses a two-pass palette generation for the best possible colour quality.

### 🔄 Video Format Converter
Re-encode a video to a different container and codec:
- **MP4** -- H.264 + AAC, widest compatibility
- **WebM** -- VP9 + Opus, open format optimised for the web (~45% smaller than MP4 at similar quality)
- **MKV / MOV** -- H.264 + AAC in alternative containers
- **AVI** -- legacy compatibility

### 🗜 Video Compression
Reduce file size without changing the resolution. Dial in the quality with a **CRF slider** (18 = near-lossless → 51 = maximum compression) and pick an encoding **preset** (ultrafast → veryslow) to trade encoding speed for compression efficiency. A live size estimate updates as you adjust the settings.

### ✂️ Video Trimming
Set a start and end point with the timeline sliders before running any operation. Trimming is applied on top of every other operation, so you can, for example, extract a short clip, compress it, and convert it to GIF all at once.

### 📐 Resize & Compress
Change the output dimensions and compress in one pass. Width and height are auto-filled from the source video; edit either value or leave it blank to let ffmpeg maintain the aspect ratio. Combines a `scale` filter with CRF-based H.264 encoding.

### 🎵 Audio Extraction
Pull the audio track out of any video into a standalone audio file:
- **MP3** -- universal playback
- **AAC** -- efficient lossy, great for mobile
- **WAV** -- uncompressed PCM
- **OGG Vorbis** -- open lossy format
- **FLAC** -- lossless compression

### 🔇 Mute Video
Strip the audio stream entirely. Output is the original video with no audio track -- useful for silent loops, social media clips, or before replacing the audio elsewhere.

### ⚡ Speed Change
Speed up or slow down playback (0.25× – 4×). Both the video PTS and the `atempo` audio filter chain are adjusted so audio pitch and sync are preserved. Chains multiple `atempo` stages automatically when the multiplier is outside the 0.5–2.0 range that a single filter accepts.

### 🔄 Rotate / Flip
Correct orientation or create mirror effects without re-uploading. Options: 90° clockwise, 90° counter-clockwise, 180°, flip horizontal, flip vertical, or flip both axes.

### ✂️ Crop
Trim the frame to a specific region. X/Y offset and width/height are auto-filled from the source video dimensions so you can immediately drag values down rather than starting from scratch.

### 🖼 Thumbnail Extractor
Pull a single frame from any point in the video and save it as a **JPEG** or **PNG** image. The timestamp field is pre-filled to the midpoint of the loaded clip.

### ⏪ Reverse
Play the video (and audio) backwards using ffmpeg's `reverse` + `areverse` filters.

### 🌅 Fade In / Out
Add a smooth fade-in, fade-out, or both. Set the duration in seconds for each direction independently; the filter is applied after any trim.

### 🎨 Adjust (Brightness / Contrast / Saturation)
Fine-tune the look of a clip with the `eq` filter. Three sliders control brightness (−1 → 1), contrast (0 → 2), and saturation (0 → 3). A **Grayscale** checkbox pins saturation to zero for instant black-and-white output.

### 🚫 Strip Metadata
Remove all embedded metadata -- GPS coordinates, camera make/model, creation timestamps, and any other tags -- before sharing a file. Uses `-map_metadata -1` during re-encoding.

---

## How It Works

1. Click **Load ffmpeg** -- downloads the ffmpeg-core WebAssembly binary (~31 MB, cached after first load).
2. Drop or select a video file.
3. Optionally set trim points with the timeline sliders.
4. Pick an operation and adjust its settings. A **live size estimate** updates as you change parameters.
5. Click **Process Video** -- ffmpeg runs entirely in a Web Worker inside your browser.
6. Preview the result (video, audio player, or image depending on the operation) and download it.

All file I/O stays on your machine. Nothing is sent to any server.

---

## Running Locally

```bash
git clone https://github.com/tejaswigowda/ffmpeg.wasm.editor.
cd ffmpeg.wasm.editor
node server.js          # serves docs/ with the required COOP/COEP headers
```

The server sets `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`, which are required for `SharedArrayBuffer` (used by ffmpeg.wasm).

Or serve the `docs/` folder with any static server that sets those two headers.
