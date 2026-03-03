/** Types for macOS MCP server */

export interface SwiftHelperResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ScreenshotResult {
  base64: string;
  width: number;
  height: number;
  format: string;
}

export interface PointInfo {
  x: number;
  y: number;
}

export interface SizeInfo {
  width: number;
  height: number;
}

export interface AXElementInfo {
  role: string | null;
  roleDescription: string | null;
  title: string | null;
  description: string | null;
  value: string | null;
  label: string | null;
  position: PointInfo | null;
  size: SizeInfo | null;
  enabled: boolean | null;
  focused: boolean | null;
  selected: boolean | null;
  axpath: string | null;
  children: AXElementInfo[] | null;
  childCount: number | null;
  actions: string[] | null;
}

export interface WindowInfo {
  windowId: number;
  title: string | null;
  ownerName: string | null;
  ownerBundleId: string | null;
  ownerPid: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  layer: number;
  isOnScreen: boolean;
}

export interface AppInfo {
  name: string | null;
  bundleId: string | null;
  pid: number;
  isActive: boolean;
  isHidden: boolean;
}

export interface PermissionStatus {
  accessibility: boolean;
  screenRecording: boolean;
}

export interface InteractionResult {
  success: boolean;
}

export interface VisualDiffResult {
  changedPixels: number;
  totalPixels: number;
  changedPercent: number;
  similarityPercent: number;
  dimensions: { width: number; height: number };
}

export interface PaletteColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  count: number;
  percentage: number;
}
