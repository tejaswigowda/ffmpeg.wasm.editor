// docs/worker.js — same-origin ffmpeg.wasm worker
//
// Why this file exists:
//   Browsers block cross-origin type:module workers even when the CDN sends
//   CORS headers. Serving from the same origin (here) bypasses that.
//
// Why we pre-fetch WASM as an ArrayBuffer instead of passing a URL:
//   When Emscripten receives Module.wasmBinary (an ArrayBuffer), it calls
//   WebAssembly.instantiate(binary) directly — no internal fetch, no blob URL,
//   no ERR_REQUEST_RANGE_NOT_SATISFIABLE on range requests against blob URLs.

// Debug: intercept any URL.createObjectURL calls so we can trace their origin.
// If any blob URL is created in this worker context it will be logged here.
{
  const _orig = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (obj) => {
    const url = _orig(obj);
    console.trace('[worker] URL.createObjectURL called → ' + url,
      obj instanceof Blob ? 'Blob size=' + obj.size : obj);
    return url;
  };
}

// FFMessageType string values (from @ffmpeg/ffmpeg const.js)
const T = {
  LOAD:        'LOAD',
  EXEC:        'EXEC',
  FFPROBE:     'FFPROBE',
  WRITE_FILE:  'WRITE_FILE',
  READ_FILE:   'READ_FILE',
  DELETE_FILE: 'DELETE_FILE',
  RENAME:      'RENAME',
  CREATE_DIR:  'CREATE_DIR',
  LIST_DIR:    'LIST_DIR',
  DELETE_DIR:  'DELETE_DIR',
  MOUNT:       'MOUNT',
  UNMOUNT:     'UNMOUNT',
  ERROR:       'ERROR',
  LOG:         'LOG',
  PROGRESS:    'PROGRESS',
};

let ffmpeg = null;

async function load({ coreURL, wasmURL }) {
  const first = !ffmpeg;

  // Dynamic import — import.meta.url inside ffmpeg-core.js resolves to the
  // CDN base URL, so any of its own relative imports work correctly.
  // The service worker intercepts three-bvh-csg requests and serves a local shim.
  const mod = await import(/* @vite-ignore */ coreURL);
  const createFFmpegCore = mod.default;
  if (!createFFmpegCore) throw new Error('createFFmpegCore not found in ' + coreURL);

  // Pre-fetch the WASM binary as an ArrayBuffer.
  // Passing it via Module.wasmBinary makes Emscripten skip all internal URL
  // fetches and blob-URL creation and call WebAssembly.instantiate(binary)
  // directly. This is the only reliable way to avoid range-request errors.
  self.postMessage({ type: T.LOG, data: { type: 'stderr', message: '[worker] Fetching WASM binary…' } });
  const wasmResp = await fetch(wasmURL);
  if (!wasmResp.ok) throw new Error(`WASM fetch failed: ${wasmResp.status} ${wasmURL}`);
  const wasmBinary = await wasmResp.arrayBuffer();
  self.postMessage({ type: T.LOG, data: { type: 'stderr', message: '[worker] WASM binary loaded, initialising…' } });

  // instantiateWasm is provided as a belt-and-suspenders guard: even if
  // Emscripten somehow falls through to instantiateAsync, our callback
  // intercepts and calls WebAssembly.instantiate with the pre-fetched binary
  // directly — zero network requests, zero blob URLs.
  ffmpeg = await createFFmpegCore({
    wasmBinary,
    instantiateWasm(info, receiveInstance) {
      WebAssembly.instantiate(new Uint8Array(wasmBinary), info)
        .then(({ instance, module }) => receiveInstance(instance, module))
        .catch(err => console.error('[worker] instantiateWasm error:', err));
      return {}; // must return {} to signal async completion
    },
  });

  ffmpeg.setLogger(data => self.postMessage({ type: T.LOG, data }));
  ffmpeg.setProgress(data => self.postMessage({ type: T.PROGRESS, data }));
  return first;
}

self.onmessage = async ({ data: { id, type, data } }) => {
  const trans = [];
  let result;
  try {
    if (type !== T.LOAD && !ffmpeg) throw new Error('ffmpeg not loaded');
    switch (type) {
      case T.LOAD:
        result = await load(data);
        break;
      case T.EXEC:
        ffmpeg.setTimeout(data.timeout ?? -1);
        ffmpeg.exec(...data.args);
        result = ffmpeg.ret;
        ffmpeg.reset();
        break;
      case T.FFPROBE:
        ffmpeg.setTimeout(data.timeout ?? -1);
        ffmpeg.ffprobe(...data.args);
        result = ffmpeg.ret;
        ffmpeg.reset();
        break;
      case T.WRITE_FILE:
        ffmpeg.FS.writeFile(data.path, data.data);
        result = true;
        break;
      case T.READ_FILE:
        result = ffmpeg.FS.readFile(data.path, { encoding: data.encoding });
        break;
      case T.DELETE_FILE:
        ffmpeg.FS.unlink(data.path);
        result = true;
        break;
      case T.RENAME:
        ffmpeg.FS.rename(data.oldPath, data.newPath);
        result = true;
        break;
      case T.CREATE_DIR:
        ffmpeg.FS.mkdir(data.path);
        result = true;
        break;
      case T.LIST_DIR: {
        const names = ffmpeg.FS.readdir(data.path);
        const nodes = [];
        for (const name of names) {
          const stat = ffmpeg.FS.stat(`${data.path}/${name}`);
          nodes.push({ name, isDir: ffmpeg.FS.isDir(stat.mode) });
        }
        result = nodes;
        break;
      }
      case T.DELETE_DIR:
        ffmpeg.FS.rmdir(data.path);
        result = true;
        break;
      case T.MOUNT: {
        const fs = ffmpeg.FS.filesystems[data.fsType];
        if (!fs) { result = false; break; }
        ffmpeg.FS.mount(fs, data.options, data.mountPoint);
        result = true;
        break;
      }
      case T.UNMOUNT:
        ffmpeg.FS.unmount(data.mountPoint);
        result = true;
        break;
      default:
        throw new Error('Unknown message type: ' + type);
    }
  } catch (e) {
    self.postMessage({ id, type: T.ERROR, data: e.toString() });
    return;
  }
  if (result instanceof Uint8Array) trans.push(result.buffer);
  self.postMessage({ id, type, data: result }, trans);
};
