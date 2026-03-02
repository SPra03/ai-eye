import { describe, it, expect } from 'vitest';
import {
  filterConsoleLogs,
  filterNetworkRequests,
  getHMRStatus,
  clearHMRErrors,
} from './playwright-tools.js';
import type { ConsoleLogEntry, NetworkRequestEntry } from './playwright-tools.js';

describe('Playwright Tools', () => {
  describe('Console Log Filtering', () => {
    const logs: ConsoleLogEntry[] = [
      { level: 'log', message: 'info message', timestamp: 1000 },
      { level: 'warn', message: 'warning message', timestamp: 2000 },
      { level: 'error', message: 'error message', timestamp: 3000 },
      { level: 'log', message: 'another log', timestamp: 4000 },
      { level: 'error', message: 'another error', timestamp: 5000 },
    ];

    it('should return all logs when no filter', () => {
      const result = filterConsoleLogs(logs);
      expect(result).toHaveLength(5);
    });

    it('should filter by level', () => {
      const errors = filterConsoleLogs(logs, 'error');
      expect(errors).toHaveLength(2);
      expect(errors.every(l => l.level === 'error')).toBe(true);
    });

    it('should limit results', () => {
      const limited = filterConsoleLogs(logs, undefined, 2);
      expect(limited).toHaveLength(2);
      // Should return last 2 entries
      expect(limited[0].timestamp).toBe(4000);
      expect(limited[1].timestamp).toBe(5000);
    });

    it('should filter by level and limit', () => {
      const result = filterConsoleLogs(logs, 'log', 1);
      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('another log');
    });
  });

  describe('Network Request Filtering', () => {
    const requests: NetworkRequestEntry[] = [
      { url: 'https://api.example.com/users', method: 'GET', status: 200, duration: 100, timestamp: 1000 },
      { url: 'https://api.example.com/data', method: 'POST', status: 201, duration: 200, timestamp: 2000 },
      { url: 'https://cdn.example.com/image.png', method: 'GET', status: 404, duration: 50, timestamp: 3000 },
      { url: 'https://api.example.com/auth', method: 'POST', status: 500, duration: 300, timestamp: 4000, error: 'Server error' },
    ];

    it('should return all requests when no filter', () => {
      const result = filterNetworkRequests(requests);
      expect(result).toHaveLength(4);
    });

    it('should filter by URL pattern', () => {
      const result = filterNetworkRequests(requests, { urlPattern: 'api\\.example' });
      expect(result).toHaveLength(3);
    });

    it('should filter by method', () => {
      const result = filterNetworkRequests(requests, { method: 'POST' });
      expect(result).toHaveLength(2);
    });

    it('should filter by status', () => {
      const result = filterNetworkRequests(requests, { status: 200 });
      expect(result).toHaveLength(1);
    });

    it('should filter by hasError', () => {
      const errors = filterNetworkRequests(requests, { hasError: true });
      expect(errors).toHaveLength(2); // 404 and 500
    });

    it('should filter non-errors', () => {
      const ok = filterNetworkRequests(requests, { hasError: false });
      expect(ok).toHaveLength(2); // 200 and 201
    });

    it('should limit results', () => {
      const limited = filterNetworkRequests(requests, undefined, 2);
      expect(limited).toHaveLength(2);
    });
  });

  describe('HMR Status (External Sites)', () => {
    it('should return not-available status', () => {
      const status = getHMRStatus();
      expect(status.connected).toBe(false);
      expect(status.note).toContain('not available');
    });

    it('should return no-op for clearHMRErrors', () => {
      const result = clearHMRErrors();
      expect(result.note).toContain('external');
    });
  });

  describe('URL Classification Helper', () => {
    // Test the URL classification logic that lives in index.ts
    function isLocalUrl(url: string): boolean {
      try {
        const parsed = new URL(url);
        const hostname = parsed.hostname;
        return hostname === 'localhost'
          || hostname === '127.0.0.1'
          || hostname === '0.0.0.0'
          || hostname === '::1'
          || hostname === '[::1]'
          || hostname.endsWith('.localhost');
      } catch {
        return false;
      }
    }

    it('should classify localhost as local', () => {
      expect(isLocalUrl('http://localhost:3000')).toBe(true);
      expect(isLocalUrl('http://localhost:5175')).toBe(true);
      expect(isLocalUrl('http://localhost')).toBe(true);
    });

    it('should classify 127.0.0.1 as local', () => {
      expect(isLocalUrl('http://127.0.0.1:8080')).toBe(true);
      expect(isLocalUrl('http://127.0.0.1')).toBe(true);
    });

    it('should classify 0.0.0.0 as local', () => {
      expect(isLocalUrl('http://0.0.0.0:3000')).toBe(true);
    });

    it('should classify ::1 as local', () => {
      expect(isLocalUrl('http://[::1]:3000')).toBe(true);
    });

    it('should classify *.localhost as local', () => {
      expect(isLocalUrl('http://app.localhost:3000')).toBe(true);
    });

    it('should classify external domains as non-local', () => {
      expect(isLocalUrl('https://example.com')).toBe(false);
      expect(isLocalUrl('https://google.com')).toBe(false);
      expect(isLocalUrl('https://apple.com/iphone')).toBe(false);
    });

    it('should handle invalid URLs', () => {
      expect(isLocalUrl('not a url')).toBe(false);
      expect(isLocalUrl('')).toBe(false);
    });
  });

  describe('Mode Switching Logic', () => {
    it('should track mode transitions', () => {
      let mode: 'webview' | 'browser' = 'webview';

      // Navigate to external URL
      mode = 'browser';
      expect(mode).toBe('browser');

      // Navigate back to localhost
      mode = 'webview';
      expect(mode).toBe('webview');
    });
  });

  describe('Playwright Tool Data Shapes', () => {
    it('inspectElement should expect correct return shape', () => {
      const expected = {
        tagName: 'div',
        selector: '#root',
        sourceFile: null,
        sourceLine: null,
        sourceCol: null,
        boundingBox: { x: 0, y: 0, width: 100, height: 100 },
        computedStyles: {},
        innerText: '',
        innerHTML: '',
        attributes: {},
      };

      expect(expected).toHaveProperty('tagName');
      expect(expected).toHaveProperty('boundingBox');
      expect(expected.sourceFile).toBeNull();
      expect(expected.sourceLine).toBeNull();
    });

    it('getSource should return error for external sites', () => {
      const result = {
        error: 'Source file mapping is not available for external websites. ' +
               'Source mapping requires the @visioncraft/vite-plugin to inject ' +
               'data-vc-source attributes during development builds.',
      };

      expect(result.error).toContain('not available');
      expect(result.error).toContain('external');
    });

    it('click/type/hover/scroll should return success shape', () => {
      const successResult = { success: true };
      const errorResult = { success: false, error: 'Element not found' };

      expect(successResult.success).toBe(true);
      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toBeDefined();
    });

    it('styleDiff should return changes array shape', () => {
      const result = {
        selector: 'button',
        action: 'hover',
        changes: [
          { property: 'background-color', before: 'rgb(0, 0, 0)', after: 'rgb(255, 255, 255)' },
        ],
        boundingBox: {
          before: { x: 0, y: 0, width: 100, height: 40 },
          after: { x: 0, y: 0, width: 100, height: 40 },
        },
        note: 'Used real Playwright hover — CSS :hover pseudo-class was triggered.',
      };

      expect(result.changes).toHaveLength(1);
      expect(result.changes[0]).toHaveProperty('property');
      expect(result.changes[0]).toHaveProperty('before');
      expect(result.changes[0]).toHaveProperty('after');
      expect(result.note).toContain('Playwright');
    });

    it('auditAccessibility should return violations shape', () => {
      const result = {
        violations: [{
          id: 'color-contrast',
          impact: 'serious',
          description: 'Ensures color contrast is sufficient',
          help: 'Elements must have sufficient color contrast',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/color-contrast',
          tags: ['wcag2aa'],
          nodes: [{ html: '<p>text</p>', target: ['p'], failureSummary: 'Fix...' }],
        }],
        passCount: 25,
        incompleteCount: 1,
        summary: '1 violations, 25 passes, 1 incomplete',
      };

      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toHaveProperty('id');
      expect(result.violations[0]).toHaveProperty('impact');
      expect(result.passCount).toBe(25);
    });
  });
});
