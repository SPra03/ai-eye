/**
 * Color palette extraction from screenshot PNG buffers.
 */

let PNG: any = null;

async function loadPNG() {
  if (!PNG) {
    const pngjs = await import('pngjs');
    PNG = pngjs.PNG;
  }
}

export interface PaletteColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  count: number;
  percentage: number;
}

/**
 * Extract the most common colors from a PNG buffer.
 * Quantizes colors to reduce noise (groups similar colors).
 */
export async function extractPalette(
  pngBuffer: Buffer,
  limit: number = 20,
  quantizeBits: number = 5,
): Promise<PaletteColor[]> {
  await loadPNG();

  const img = PNG.sync.read(pngBuffer);
  const { data, width, height } = img;
  const totalPixels = width * height;

  // Count colors (quantized to reduce similar color noise)
  const colorCounts = new Map<string, { r: number; g: number; b: number; count: number }>();
  const shift = 8 - quantizeBits;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue; // Skip transparent pixels

    const r = (data[i] >> shift) << shift;
    const g = (data[i + 1] >> shift) << shift;
    const b = (data[i + 2] >> shift) << shift;

    const key = `${r},${g},${b}`;
    const existing = colorCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorCounts.set(key, { r, g, b, count: 1 });
    }
  }

  // Sort by frequency and take top N
  const sorted = Array.from(colorCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return sorted.map(({ r, g, b, count }) => ({
    hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
    rgb: { r, g, b },
    count,
    percentage: parseFloat(((count / totalPixels) * 100).toFixed(2)),
  }));
}
