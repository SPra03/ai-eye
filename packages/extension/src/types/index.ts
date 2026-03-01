/**
 * VisionCraft Type Definitions
 */

export interface VisionCraftConfig {
  devServerUrl: string;
  framework: 'auto' | 'react' | 'vue' | 'svelte' | 'html';
  screenshotQuality: number;
  enableCDP: boolean;
}

export interface PreviewMessage {
  type: string;
  id?: number;
  data?: unknown;
  code?: string;
  result?: unknown;
  error?: string;
  timeout?: number;
}

export interface BridgeEvaluationResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface ElementInspectionResult {
  tagName: string;
  sourceFile: string | null;
  sourceLine: string | null;
  sourceCol: string | null;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  computedStyles: Record<string, string>;
  innerText?: string;
  innerHTML?: string;
  attributes: Record<string, string>;
}

export interface PageStructureNode {
  tag?: string;
  source?: string | null;
  text?: string | null;
  role?: string | null;
  children?: PageStructureNode[];
}

export interface ConsoleLog {
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
}

export interface HMRStatus {
  connected: boolean;
  lastUpdate: number | null;
  errors: Array<{
    message: string;
    stack?: string;
    file?: string;
    line?: number;
  }>;
}
