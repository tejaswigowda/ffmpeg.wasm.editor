# ffmpeg webCLI

A browser-based video editor powered by [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm). <b><ins>No uploads, no servers -- all processing happens locally</ins></b> in your browser using WebAssembly.

🚀 **Live app:** https://tejaswigowda.com/ffmpeg.wasm.editor/

---

## Key Features

- ✅ **No Server Uploads** — All video processing happens entirely on your device
- ✅ **30+ Video Operations** — GIF creation, format conversion, compression, trimming, effects, filters, and more
- ✅ **Offline-First PWA** — Works completely offline after first use; install as a native app
- ✅ **Screen Wake Lock** — Screen stays active during video processing on any device
- ✅ **Live Previews** — See output size estimates and live settings adjustments
- ✅ **Multi-Format Support** — MP4, WebM, MKV, MOV, AVI, GIF, MP3, AAC, WAV, OGG, FLAC, JPG, PNG
- ✅ **Advanced Features** — Raw ffmpeg command access, subtitle embedding, concatenation, picture-in-picture, audio mixing
- ✅ **Fast & Responsive** — Uses Web Workers for background processing
- ✅ **Privacy First** — Zero data collection; works with your files locally

---

## Use Cases

### 🎞 GIF Maker
Convert any video clip into an animated GIF. Set the frame rate and output width; height scales automatically to preserve the aspect ratio. Uses a two-pass palette generation for the best possible color quality.

<img src='demos/makegif.gif'>

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

<img src='demos/invert.gif'>

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

### 📝 Embed Subtitles
Mux an `.srt`, `.vtt`, or `.ass` subtitle file into the video as a **soft subtitle track** -- toggleable on/off in any media player (VLC, browser, etc.) without re-encoding the picture. Output format choices:
- **MP4** -- subtitle stream encoded as `mov_text`
- **MKV** -- subtitle stream copied natively (preserves ASS/SSA styling)

Video and audio are stream-copied (zero quality loss, near-instant). Hard-burning subtitles into the picture requires a libass-enabled ffmpeg build and is not available in the standard WebAssembly core.

### � Volume
Boost or reduce the audio level of any video. A single slider sets the **volume multiplier** (0 = silence, 1.0 = unchanged, up to 4×). Audio is re-encoded using the `volume` filter; the video stream is stream-copied (no quality loss, no re-encode overhead).

### 🔁 Loop / Repeat
Play the video N times back-to-back in a single output file. Set **Total plays** (2–50); ffmpeg uses `-stream_loop` with stream copy so there is no re-encoding and the output file is proportionally larger. Trim is not applied for this operation.

### 🖼️ Logo / Image Overlay
Stamp a logo, watermark, or any image (PNG with transparency works best) onto every frame. Controls:
- **Image file** — any PNG, JPG, GIF, or WebP
- **Position** — bottom-right, top-left, top-right, bottom-left, or centre
- **Width (% of video)** — scales the logo relative to the video width (default 15%)

Uses the `overlay` filter with a `scale` pre-pass. Video is re-encoded; audio is stream-copied.

### 🎵 Mix Audio (Background Music)
Blend a second audio file into the video as background music. Controls:
- **Music / audio file** — MP3, WAV, OGG, AAC, FLAC, M4A
- **Original audio volume** slider (0–2, default 1.0)
- **Music volume** slider (0–2, default 0.30)

The music track loops automatically via `-stream_loop -1` if it is shorter than the video. Both streams are mixed with the `amix` filter (`duration=first` so output matches the video length). Video is stream-copied.

### 🔗 Concatenate (Join Clips)
Append a second video clip after the loaded file. Uses the `concat` filter with H.264/AAC re-encoding, so clips with different resolutions, frame rates, and codecs are handled automatically. Trim applies to the first clip only; the second clip is taken in full.

### ↔️ Side by Side
Place two video clips next to each other in a single frame:
- **Layout** — Horizontal (left / right using `hstack`) or Vertical (top / bottom using `vstack`)
- **Common dimension** — target height in pixels for horizontal layout, or target width for vertical layout (both clips are scaled to match)
- **Audio** — take from the first clip, the second clip, or output no audio

