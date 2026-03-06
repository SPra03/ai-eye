import { PluginObj, types as t, NodePath } from '@babel/core';
import * as path from 'path';

export interface AIEyeBabelPluginOptions {
  /**
   * Root directory for relative path calculation
   * Defaults to process.cwd()
   */
  root?: string;

  /**
   * Enable/disable the plugin
   * Defaults to true
   */
  enabled?: boolean;

  /**
   * Custom attribute prefix (default: 'data-ae')
   */
  attributePrefix?: string;
}

/**
 * Babel plugin for AI Eye source mapping
 * Injects data-ae-source, data-ae-line, data-ae-col attributes into JSX elements
 */
export default function aiEyeBabelPlugin(
  babel: typeof import('@babel/core')
): PluginObj {
  const { types: t } = babel;

  return {
    name: 'aieye-source-map',
    visitor: {
      JSXOpeningElement(nodePath: NodePath<t.JSXOpeningElement>, state: any) {
        try {
          const options: AIEyeBabelPluginOptions = state.opts || {};

          // Check if plugin is enabled
          if (options.enabled === false) {
            return;
          }

          // Get source location
          const loc = nodePath.node.loc;
          if (!loc) {
            return;
          }

          // Get filename
          const filename = state.filename || state.file?.opts?.filename || 'unknown';
          if (filename === 'unknown') {
            return;
          }

          // Skip node_modules
          if (filename.includes('node_modules')) {
            return;
          }

          // Calculate relative path
          const root = options.root || process.cwd();
          const relPath = path.relative(root, filename);

          // Get attribute prefix
          const prefix = options.attributePrefix || 'data-ae';

          // Check if already has source mapping attributes
          const attributes = nodePath.node.attributes;
          const hasSourceAttr = attributes.some(
            (attr) =>
              t.isJSXAttribute(attr) &&
              t.isJSXIdentifier(attr.name) &&
              attr.name.name === `${prefix}-source`
          );

          if (hasSourceAttr) {
            // Already tagged, skip
            return;
          }

          // Skip fragments
          const elementName = nodePath.node.name;
          if (t.isJSXIdentifier(elementName)) {
            // Skip React.Fragment or <>
            if (elementName.name === 'Fragment') {
              return;
            }
          }

          // Create source mapping attributes
          const sourceAttr = t.jsxAttribute(
            t.jsxIdentifier(`${prefix}-source`),
            t.stringLiteral(relPath)
          );

          const lineAttr = t.jsxAttribute(
            t.jsxIdentifier(`${prefix}-line`),
            t.stringLiteral(String(loc.start.line))
          );

          const colAttr = t.jsxAttribute(
            t.jsxIdentifier(`${prefix}-col`),
            t.stringLiteral(String(loc.start.column))
          );

          // Find position to insert attributes (before spreads)
          let insertIndex = 0;
          for (let i = 0; i < attributes.length; i++) {
            if (t.isJSXSpreadAttribute(attributes[i])) {
              break;
            }
            insertIndex = i + 1;
          }

          // Insert attributes
          attributes.splice(insertIndex, 0, sourceAttr, lineAttr, colAttr);
        } catch (error) {
          // Silently skip on error to avoid breaking the build
          // Log to console in development or tests for debugging
          if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
            console.warn('[AI Eye Babel] Failed to add source mapping:', error);
          }
        }
      },
    },
  };
}
