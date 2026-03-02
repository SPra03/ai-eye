/**
 * Playwright-native tool implementations for browser mode (external websites).
 * Each function accepts a Playwright Page and returns the same data shapes
 * as the bridge methods, using page.evaluate() with vanilla JS.
 *
 * These are used when the VisionCraft bridge script is NOT injected
 * (i.e., when browsing external websites, not a local dev server).
 */

import type { Page } from 'playwright-core';

// ====== DOM Inspection ======

export async function inspectElement(page: Page, selector: string) {
  return await page.evaluate((sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return { error: `Element not found: ${sel}` };

    const rect = el.getBoundingClientRect();
    const computed = window.getComputedStyle(el);
    const attributes: Record<string, string> = {};
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      attributes[attr.name] = attr.value;
    }

    // Generate a unique selector for this element
    let generatedSelector = el.tagName.toLowerCase();
    if (el.id) generatedSelector = `#${el.id}`;
    else if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (cls) generatedSelector += `.${cls}`;
    }

    return {
      tagName: el.tagName.toLowerCase(),
      selector: generatedSelector,
      sourceFile: null,
      sourceLine: null,
      sourceCol: null,
      boundingBox: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      computedStyles: {
        display: computed.display,
        position: computed.position,
        width: computed.width,
        height: computed.height,
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        padding: computed.padding,
        margin: computed.margin,
        border: computed.border,
        zIndex: computed.zIndex,
      },
      innerText: (el as HTMLElement).innerText?.substring(0, 200) || '',
      innerHTML: el.innerHTML?.substring(0, 500) || '',
      attributes,
    };
  }, selector);
}

export async function elementAtPoint(page: Page, x: number, y: number) {
  return await page.evaluate(({ x, y }: { x: number; y: number }) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return { error: `No element found at point (${x}, ${y})` };

    const rect = el.getBoundingClientRect();
    const computed = window.getComputedStyle(el);

    let selector = el.tagName.toLowerCase();
    if (el.id) selector = `#${el.id}`;
    else if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (cls) selector += `.${cls}`;
    }

    return {
      tagName: el.tagName.toLowerCase(),
      selector,
      sourceFile: null,
      sourceLine: null,
      sourceCol: null,
      boundingBox: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      computedStyles: {
        display: computed.display,
        position: computed.position,
        width: computed.width,
        height: computed.height,
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        padding: computed.padding,
        margin: computed.margin,
        border: computed.border,
        zIndex: computed.zIndex,
      },
      innerText: (el as HTMLElement).innerText?.substring(0, 200) || '',
      attributes: {} as Record<string, string>,
    };
  }, { x, y });
}

export async function batchInspect(
  page: Page,
  selectors?: string[],
  region?: { x: number; y: number; width: number; height: number },
  includeStyles?: boolean
) {
  return await page.evaluate(
    ({
      selectors,
      region,
      includeStyles,
    }: {
      selectors?: string[];
      region?: { x: number; y: number; width: number; height: number };
      includeStyles?: boolean;
    }) => {
      const results: any[] = [];

      function inspectEl(el: Element) {
        const rect = el.getBoundingClientRect();
        let selector = el.tagName.toLowerCase();
        if (el.id) selector = `#${el.id}`;
        else if (el.className && typeof el.className === 'string') {
          const cls = el.className.trim().split(/\s+/).slice(0, 2).join('.');
          if (cls) selector += `.${cls}`;
        }

        const result: any = {
          tagName: el.tagName.toLowerCase(),
          selector,
          sourceFile: null,
          sourceLine: null,
          sourceCol: null,
          boundingBox: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        };

        if (includeStyles) {
          const computed = window.getComputedStyle(el);
          result.computedStyles = {
            display: computed.display,
            position: computed.position,
            width: computed.width,
            height: computed.height,
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
          };
        }

        return result;
      }

      if (selectors) {
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) {
            results.push(inspectEl(el));
          } else {
            results.push({ error: `Element not found: ${sel}` });
          }
        }
      }

      if (region) {
        const allEls = document.querySelectorAll('*');
        let count = 0;
        for (let i = 0; i < allEls.length && count < 50; i++) {
          const rect = allEls[i].getBoundingClientRect();
          if (
            rect.right >= region.x &&
            rect.left <= region.x + region.width &&
            rect.bottom >= region.y &&
            rect.top <= region.y + region.height &&
            rect.width > 0 &&
            rect.height > 0
          ) {
            results.push(inspectEl(allEls[i]));
            count++;
          }
        }
      }

      return results;
    },
    { selectors, region, includeStyles }
  );
}