Re-encodes to H.264/AAC. Useful for comparison videos, reaction videos, and split-screen content. Trim is ignored.

### ⧉ Picture in Picture
Overlay a second video on top of the main clip in a small inset window. Controls:
- **Overlay video** — the smaller video to appear as the inset
- **Position** — corner or centre (same options as Logo Overlay)
- **Width (% of main video)** — controls the inset size (default 30%)

The overlay video loops automatically if it is shorter than the main clip. Trim applies to the main clip. Audio from the main clip is preserved. Both streams are re-encoded to H.264/AAC.

### 📊 Media Info
Displays key metadata extracted from the browser's video element immediately when a file is loaded:
- File name, size, duration, resolution, estimated bitrate, and MIME type

Click **Process Video** to run a **deep scan** (`ffmpeg -hide_banner -i …`) and print full codec, stream, pixel format, and container details to the log panel below.

### 🛠 Raw FFmpeg
Full access to the ffmpeg command line directly in the browser. Type any arguments into the text area; they are inserted after `-i input` and before the output filename. Choose the output file extension and optionally bypass the trim range. A live **full command preview** updates as you type, showing the exact command that will be executed. Quoted values containing spaces are handled correctly.

An **Example Commands** library (collapsible) provides one-click recipes to get started:

| Example | What it does |
|---|---|
| 🔲 Color-bar watermark | Semi-transparent `drawbox` stamp in the bottom-right corner |
| 🎞 Cap framerate to 24 fps | `fps=24` filter + H.264 re-encode |
| 🎨 Convert to grayscale | `format=gray` + H.264 re-encode |
| 🔊 Loudness normalize | `loudnorm` filter, stream-copies video |
| 📦 Lossless remux (copy) | `-c copy` — change container, zero quality loss |
| 📐 Letterbox / pillarbox | Scales to 1920×1080, pads with black bars |
| 🌀 Denoise (hqdn3d) | Temporal + spatial denoising |
| 🔍 Sharpen (unsharp) | `unsharp` mask filter |
| 🎯 Stabilize (deshake) | `deshake` motion stabilization |
| 🌑 Vignette effect | `vignette` filter darkens edges |
| 🔇 Extract audio as WAV | `-vn -acodec pcm_s16le` lossless audio export |
| 🖼 Extract first frame | `-vframes 1` saves a single PNG |
| 🎵 Replace audio track | Strips original audio and muxes in `input2.mp3`; uses `-map 0:v:0 -map 1:a:0 -shortest` |

Clicking a recipe fills in the arguments and extension fields instantly.

> **Second input file** — the Raw FFmpeg panel includes an optional *Choose file* picker. The selected file is written to ffmpeg's virtual filesystem as `input2.<ext>` and can be referenced in your arguments (e.g. `-i input2.mp3`). Required by the *Replace audio track* recipe.

### ⬛ Pad / Letterbox
Add colored bars to bring a video to a specific aspect ratio without cropping or stretching it. The video is scaled down to fit entirely inside the target canvas; empty space is filled with the chosen pad color.

| Target Ratio | Typical use |
|---|---|
| 16:9 | YouTube, TV, most monitors |
| 9:16 | Instagram / TikTok Reels, Stories |
| 1:1 | Instagram square feed |
| 4:3 | Classic TV / legacy formats |
| 4:5 | Instagram portrait feed |
| 21:9 | Cinematic / ultrawide |

Pad colors: **Black**, **White**, **Gray**. Re-encodes to H.264/AAC.

### 📊 Normalize Audio
Bring the perceived loudness of a clip to a broadcast-standard target using ffmpeg's `loudnorm` (EBU R128) filter. Choose a target integrated loudness level:

- **-14 LUFS** — YouTube / Spotify recommended level
- **-16 LUFS** — Podcasts / Apple Podcasts
- **-23 LUFS** — Broadcast standard (EBU R128)

The video stream is stream-copied (no re-encode); only the audio is processed.

### 🌀 Denoise
Reduce video noise with the `hqdn3d` (high-quality 3D denoise) filter, which combines spatial and temporal noise reduction. Three presets:

| Strength | Parameters | Best for |
|---|---|---|
| Light | `2:2:3:3` | Mild grain, HDR content |
| Medium | `4:4:6:6` | Standard noise removal |
| Heavy | `10:10:15:15` | Heavy noise / low-light footage |

Re-encodes video with H.264; audio is stream-copied.

### ↩️ Boomerang
Creates the classic boomerang loop effect: the clip plays **forward then immediately in reverse** in a single output file. Uses ffmpeg's `reverse` filter concatenated with the original via the `concat` filter. Trim is respected for the forward segment. Audio is removed (the reverse of audio rarely sounds intentional).

### 🔍 Sharpen / Blur
Apply a sharpening or blur effect to the entire video.

- **Sharpen** uses the `unsharp` mask filter (luma + chroma):
  - Light: `unsharp=3:3:0.8:3:3:0`
  - Medium: `unsharp=5:5:1.5:5:5:0`
  - Heavy: `unsharp=7:7:3:7:7:0`
- **Blur** uses the `boxblur` filter:
  - Light: `boxblur=3:1`
  - Medium: `boxblur=6:1`
  - Heavy: `boxblur=12:1`

Video is re-encoded to H.264; audio is stream-copied.

---

## How It Works

**Local Processing:**
1. Click **Load ffmpeg** -- downloads the ffmpeg-core WebAssembly binary (~31 MB, cached after first load).
2. Drop or select a video file. The **Process Video** button activates; if ffmpeg is not yet loaded it reads **Load ffmpeg & Process** and will download it automatically on first click.
3. Optionally set trim points with the timeline sliders.
4. Pick an operation and adjust its settings. A **live size estimate** updates as you change parameters.
5. Click **Process Video** -- ffmpeg runs entirely in a Web Worker inside your browser.
6. Preview the result (video, audio player, or image depending on the operation) and download it.

All file I/O stays on your machine. Nothing is sent to any server.

**Performance & Reliability:**
- Video processing runs in background workers — the UI stays responsive
- Screen automatically stays active during long encoding operations
- Service worker caches all static assets and CDN resources for instant offline access
- Failed operations automatically clean up virtual filesystem

---

## 📱 Progressive Web App (PWA)

The editor works **completely offline** with intelligent caching and screen wake lock support:

### Features
- **🔌 Install as App** — Use the browser's native install button to add the app to your home screen or app drawer. Works on desktop and mobile.
- **📦 Offline Support** — Once ffmpeg is loaded and cached, all processing works without an internet connection.
- **⚡ Smart Caching**
  - Static assets (HTML, CSS, JS) are cached on first load
  - ffmpeg.wasm library and dependencies are cached from CDN for offline use
  - Service worker intercepts requests and serves from cache when network is unavailable
- **📱 Screen Wake Lock** — The screen automatically stays on during video processing. Prevents device sleep or lock on mobile and desktop during encoding.
- **🌐 Works Everywhere**
  - Chrome, Edge, Firefox, Safari on desktop
  - Chrome, Firefox, Samsung Internet on Android
  - Safari on iOS (iOS PWA support is limited but available)

### How to Use as PWA
1. **Web browser:** Visit the app at https://tejaswigowda.com/ffmpeg.wasm.editor/
2. **Install:** Click the install button in your browser's address bar or menu → confirm installation
3. **Use offline:** Load ffmpeg once online, then work offline without internet connection
4. **Screen stays active:** Processing automatically keeps your screen on to prevent interruptions

---

## Running Locally

```bash
git clone https://github.com/tejaswigowda/ffmpeg.wasm.editor.
cd ffmpeg.wasm.editor
node server.js          # serves docs/ with the required COOP/COEP headers
```

The server sets `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`, which are required for `SharedArrayBuffer` (used by ffmpeg.wasm).

Or serve the `docs/` folder with any static server that sets those two headers:

```bash
# Alternative: using npx serve
npx serve docs
```

---

## License

This project is licensed under the **GNU General Public License v3.0** (GPL-3.0). See the [LICENSE](LICENSE) file for full details.
