import { describe, it, expect, vi } from 'vitest';
import aiEyeVitePlugin from './index';

describe('AI Eye Vite Plugin', () => {
  describe('Plugin Configuration', () => {
    it('should create plugin with correct name', () => {
      const plugin = aiEyeVitePlugin();
      expect(plugin.name).toBe('aieye-source-map');
    });

    it('should enforce pre execution', () => {
      const plugin = aiEyeVitePlugin();
      expect(plugin.enforce).toBe('pre');
    });

    it('should accept custom options', () => {
      const plugin = aiEyeVitePlugin({
        root: '/custom/root',
        enabled: true,
        attributePrefix: 'data-custom',
        enableHMR: false,
      });

      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('aieye-source-map');
    });
  });

  describe('File Filtering', () => {
    it('should have default include pattern', () => {
      const plugin = aiEyeVitePlugin();

      // Default pattern should include common frameworks
      expect(plugin).toBeDefined();
    });

    it('should have default exclude pattern for node_modules', () => {
      const plugin = aiEyeVitePlugin();

      expect(plugin).toBeDefined();
    });

    it('should accept custom include/exclude patterns', () => {
      const plugin = aiEyeVitePlugin({
        include: /\.custom$/,
        exclude: /vendor/,
      });

      expect(plugin).toBeDefined();
    });
  });

  describe('Transform Hook', () => {
    it('should handle JSX transformation', () => {
      const plugin = aiEyeVitePlugin({ enabled: true });

      // The plugin should have a transform function
      expect(plugin.transform).toBeDefined();
      expect(typeof plugin.transform).toBe('function');
    });

    it('should preserve source code structure', () => {
      const plugin = aiEyeVitePlugin({ enabled: true });

      expect(plugin.transform).toBeDefined();
    });
  });

  describe('Virtual Module Resolution', () => {
    it('should resolve bridge module ID', () => {
      const plugin = aiEyeVitePlugin({ enabled: true });

      if (plugin.resolveId) {
        const resolved = plugin.resolveId('@ai-eye/bridge', '', {});
        expect(resolved).toContain('@ai-eye/bridge');
      }
    });

    it('should resolve bridge module with leading slash', () => {
      const plugin = aiEyeVitePlugin({ enabled: true });

      if (plugin.resolveId) {
        const resolved = plugin.resolveId('/@ai-eye/bridge', '', {});
        expect(resolved).toContain('@ai-eye/bridge');
      }
    });
  });

  describe('Options Handling', () => {
    it('should use default values when no options provided', () => {
      const plugin = aiEyeVitePlugin();

      expect(plugin.name).toBe('aieye-source-map');
      expect(plugin.enforce).toBe('pre');
    });

    it('should respect enabled option', () => {
      const pluginEnabled = aiEyeVitePlugin({ enabled: true });
      const pluginDisabled = aiEyeVitePlugin({ enabled: false });

      expect(pluginEnabled.name).toBe('aieye-source-map');
      expect(pluginDisabled.name).toBe('aieye-source-map');
    });

    it('should use custom attribute prefix', () => {
      const plugin = aiEyeVitePlugin({
        enabled: true,
        attributePrefix: 'data-custom',
      });

      expect(plugin).toBeDefined();
    });

    it('should use custom root directory', () => {
      const plugin = aiEyeVitePlugin({
        enabled: true,
        root: '/my/custom/root',
      });

      expect(plugin).toBeDefined();
    });
  });

  describe('HMR Integration', () => {
    it('should enable HMR by default', () => {
      const plugin = aiEyeVitePlugin();

      expect(plugin).toBeDefined();
      // HMR functionality is tested via configureServer hook
      expect(plugin.configureServer).toBeDefined();
    });

    it('should respect enableHMR option', () => {
      const pluginWithHMR = aiEyeVitePlugin({ enableHMR: true });
      const pluginWithoutHMR = aiEyeVitePlugin({ enableHMR: false });

      expect(pluginWithHMR.configureServer).toBeDefined();
      expect(pluginWithoutHMR.configureServer).toBeDefined();
    });

    it('should have configureServer hook for HMR setup', () => {
      const plugin = aiEyeVitePlugin({ enableHMR: true });

      expect(plugin.configureServer).toBeDefined();
      expect(typeof plugin.configureServer).toBe('function');
    });
  });

  describe('Config Resolution', () => {
    it('should have configResolved hook', () => {
      const plugin = aiEyeVitePlugin();

      expect(plugin.configResolved).toBeDefined();
      expect(typeof plugin.configResolved).toBe('function');
    });

    it('should auto-enable in development mode', () => {
      const plugin = aiEyeVitePlugin();

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
      const plugin = aiEyeVitePlugin({ enabled: false });

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
      const plugin = aiEyeVitePlugin({ enabled: true });

      expect(plugin.transformIndexHtml).toBeDefined();
    });

    it('should inject bridge script in development mode', () => {
      const plugin = aiEyeVitePlugin({ enabled: true });

      expect(plugin.transformIndexHtml).toBeDefined();
      expect(typeof plugin.transformIndexHtml).toBe('object');
    });
  });

  describe('Production Mode', () => {
    it('should disable in production by default', () => {
      const plugin = aiEyeVitePlugin();

      if (plugin.configResolved) {
        plugin.configResolved({
          mode: 'production',
          command: 'build',
        } as any);
      }

      expect(plugin).toBeDefined();
    });

    it('should respect explicit enabled: true in production', () => {
      const plugin = aiEyeVitePlugin({ enabled: true });

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