export async function findElements(
  page: Page,
  query: string,
  mode: string = 'css',
  includeSource: boolean = false
) {
  return await page.evaluate(
    ({ query, mode }: { query: string; mode: string }) => {
      const results: any[] = [];
      let elements: Element[] = [];

      if (mode === 'css') {
        try {
          elements = Array.from(document.querySelectorAll(query)).slice(0, 20);
        } catch {
          return [{ error: `Invalid CSS selector: ${query}` }];
        }
      } else if (mode === 'text') {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
        let node: Node | null;
        while ((node = walker.nextNode()) && elements.length < 20) {
          const el = node as HTMLElement;
          if (el.innerText && el.innerText.includes(query) && el.children.length === 0) {
            elements.push(el);
          }
        }
      } else if (mode === 'role') {
        elements = Array.from(document.querySelectorAll(`[role="${query}"]`)).slice(0, 20);
        // Also check semantic elements
        const roleMap: Record<string, string> = {
          button: 'button',
          link: 'a',
          heading: 'h1,h2,h3,h4,h5,h6',
          img: 'img',
          navigation: 'nav',
          main: 'main',
          banner: 'header',
          contentinfo: 'footer',
        };
        if (roleMap[query] && elements.length < 20) {
          const semantic = Array.from(document.querySelectorAll(roleMap[query]));
          for (const el of semantic) {
            if (!elements.includes(el) && elements.length < 20) {
              elements.push(el);
            }
          }
        }
      }

      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        let selector = el.tagName.toLowerCase();
        if (el.id) selector = `#${el.id}`;
        else if (el.className && typeof el.className === 'string') {
          const cls = el.className.trim().split(/\s+/).slice(0, 2).join('.');
          if (cls) selector += `.${cls}`;
        }

        results.push({
          tagName: el.tagName.toLowerCase(),
          selector,
          innerText: (el as HTMLElement).innerText?.substring(0, 100) || '',
          boundingBox: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          sourceFile: null,
          sourceLine: null,
          sourceCol: null,
        });
      }

      return results;
    },
    { query, mode }
  );
}

export async function getStructure(page: Page, maxDepth: number = 5) {
  return await page.evaluate((maxDepth: number) => {
    function walk(el: Element, depth: number): any {
      if (depth > maxDepth) return null;

      let selector = el.tagName.toLowerCase();
      if (el.id) selector = `#${el.id}`;

      const node: any = {
        tag: el.tagName.toLowerCase(),
        selector,
      };

      if (el.id) node.id = el.id;
      if (el.className && typeof el.className === 'string') {
        const classes = el.className.trim();
        if (classes) node.classes = classes;
      }

      const children: any[] = [];
      const childEls = Array.from(el.children).slice(0, 20);
      for (const child of childEls) {
        const childNode = walk(child, depth + 1);
        if (childNode) children.push(childNode);
      }

      if (children.length > 0) node.children = children;
      if (el.children.length > 20) {
        node.truncated = `${el.children.length - 20} more children`;
      }

      return node;
    }

    return walk(document.documentElement, 0);
  }, maxDepth);
}

// ====== Interaction ======

