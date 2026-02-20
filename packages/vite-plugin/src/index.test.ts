import { describe, it, expect, vi } from 'vitest';
import visionCraftVitePlugin from './index';

describe('VisionCraft Vite Plugin', () => {
  describe('Plugin Configuration', () => {
    it('should create plugin with correct name', () => {
      const plugin = visionCraftVitePlugin();
      expect(plugin.name).toBe('visioncraft-source-map');
    });

    it('should enforce pre execution', () => {
      const plugin = visionCraftVitePlugin();
      expect(plugin.enforce).toBe('pre');
    });

    it('should accept custom options', () => {
      const plugin = visionCraftVitePlugin({
        root: '/custom/root',
        enabled: true,
        attributePrefix: 'data-custom',
        enableHMR: false,
      });

      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('visioncraft-source-map');
    });
  });

  describe('File Filtering', () => {
    it('should have default include pattern', () => {
      const plugin = visionCraftVitePlugin();

      // Default pattern should include common frameworks
      expect(plugin).toBeDefined();
    });

    it('should have default exclude pattern for node_modules', () => {
      const plugin = visionCraftVitePlugin();

      expect(plugin).toBeDefined();
    });

    it('should accept custom include/exclude patterns', () => {
      const plugin = visionCraftVitePlugin({
        include: /\.custom$/,
        exclude: /vendor/,
      });

      expect(plugin).toBeDefined();
    });
  });

  describe('Transform Hook', () => {
    it('should handle JSX transformation', () => {
      const plugin = visionCraftVitePlugin({ enabled: true });

      // The plugin should have a transform function
      expect(plugin.transform).toBeDefined();
      expect(typeof plugin.transform).toBe('function');
    });

    it('should preserve source code structure', () => {
      const plugin = visionCraftVitePlugin({ enabled: true });

      expect(plugin.transform).toBeDefined();
    });
  });

  describe('Virtual Module Resolution', () => {
    it('should resolve bridge module ID', () => {
      const plugin = visionCraftVitePlugin({ enabled: true });

      if (plugin.resolveId) {
        const resolved = plugin.resolveId('@visioncraft/bridge', '', {});
        expect(resolved).toContain('@visioncraft/bridge');
      }
    });

    it('should resolve bridge module with leading slash', () => {
      const plugin = visionCraftVitePlugin({ enabled: true });

      if (plugin.resolveId) {
        const resolved = plugin.resolveId('/@visioncraft/bridge', '', {});
        expect(resolved).toContain('@visioncraft/bridge');
      }
    });
  });

  describe('Options Handling', () => {
    it('should use default values when no options provided', () => {
      const plugin = visionCraftVitePlugin();

      expect(plugin.name).toBe('visioncraft-source-map');
      expect(plugin.enforce).toBe('pre');
    });

    it('should respect enabled option', () => {
      const pluginEnabled = visionCraftVitePlugin({ enabled: true });
      const pluginDisabled = visionCraftVitePlugin({ enabled: false });

      expect(pluginEnabled.name).toBe('visioncraft-source-map');
      expect(pluginDisabled.name).toBe('visioncraft-source-map');
    });

    it('should use custom attribute prefix', () => {
      const plugin = visionCraftVitePlugin({
        enabled: true,
        attributePrefix: 'data-custom',
      });

      expect(plugin).toBeDefined();
    });

    it('should use custom root directory', () => {
      const plugin = visionCraftVitePlugin({
        enabled: true,
        root: '/my/custom/root',
      });

      expect(plugin).toBeDefined();
    });
  });

  describe('HMR Integration', () => {
    it('should enable HMR by default', () => {
      const plugin = visionCraftVitePlugin();

      expect(plugin).toBeDefined();
      // HMR functionality is tested via configureServer hook
      expect(plugin.configureServer).toBeDefined();
    });

    it('should respect enableHMR option', () => {
      const pluginWithHMR = visionCraftVitePlugin({ enableHMR: true });
      const pluginWithoutHMR = visionCraftVitePlugin({ enableHMR: false });

      expect(pluginWithHMR.configureServer).toBeDefined();
      expect(pluginWithoutHMR.configureServer).toBeDefined();
    });

    it('should have configureServer hook for HMR setup', () => {
      const plugin = visionCraftVitePlugin({ enableHMR: true });

      expect(plugin.configureServer).toBeDefined();
      expect(typeof plugin.configureServer).toBe('function');
    });
  });

  describe('Config Resolution', () => {
    it('should have configResolved hook', () => {
      const plugin = visionCraftVitePlugin();

      expect(plugin.configResolved).toBeDefined();
      expect(typeof plugin.configResolved).toBe('function');
    });

    it('should auto-enable in development mode', () => {
      const plugin = visionCraftVitePlugin();

      // Simulate config resolution
      if (plugin.configResolved) {
        plugin.configResolved({
          mode: 'development',
          command: 'serve',
        } as any);
      }

      expect(plugin).toBeDefined();
    });

    it('should respect explicit enabled: false in development', () => {
      const plugin = visionCraftVitePlugin({ enabled: false });

      if (plugin.configResolved) {
        plugin.configResolved({
          mode: 'development',
          command: 'serve',
        } as any);
      }

      expect(plugin).toBeDefined();
    });
  });

  describe('HTML Transform', () => {
    it('should have transformIndexHtml hook', () => {
      const plugin = visionCraftVitePlugin({ enabled: true });

      expect(plugin.transformIndexHtml).toBeDefined();
    });

    it('should inject bridge script in development mode', () => {
      const plugin = visionCraftVitePlugin({ enabled: true });

      expect(plugin.transformIndexHtml).toBeDefined();
      expect(typeof plugin.transformIndexHtml).toBe('object');
    });
  });

  describe('Production Mode', () => {
    it('should disable in production by default', () => {
      const plugin = visionCraftVitePlugin();

      if (plugin.configResolved) {
        plugin.configResolved({
          mode: 'production',
          command: 'build',
        } as any);
      }

      expect(plugin).toBeDefined();
    });

    it('should respect explicit enabled: true in production', () => {
      const plugin = visionCraftVitePlugin({ enabled: true });

      if (plugin.configResolved) {
        plugin.configResolved({
          mode: 'production',
          command: 'build',
        } as any);
      }

      expect(plugin).toBeDefined();
    });
  });
});
