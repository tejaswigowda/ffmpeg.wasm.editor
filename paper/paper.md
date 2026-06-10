---
title: 'ffmpeg-webCLI: A Browser-Based Video Editor Powered by WebAssembly'
tags:
  - WebAssembly
  - FFmpeg
  - video editing
  - privacy
  - Progressive Web App
  - browser
  - command-line
authors:
  - name: Tejaswi Gowda
    orcid: 0000-0002-0896-6526
    affiliation: 1
affiliations:
  - name: Arizona State University
    index: 1
date: 2026-06-09
bibliography: paper.bib
---

# Summary

`ffmpeg-webCLI` is a browser-based video editor that runs the full FFmpeg
binary entirely on the client via WebAssembly [@haas2017bringing]. It requires no installation,
no server, and no account. All processing happens locally; files never leave
the user's device. After the first load, it works completely offline as an
installable Progressive Web App (PWA).

![ffmpeg-webCLI interface showing the full operation panel.](features.png)

The tool exposes 30+ video operations through a graphical interface, including
trim, compress, format conversion, GIF creation, audio extraction, subtitle
embedding, picture-in-picture, side-by-side composition, logo overlay, audio
mixing, denoise, loudness normalization, and pad/letterbox for social formats.
It also provides a Raw FFmpeg mode: users type any FFmpeg arguments directly,
see a live preview of the exact command that will execute, and run it locally.
A collapsible example command library (13 recipes) bridges the two modes for
users who know what they want but not the exact syntax.

# Statement of Need

FFmpeg is one of the most capable media processing tools ever built. It is
also inaccessible to most users: it requires terminal fluency, installation
privileges, and knowledge of flag syntax. Existing browser-based alternatives
(Kapwing, Clideo, Cloudconvert) solve the interface problem by uploading files
to remote servers. This introduces a privacy tradeoff that is unacceptable for
a significant class of use cases: medical video, legal recordings, journalistic
source material, and personal footage. For these cases, the privacy guarantee
offered by cloud services is a policy document, not a technical property.

`ffmpeg-webCLI` resolves this tradeoff. The WebAssembly sandbox has no network
access; data transmission during processing is technically impossible by
construction, not just by policy. Any user can verify this by opening browser
DevTools and watching zero network requests during processing.

There is also a practical accessibility gap in educational settings. Teaching
video production, entertainment engineering, or media arts in a classroom
requires software that students can run immediately on any device, without
waiting for IT approval or installation. `ffmpeg-webCLI` installs in one click
as a PWA and works offline thereafter, removing this barrier entirely.

# Architecture

The tool is built on `ffmpeg.wasm` [@ffmpegwasm], which compiles FFmpeg to
WebAssembly via Emscripten [@emscripten]. \autoref{fig:arch} shows the overall
architecture.

![ffmpeg-webCLI architecture: the WASM binary executes in a Web Worker with no network access. Files are read from and written to the user's device only.\label{fig:arch}](architecture.svg){ height=10cm }

The key architectural decisions are:

**Web Worker isolation.** FFmpeg executes in a dedicated Web Worker, keeping
the UI responsive during long encoding operations. Progress is reported via
`postMessage` callbacks.

**Virtual filesystem.** Input files are written to Emscripten's in-memory
virtual filesystem (`FS` API) before processing. Output files are read back
and offered for download. No data touches the real filesystem or any network
endpoint.

**Cross-Origin Isolation.** `ffmpeg.wasm`'s multi-threaded core requires
`SharedArrayBuffer`, which in turn requires Cross-Origin Isolation
(`COOP: same-origin` and `COEP: require-corp` headers). A minimal Node.js
server (`server.js`) sets these headers for local deployment. The service
worker explicitly re-attaches these headers to all cached responses so that
Cross-Origin Isolation is preserved in offline mode.

**Progressive Web App.** A service worker proactively caches the
`ffmpeg-core.wasm` binary (31 MB) and all static assets on first load.
Subsequent use requires no network access. A Web App Manifest enables
installation on desktop and mobile. The Screen Wake Lock API prevents device
sleep during long encoding operations.

**Progressive disclosure.** Three interface levels coexist: (1) preset
operations with constrained controls for non-technical users; (2) a
collapsible example command library with 13 recipes for users who know
what they want; and (3) a raw command interface with live preview for power
users who know FFmpeg syntax.

# Operations

The following operations are available through the graphical interface:

| Category     | Operations |
|:-------------|:-----------|
| Conversion   | Format convert (MP4, WebM, MKV, MOV, AVI), GIF maker, Audio extraction (MP3, AAC, WAV, OGG, FLAC) |
| Editing      | Trim, Crop, Rotate/Flip, Resize, Speed change (0.25x–4x), Reverse, Fade in/out |
| Audio        | Mute, Volume (0–4x), Audio replacement, Mix audio, Loop, Normalize loudness (EBU R128 [@ebu_r128]) |
| Enhancement  | Brightness/Contrast/Saturation, Grayscale, Strip metadata |
| Compositing  | Logo overlay, Picture-in-picture, Side-by-side, Concatenate |
| Subtitles    | Embed soft subtitle tracks (SRT, VTT, ASS) into MP4 or MKV |
| Effects      | Denoise (hqdn3d, three presets), Sharpen/Blur (unsharp/boxblur), Boomerang |
| Social       | Pad/Letterbox (16:9, 9:16, 1:1, 4:3, 4:5, 21:9) |
| Advanced     | Raw FFmpeg command mode, Example library (13 recipes), Media Info deep scan |

# Performance

WASM execution is CPU-bound and incurs a mean slowdown of approximately 2–4x
relative to native FFmpeg for encoding operations. This is consistent with
reported WebAssembly overheads [@jangda2019], with codec-heavy encoding
sitting at the higher end of that range. Stream-copy operations
(trim, metadata strip, subtitle embedding) are I/O-bound and show smaller
overhead. For clips under five minutes, all operations complete within
practical timeframes on modern hardware. This tradeoff is acceptable for the
target use case of ad-hoc video processing tasks where privacy and zero
installation are more important than throughput.

# Community Adoption

Since release, `ffmpeg-webCLI` has received 287 GitHub stars and 31 forks.
A public post on Hacker News [@hn2026] received 83 points and 43 comments
within 24 hours, with users reporting successful real-world use including
legacy format migration (.mpg to .mp4) and classroom deployment as an
offline PWA.

# Limitations

- Hard subtitle burning requires a `libass`-enabled FFmpeg build, which is
  not available in the standard `ffmpeg.wasm` binary.
- The WASM memory ceiling (~2 GB) limits processing of very large files.
- No batch processing: files are processed one at a time.
- Encoding is approximately 2–4x slower than native FFmpeg.

# Acknowledgements

This project is built on `ffmpeg.wasm` by the ffmpegwasm contributors
[@ffmpegwasm], which is itself built on FFmpeg [@ffmpeg]. The author thanks
the open source community for contributions, feedback, and the first external
pull request from \@luispa.

# References