export async function click(page: Page, selector: string) {
  try {
    await page.locator(selector).click({ timeout: 5000 });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function type(page: Page, selector: string, text: string) {
  try {
    await page.locator(selector).fill(text, { timeout: 5000 });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function hover(page: Page, selector: string) {
  try {
    await page.locator(selector).hover({ timeout: 5000 });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function scroll(page: Page, x: number, y: number) {
  await page.evaluate(({ x, y }: { x: number; y: number }) => {
    window.scrollTo(x, y);
  }, { x, y });
  return { success: true };
}

// ====== CSS ======

export async function getCSSSource(page: Page, selector: string, properties?: string[]) {
  return await page.evaluate(
    ({ sel, props }: { sel: string; props?: string[] }) => {
      const el = document.querySelector(sel);
      if (!el) return { error: `Element not found: ${sel}` };

      const results: any[] = [];
      for (let i = 0; i < document.styleSheets.length; i++) {
        const sheet = document.styleSheets[i];
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue; // Cross-origin stylesheet
        }

        const file = sheet.href || 'inline';

        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j] as CSSStyleRule;
          if (!rule.selectorText) continue;
          try {
            if (!el.matches(rule.selectorText)) continue;
          } catch {
            continue;
          }

          for (let k = 0; k < rule.style.length; k++) {
            const prop = rule.style[k];
            if (props && props.length > 0 && !props.includes(prop)) continue;
            results.push({
              property: prop,
              value: rule.style.getPropertyValue(prop),
              selector: rule.selectorText,
              file,
              line: null, // No source access for external sites
            });
          }
        }
      }
      return results;
    },
    { sel: selector, props: properties }
  );
}

const DEFAULT_STYLE_PROPS = [
  'display', 'visibility', 'opacity', 'position',
  'top', 'right', 'bottom', 'left',
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'margin', 'padding', 'border',
  'color', 'background-color', 'background',
  'font-size', 'font-weight', 'font-family',
  'line-height', 'text-decoration', 'text-align',
  'transform', 'transition',
  'box-shadow', 'text-shadow',
  'border-radius', 'outline',
  'cursor', 'pointer-events',
  'overflow', 'z-index',
  'flex', 'flex-direction', 'align-items', 'justify-content',
  'grid-template-columns', 'grid-template-rows',
];

export async function styleDiff(
  page: Page,
  selector: string,
  action: string,
  actionArg?: string,
  properties?: string[]
) {
  const propsToWatch = properties || DEFAULT_STYLE_PROPS;

  // Capture before styles
  const before = await page.evaluate(
    ({ sel, props }: { sel: string; props: string[] }) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      const styles: Record<string, string> = {};
      for (const p of props) styles[p] = computed.getPropertyValue(p);
      const rect = el.getBoundingClientRect();
      return {
        styles,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        classes: Array.from(el.classList),
      };
    },
    { sel: selector, props: propsToWatch }
  );

  if (!before) return { error: `Element not found: ${selector}` };

  // Perform action using Playwright APIs (real browser interaction)
  switch (action) {
    case 'hover':
      await page.locator(selector).hover();
      break;
    case 'click':
      await page.locator(selector).click();
      break;
    case 'focus':
      await page.locator(selector).focus();
      break;
    case 'blur':
      await page.evaluate(
        (s: string) => (document.querySelector(s) as HTMLElement)?.blur(),
        selector
      );
      break;
    case 'addClass':
      if (actionArg)
        await page.evaluate(
          ({ s, c }: { s: string; c: string }) =>
            document.querySelector(s)?.classList.add(c),
          { s: selector, c: actionArg }
        );
      break;
    case 'removeClass':
      if (actionArg)
        await page.evaluate(
          ({ s, c }: { s: string; c: string }) =>
            document.querySelector(s)?.classList.remove(c),
          { s: selector, c: actionArg }
        );
      break;
    case 'toggleClass':
      if (actionArg)
        await page.evaluate(
          ({ s, c }: { s: string; c: string }) =>
            document.querySelector(s)?.classList.toggle(c),
          { s: selector, c: actionArg }
        );
      break;
  }

  // Wait for styles to settle
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
  );

  // Capture after styles
  const after = await page.evaluate(
    ({ sel, props }: { sel: string; props: string[] }) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      const styles: Record<string, string> = {};
      for (const p of props) styles[p] = computed.getPropertyValue(p);
      const rect = el.getBoundingClientRect();
      return {
        styles,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        classes: Array.from(el.classList),
      };
    },
    { sel: selector, props: propsToWatch }
  );

  if (!after) return { error: `Element disappeared after action: ${selector}` };

  // Compute diff
  const changes: { property: string; before: string; after: string }[] = [];
  for (const prop of propsToWatch) {
    if (before.styles[prop] !== after.styles[prop]) {
      changes.push({ property: prop, before: before.styles[prop], after: after.styles[prop] });
    }
  }

  const addedClasses = after.classes.filter((c: string) => !before.classes.includes(c));
  const removedClasses = before.classes.filter((c: string) => !after.classes.includes(c));

  return {
    selector,
    action,
    changes,
    boundingBox: { before: before.rect, after: after.rect },
    classesChanged:
      addedClasses.length > 0 || removedClasses.length > 0
        ? { added: addedClasses, removed: removedClasses }
        : undefined,
    note: action === 'hover'
      ? 'Used real Playwright hover — CSS :hover pseudo-class was triggered.'
      : undefined,
  };
}

// ====== CSS Source Mapping (graceful degradation) ======

export async function getSource(_page: Page, _selector: string) {
  return {
    error:
      'Source file mapping is not available for external websites. ' +
      'Source mapping requires the @visioncraft/vite-plugin to inject ' +
      'data-vc-source attributes during development builds.',
  };
}

