/**
 * Element cache with 30-second expiry.
 * Caches AX element info by ID so agents can reference elements from previous calls.
 */

import type { AXElementInfo } from './types.js';

interface CachedElement {
  info: AXElementInfo;
  timestamp: number;
}

const CACHE_TTL_MS = 30_000; // 30 seconds

class ElementCache {
  private cache = new Map<string, CachedElement>();
  private nextId = 1;

  /**
   * Store an element and return its cache ID.
   */
  store(info: AXElementInfo): string {
    this.cleanup();
    const id = `el_${this.nextId++}`;
    this.cache.set(id, { info, timestamp: Date.now() });
    return id;
  }

  /**
   * Store multiple elements, returning their cache IDs.
   */
  storeAll(infos: AXElementInfo[]): string[] {
    this.cleanup();
    return infos.map((info) => this.store(info));
  }

  /**
   * Retrieve a cached element by ID.
   */
  get(id: string): AXElementInfo | null {
    const entry = this.cache.get(id);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.cache.delete(id);
      return null;
    }
    return entry.info;
  }

  /**
   * Remove expired entries.
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [id, entry] of this.cache) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        this.cache.delete(id);
      }
    }
  }

  /**
   * Clear all cached elements.
   */
  clear(): void {
    this.cache.clear();
  }
}

export const elementCache = new ElementCache();
