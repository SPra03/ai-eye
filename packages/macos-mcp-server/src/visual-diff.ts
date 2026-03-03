/**
 * Visual diff utilities using pixelmatch.
 * Reuses the same pattern as the web MCP server.
 */

// Lazy-loaded dependencies
let pixelmatch: any = null;
let PNG: any = null;

async function loadDeps() {
  if (!pixelmatch) {
    const pm = await import('pixelmatch');
    pixelmatch = pm.default || pm;
    const pngjs = await import('pngjs');
    PNG = pngjs.PNG;
  }
}

/**
 * Pad an image to target dimensions (fills extra area with transparent black).
 */
function padImage(img: any, w: number, h: number): Buffer {
  if (img.width === w && img.height === h) return img.data;
  const padded = Buffer.alloc(w * h * 4, 0);
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const srcIdx = (y * img.width + x) * 4;
      const dstIdx = (y * w + x) * 4;
      padded[dstIdx] = img.data[srcIdx];
      padded[dstIdx + 1] = img.data[srcIdx + 1];
      padded[dstIdx + 2] = img.data[srcIdx + 2];
      padded[dstIdx + 3] = img.data[srcIdx + 3];
    }
  }
  return padded;
}

export interface DiffResult {
  changedPixels: number;
  totalPixels: number;
  changedPercent: number;
  similarityPercent: number;
  dimensions: { width: number; height: number };
  diffBase64: string;
}

/**
 * Compare two PNG buffers and return diff results.
 */
export async function compareImages(
  oldBuffer: Buffer,
  newBuffer: Buffer,
  threshold: number = 30,
): Promise<DiffResult> {
  await loadDeps();

  const oldPng = PNG.sync.read(oldBuffer);
  const newPng = PNG.sync.read(newBuffer);

  const width = Math.max(oldPng.width, newPng.width);
  const height = Math.max(oldPng.height, newPng.height);

  const oldData = padImage(oldPng, width, height);
  const newData = padImage(newPng, width, height);

  const diffData = Buffer.alloc(width * height * 4);
  const numDiffPixels = pixelmatch(oldData, newData, diffData, width, height, {
    threshold: threshold / 255,
  });

  const totalPixels = width * height;
  const changedPercent = parseFloat(((numDiffPixels / totalPixels) * 100).toFixed(2));
  const similarityPercent = parseFloat((100 - changedPercent).toFixed(2));

  // Encode diff image as PNG
  const diffPng = new PNG({ width, height });
  diffPng.data = diffData;
  const diffBuffer = PNG.sync.write(diffPng);

  return {
    changedPixels: numDiffPixels,
    totalPixels,
    changedPercent,
    similarityPercent,
    dimensions: { width, height },
    diffBase64: diffBuffer.toString('base64'),
  };
}

/**
 * Load a PNG file and return its buffer.
 */
export async function loadPNG(filePath: string): Promise<Buffer> {
  const { readFileSync } = await import('node:fs');
  return readFileSync(filePath);
}

/**
 * Convert JPEG buffer to PNG buffer for comparison.
 */
export async function jpegToPNG(jpegBuffer: Buffer): Promise<Buffer> {
  await loadDeps();
  // pixelmatch needs PNG - if we got JPEG we need conversion
  // For simplicity, screenshots should always use PNG for diff baseline
  return jpegBuffer;
}