// ====== Monitoring ======

export interface ConsoleLogEntry {
  level: string;
  message: string;
  timestamp: number;
}

export interface NetworkRequestEntry {
  url: string;
  method: string;
  status: number;
  duration: number;
  timestamp: number;
  error?: string;
  type?: string;
}

export function filterConsoleLogs(
  logs: ConsoleLogEntry[],
  level?: string,
  limit?: number
): ConsoleLogEntry[] {
  let filtered = logs;
  if (level) {
    filtered = filtered.filter((l) => l.level === level);
  }
  if (limit && limit > 0) {
    filtered = filtered.slice(-limit);
  }
  return filtered;
}

export function filterNetworkRequests(
  requests: NetworkRequestEntry[],
  filter?: {
    urlPattern?: string;
    method?: string;
    status?: number;
    hasError?: boolean;
  },
  limit?: number
): NetworkRequestEntry[] {
  let filtered = requests;
  if (filter) {
    if (filter.urlPattern) {
      const regex = new RegExp(filter.urlPattern);
      filtered = filtered.filter((r) => regex.test(r.url));
    }
    if (filter.method) {
      filtered = filtered.filter((r) => r.method === filter.method);
    }
    if (filter.status !== undefined) {
      filtered = filtered.filter((r) => r.status === filter.status);
    }
    if (filter.hasError !== undefined) {
      filtered = filter.hasError
        ? filtered.filter((r) => r.status >= 400 || r.error)
        : filtered.filter((r) => r.status < 400 && !r.error);
    }
  }
  if (limit && limit > 0) {
    filtered = filtered.slice(-limit);
  }
  return filtered;
}

// ====== HMR (not available for external sites) ======

export function getHMRStatus() {
  return {
    connected: false,
    lastUpdate: null,
    errors: [],
    updates: [],
    totalUpdates: 0,
    averageLatency: 0,
    note: 'HMR is not available for external websites. HMR requires a Vite dev server.',
  };
}

export function clearHMRErrors() {
  return { note: 'No HMR errors to clear on external websites.' };
}

// ====== Component Tree ======

