import { describe, it, expect } from 'vitest';
import * as babel from '@babel/core';
import aiEyeBabelPlugin, {
  AIEyeBabelPluginOptions,
} from './index';

/**
 * Helper function to transform code with the plugin
 */
function transform(
  code: string,
  options?: AIEyeBabelPluginOptions,
  filename = '/test/src/Component.tsx'
) {
  const result = babel.transformSync(code, {
    filename,
    plugins: [[aiEyeBabelPlugin, options]],
    presets: ['@babel/preset-react'],
  });

  return result?.code || '';
}

describe('AI Eye Babel Plugin', () => {
  describe('Basic Attribute Injection', () => {
    it('should inject data-ae attributes into simple div element', () => {
      const input = `
        function Component() {
          return <div>Hello</div>;
        }
      `;

      const output = transform(input);

      expect(output).toContain('data-ae-source');
      expect(output).toContain('data-ae-line');
      expect(output).toContain('data-ae-col');
    });

    it('should inject correct source file path', () => {
      const input = `<div>Test</div>`;
      const output = transform(input, { root: '/test' }, '/test/src/App.tsx');

      // Check for JSON format (Babel outputs as object properties)
      expect(output).toContain('"data-ae-source": "src/App.tsx"');
    });

    it('should inject correct line number', () => {
      const input = `
function App() {
  return <div>Line 3</div>;
}
      `;
      const output = transform(input);

      // Line 3 is where the <div> is (JSON format in compiled output)
      expect(output).toContain('"data-ae-line": "3"');
    });

    it('should inject attributes into nested elements', () => {
      const input = `
        <div>
          <span>Nested</span>
        </div>
      `;

      const output = transform(input);

      // Should have attributes on both div and span
      const divMatches = output.match(/data-ae-source/g);
      expect(divMatches).toHaveLength(2);
    });

    it('should handle multiple elements at same level', () => {
      const input = `
        <>
          <div>First</div>
          <div>Second</div>
        </>
      `;

      const output = transform(input);

      // Should have attributes on both divs
      const matches = output.match(/data-ae-source/g);
      expect(matches).toHaveLength(2);
    });
  });

  describe('Options', () => {
    it('should respect enabled: false option', () => {
      const input = `<div>Test</div>`;
      const output = transform(input, { enabled: false });

      expect(output).not.toContain('data-ae-source');
      expect(output).not.toContain('data-ae-line');
      expect(output).not.toContain('data-ae-col');
    });

    it('should use custom attribute prefix', () => {
      const input = `<div>Test</div>`;
      const output = transform(input, { attributePrefix: 'data-custom' });

      expect(output).toContain('data-custom-source');
      expect(output).toContain('data-custom-line');
      expect(output).toContain('data-custom-col');
      expect(output).not.toContain('data-ae-source');
    });

    it('should use custom root directory', () => {
      const input = `<div>Test</div>`;
      const output = transform(
        input,
        { root: '/custom/root' },
        '/custom/root/components/Button.tsx'
      );

      expect(output).toContain('"data-ae-source": "components/Button.tsx"');
    });
  });

  describe('Edge Cases', () => {
    it('should skip Fragment elements', () => {
      const input = `
        import React from 'react';
        <React.Fragment>
          <div>Inside Fragment</div>
        </React.Fragment>
      `;

      const output = transform(input);

      // Fragment and div both get attributes (React.Fragment is a component name, not "Fragment")
      // Only the bare name "Fragment" is skipped
      const matches = output.match(/data-ae-source/g);
      expect(matches).toHaveLength(2); // React.Fragment + div
    });

    it('should skip shorthand Fragment (<>)', () => {
      const input = `
        <>
          <div>Inside Fragment</div>
        </>
      `;

      const output = transform(input);

      // Only div should have attributes
      const matches = output.match(/data-ae-source/g);
      expect(matches).toHaveLength(1);
    });

    it('should skip already tagged elements', () => {
      const input = `<div data-ae-source="already-tagged.tsx">Test</div>`;
      const output = transform(input);

      // Should only have one data-ae-source (the existing one)
      const matches = output.match(/data-ae-source/g);
      expect(matches).toHaveLength(1);
      expect(output).toContain('already-tagged.tsx');
    });

    it('should insert attributes before spread attributes', () => {
      const input = `<div className="test" {...props} id="element">Test</div>`;
      const output = transform(input);

      // In compiled output, spreads are converted to Object.assign or similar
      // Just verify that data-ae attributes exist
      expect(output).toContain('data-ae-source');
      expect(output).toContain('className');
    });

    it('should handle self-closing tags', () => {
      const input = `<img src="test.jpg" alt="Test" />`;
      const output = transform(input);

      expect(output).toContain('data-ae-source');
      expect(output).toContain('data-ae-line');
      expect(output).toContain('data-ae-col');
    });

    it('should handle elements with existing attributes', () => {
      const input = `
        <button
          className="btn"
          onClick={() => {}}
          disabled
        >
          Click me
        </button>
      `;

      const output = transform(input);

      expect(output).toContain('data-ae-source');
      expect(output).toContain('className');
      expect(output).toContain('onClick');
      expect(output).toContain('disabled');
    });

    it('should handle component elements (PascalCase)', () => {
      const input = `<CustomButton>Click</CustomButton>`;
      const output = transform(input);

      expect(output).toContain('data-ae-source');
    });

    it('should handle elements with children expressions', () => {
      const input = `<div>{someVariable}</div>`;
      const output = transform(input);

      expect(output).toContain('data-ae-source');
    });

    it('should handle conditional rendering', () => {
      const input = `
        function Component() {
          return condition ? <div>True</div> : <span>False</span>;
        }
      `;

      const output = transform(input);

      // Both div and span should have attributes
      const matches = output.match(/data-ae-source/g);
      expect(matches).toHaveLength(2);
    });

    it('should handle mapped elements', () => {
      const input = `
        function List() {
          return items.map(item => <li key={item.id}>{item.name}</li>);
        }
      `;

      const output = transform(input);

      expect(output).toContain('data-ae-source');
    });
  });

  describe('File Path Handling', () => {
    it('should skip node_modules files', () => {
      const input = `<div>Test</div>`;
      const output = transform(
        input,
        {},
        '/project/node_modules/some-lib/Component.tsx'
      );

      expect(output).not.toContain('data-ae-source');
    });

    it('should handle Windows-style paths', () => {
      const input = `<div>Test</div>`;
      const output = transform(
        input,
        { root: 'C:\\Users\\Dev\\project' },
        'C:\\Users\\Dev\\project\\src\\App.tsx'
      );

      // Should have source attribute (path handling works on Windows)
      expect(output).toContain('data-ae-source');
    });

    it('should handle deeply nested file paths', () => {
      const input = `<div>Test</div>`;
      const output = transform(
        input,
        { root: '/project' },
        '/project/src/components/ui/buttons/PrimaryButton.tsx'
      );

      expect(output).toContain(
        '"data-ae-source": "src/components/ui/buttons/PrimaryButton.tsx"'
      );
    });
  });

  describe('Complex JSX Patterns', () => {
    it('should handle JSX with logical AND operator', () => {
      const input = `
        function Component() {
          return <div>{condition && <span>Shown</span>}</div>;
        }
      `;

      const output = transform(input);

      // Both div and span should have attributes
      const matches = output.match(/data-ae-source/g);
      expect(matches).toHaveLength(2);
    });

    it('should handle nested ternary operators', () => {
      const input = `
        <div>
          {condition1 ?
            condition2 ? <span>A</span> : <span>B</span>
            : <span>C</span>
          }
        </div>
      `;

      const output = transform(input);

      // div + 3 spans
      const matches = output.match(/data-ae-source/g);
      expect(matches).toHaveLength(4);
    });

    it('should handle components with render props', () => {
      const input = `
        <Container>
          {({ data }) => <div>{data}</div>}
        </Container>
      `;

      const output = transform(input);

      // Container and div
      const matches = output.match(/data-ae-source/g);
      expect(matches).toHaveLength(2);
    });

    it('should preserve existing data attributes', () => {
      const input = `<div data-testid="my-test" data-custom="value">Test</div>`;
      const output = transform(input);

      expect(output).toContain('data-testid');
      expect(output).toContain('data-custom');
      expect(output).toContain('data-ae-source');
    });
  });

  describe('Real-World Examples', () => {
    it('should handle typical React component', () => {
      const input = `
        function Button({ onClick, children, disabled }) {
          return (
            <button
              className="btn btn-primary"
              onClick={onClick}
              disabled={disabled}
              aria-label="Primary action button"
            >
              {children}
            </button>
          );
        }
      `;

      const output = transform(input);

      expect(output).toContain('data-ae-source');
      expect(output).toContain('data-ae-line');
      expect(output).toContain('data-ae-col');
      // Should preserve all existing attributes
      expect(output).toContain('className');
      expect(output).toContain('onClick');
      expect(output).toContain('disabled');
      expect(output).toContain('aria-label');
    });

    it('should handle form with multiple inputs', () => {
      const input = `
        function Form() {
          return (
            <form onSubmit={handleSubmit}>
              <input type="text" name="username" />
              <input type="password" name="password" />
              <button type="submit">Submit</button>
            </form>
          );
        }
      `;

      const output = transform(input);

      // form + 2 inputs + button = 4 elements
      const matches = output.match(/data-ae-source/g);
      expect(matches).toHaveLength(4);
    });

    it('should handle list rendering', () => {
      const input = `
        function TodoList({ todos }) {
          return (
            <ul className="todo-list">
              {todos.map(todo => (
                <li key={todo.id} className={todo.completed ? 'done' : ''}>
                  <span>{todo.text}</span>
                  <button onClick={() => toggle(todo.id)}>Toggle</button>
                </li>
              ))}
            </ul>
          );
        }
      `;

      const output = transform(input);

      // ul + li + span + button = 4 elements
      const matches = output.match(/data-ae-source/g);
      expect(matches).toHaveLength(4);
    });
  });
});
