/**
 * Type definitions for VisionCraft MCP Server
 */

export interface BrowserConnection {
  page: any; // Playwright Page
  url: string;
  connected: boolean;
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

export interface ErrorResult {
  error: string;
}

export interface PageStructureNode {
  tag?: string;
  source?: string | null;
  text?: string | null;
  role?: string | null;
  children?: PageStructureNode[];
}

export interface ElementSearchResult {
  selector: string;
  source?: string | null;
  text?: string;
  role?: string | null;
}

export interface SourceLocation {
  file: string | null;
  line: string | null;
  col: string | null;
}

export interface ActionResult {
  success: boolean;
  error?: string;
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
  }>;
}

export interface VisionCraftBridge {
  // Inspection
  inspectElement: (selector: string) => ElementInspectionResult | ErrorResult;
  getPageStructure: (maxDepth?: number) => PageStructureNode;
  findElements: (query: string, mode?: 'text' | 'role' | 'css') => ElementSearchResult[];
  getElementSource: (selector: string) => SourceLocation | ErrorResult;

  // Interaction
  clickElement: (selector: string) => ActionResult;
  typeText: (selector: string, text: string) => ActionResult;
  scrollTo: (x: number, y: number) => ActionResult;

  // Debugging
  consoleLogs: ConsoleLog[];
  getConsoleLogs: (level?: string, limit?: number) => ConsoleLog[];
  clearConsoleLogs: () => void;

  // Screenshots
  captureScreenshot: (format?: 'jpeg' | 'png', quality?: number) => Promise<string>;

  // HMR
  getHMRStatus: () => HMRStatus;

  // Metadata
  version: string;
  ready: boolean;
}