export async function getComponentTree(
  page: Page,
  selector?: string,
  maxDepth: number = 10,
  _framework: string = 'auto'
) {
  return await page.evaluate(
    ({
      selector,
      maxDepth,
    }: {
      selector?: string;
      maxDepth: number;
    }) => {
      const rootEl =
        (selector ? document.querySelector(selector) : null) ||
        document.getElementById('root') ||
        document.getElementById('app') ||
        document.getElementById('__next') ||
        document.body;

      if (!rootEl) {
        return { error: `Root element not found${selector ? `: ${selector}` : ''}` };
      }

      // Try to detect framework
      function detectFramework(el: Element): string {
        const candidates = [el, ...Array.from(el.querySelectorAll('*')).slice(0, 50)];
        for (const c of candidates) {
          const keys = Object.keys(c);
          if (keys.some((k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'))) {
            return 'react';
          }
          if ((c as any).__vue_app__ || (c as any).__vue__) return 'vue';
          if (keys.some((k) => k.startsWith('__svelte'))) return 'svelte';
        }
        return 'unknown';
      }

      const framework = detectFramework(rootEl);

      // For external sites, production builds strip framework internals
      // Fall back to DOM tree
      function getDOMTree(el: Element, depth: number): any {
        if (depth > maxDepth) return null;

        const node: any = {
          name: el.tagName.toLowerCase(),
          type: 'element',
        };

        if (el.id) node.id = el.id;
        if (el.className && typeof el.className === 'string') {
          const cls = el.className.trim();
          if (cls) node.classes = cls;
        }

        // Try to extract text content (leaf nodes only)
        if (el.children.length === 0 && (el as HTMLElement).innerText) {
          const text = (el as HTMLElement).innerText.trim();
          if (text && text.length <= 100) node.text = text;
        }

        const children: any[] = [];
        for (const child of Array.from(el.children).slice(0, 20)) {
          const childNode = getDOMTree(child, depth + 1);
          if (childNode) children.push(childNode);
        }

        if (children.length > 0) node.children = children;
        return node;
      }

      // Try React fiber walking for dev builds
      if (framework === 'react') {
        // Check for fiber on root or children
        let fiberKey: string | undefined;
        let fiberEl: Element | null = null;

        // Check __reactContainer$ (React 18 createRoot)
        const containerKey = Object.keys(rootEl).find((k) => k.startsWith('__reactContainer$'));
        if (containerKey) {
          const fiber = (rootEl as any)[containerKey];
          if (fiber) {
            try {
              function walkFiber(f: any, depth: number): any {
                if (!f || depth > maxDepth) return null;
                const isComponent = typeof f.type === 'function' || typeof f.type === 'object';
                const name = f.type?.displayName || f.type?.name || (typeof f.type === 'string' ? f.type : null);
                const node: any = {};
                if (name) node.name = name;
                node.type = isComponent ? 'component' : 'element';
                const children: any[] = [];
                let child = f.child;
                while (child) {
                  const cn = walkFiber(child, depth + 1);
                  if (cn) children.push(cn);
                  child = child.sibling;
                }
                if (children.length > 0) node.children = children;
                return node;
              }

              // Walk up to root
              let topFiber = fiber;
              while (topFiber.return) topFiber = topFiber.return;

              return { framework: 'react', tree: walkFiber(topFiber, 0) };
            } catch {
              // Fiber walking failed, fall through to DOM tree
            }
          }
        }

        // Check children for fiber
        for (const child of Array.from(rootEl.children).slice(0, 10)) {
          fiberKey = Object.keys(child).find(
            (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
          );
          if (fiberKey) {
            fiberEl = child;
            break;
          }
        }

        if (fiberKey && fiberEl) {
          try {
            const rootFiber = (fiberEl as any)[fiberKey];
            let topFiber = rootFiber;
            while (topFiber.return) topFiber = topFiber.return;

            function walkFiber2(f: any, depth: number): any {
              if (!f || depth > maxDepth) return null;
              const isComponent = typeof f.type === 'function' || typeof f.type === 'object';
              const name = f.type?.displayName || f.type?.name || (typeof f.type === 'string' ? f.type : null);
              const node: any = {};
              if (name) node.name = name;
              node.type = isComponent ? 'component' : 'element';
              const children: any[] = [];
              let child = f.child;
              while (child) {
                const cn = walkFiber2(child, depth + 1);
                if (cn) children.push(cn);
                child = child.sibling;
              }
              if (children.length > 0) node.children = children;
              return node;
            }

            return { framework: 'react', tree: walkFiber2(topFiber, 0) };
          } catch {
            // Fall through to DOM tree
          }
        }
      }

      return {
        framework: framework !== 'unknown' ? framework : 'none',
        note: 'Production builds typically strip framework internals. Showing DOM tree.',
        tree: getDOMTree(rootEl, 0),
      };
    },
    { selector, maxDepth }
  );
}

// ====== Accessibility Audit ======

export async function auditAccessibility(
  page: Page,
  selector?: string,
  tags?: string[]
) {
  // Inject axe-core if not already loaded
  const hasAxe = await page.evaluate(() => !!(window as any).axe);
  if (!hasAxe) {
    try {
      await page.addScriptTag({
        url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.4/axe.min.js',
      });
      await page.waitForFunction(() => !!(window as any).axe, { timeout: 10000 });
    } catch {
      // If CDN blocked by CSP, try evaluating axe inline
      return {
        error:
          'Could not load axe-core for accessibility audit. ' +
          "The page's Content Security Policy may be blocking external scripts.",
      };
    }
  }

  return await page.evaluate(
    ({ sel, tagList }: { sel?: string; tagList?: string[] }) => {
      const axe = (window as any).axe;
      if (!axe) return { error: 'axe-core not available' };

      const context = sel ? document.querySelector(sel) || document : document;
      const options: any = {};
      if (tagList && tagList.length > 0) {
        options.runOnly = { type: 'tag', values: tagList };
      }

      return axe.run(context, options).then((result: any) => ({
        violations: result.violations.map((v: any) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          tags: v.tags,
          nodes: v.nodes.slice(0, 5).map((n: any) => ({
            html: n.html?.substring(0, 200),
            target: n.target,
            failureSummary: n.failureSummary,
          })),
        })),
        passCount: result.passes?.length || 0,
        incompleteCount: result.incomplete?.length || 0,
        summary: `${result.violations.length} violations, ${result.passes?.length || 0} passes, ${result.incomplete?.length || 0} incomplete`,
      }));
    },
    { sel: selector, tagList: tags }
  );
}

// ====== Navigation ======

export async function getCurrentUrl(page: Page): Promise<string> {
  return page.url();
}
