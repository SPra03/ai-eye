# Contributing to VisionCraft

Thank you for your interest in contributing to VisionCraft! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

---

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

**Guidelines**:
- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- pnpm (recommended) or npm
- Git
- VS Code (recommended)
- Chrome/Chromium browser

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR-USERNAME/visioncraft.git
cd visioncraft
```

3. Add upstream remote:

```bash
git remote add upstream https://github.com/original-owner/visioncraft.git
```

---

## Development Setup

### 1. Install Dependencies

```bash
npx pnpm install
```

### 2. Build All Packages

```bash
npx pnpm build
```

### 3. Run Tests

```bash
npx vitest run
```

### 4. Start Example App

```bash
cd examples/react-vite-app
npx pnpm dev
```

### 5. Configure Claude Desktop

Follow the [Getting Started Guide](./docs/GETTING-STARTED.md#claude-desktop-integration) to set up the MCP server.

---

## Project Structure

```
visioncraft/
├── packages/
│   ├── extension/          # VS Code extension (future)
│   ├── mcp-server/         # MCP server for AI agents
│   ├── babel-plugin/       # Babel plugin for source mapping
│   ├── vite-plugin/        # Vite plugin for HMR & source mapping
│   └── bridge/             # Browser bridge script
├── examples/
│   └── react-vite-app/     # Example React app
├── docs/                   # Documentation
├── vitest.config.mts       # Test configuration
└── package.json            # Root workspace config
```

### Package Dependencies

```
bridge (standalone)
   ↓
vite-plugin (uses bridge)
   ↓
babel-plugin (used by vite-plugin)
   ↓
mcp-server (uses CDP to interact with bridge)
```

---

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `test/` - Test additions/updates
- `refactor/` - Code refactoring
- `perf/` - Performance improvements

### 2. Make Changes

Edit code in the appropriate package:

```bash
# For Babel plugin
cd packages/babel-plugin/src/

# For Vite plugin
cd packages/vite-plugin/src/

# For Bridge
cd packages/bridge/src/

# For MCP Server
cd packages/mcp-server/src/
```

### 3. Watch Mode

Use watch mode for rapid development:

```bash
# Watch all packages
npx pnpm dev

# Watch specific package
cd packages/vite-plugin
npm run dev
```

### 4. Test Your Changes

```bash
# Run all tests
npx vitest run

# Run tests in watch mode
npx vitest

# Run specific test file
npx vitest run packages/babel-plugin/src/index.test.ts

# Test with example app
cd examples/react-vite-app
npx pnpm dev
# Then test manually with Claude Desktop
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat(vite-plugin): add support for Vue 3"
```

See [Commit Messages](#commit-messages) for format guidelines.

---

## Testing

### Unit Tests

We use Vitest for unit testing:

```bash
# Run all tests
npx vitest run

# Watch mode
npx vitest

# With coverage
npx vitest --coverage
```

### Writing Tests

Create test files alongside source files:

```
packages/babel-plugin/src/
├── index.ts
└── index.test.ts
```

Test template:

```typescript
import { describe, it, expect } from 'vitest';
import myFunction from './index';

describe('My Feature', () => {
  describe('Specific Behavior', () => {
    it('should do something specific', () => {
      const result = myFunction('input');
      expect(result).toBe('expected');
    });

    it('should handle edge case', () => {
      const result = myFunction('');
      expect(result).toBeNull();
    });
  });
});
```

### Integration Testing

Test with the example app:

1. Build your changes
2. Start example app: `cd examples/react-vite-app && npx pnpm dev`
3. Configure Claude Desktop with MCP server
4. Test MCP tools through Claude

### Manual Testing Checklist

See [TESTING-CHECKLIST.md](./TESTING-CHECKLIST.md) for comprehensive manual testing procedures.

---

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Provide type annotations for public APIs
- Avoid `any` types (use `unknown` if necessary)
- Use strict mode

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Lint code
npx eslint .

# Format code
npx prettier --write .
```

### File Organization

```typescript
// 1. Imports (external, then internal)
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { getBrowserClient } from './browser-client.js';

// 2. Type definitions
interface MyOptions {
  enabled: boolean;
}

// 3. Constants
const DEFAULT_OPTIONS: MyOptions = {
  enabled: true,
};

// 4. Helper functions (private)
function helper() {
  // ...
}

// 5. Main implementation (public)
export function myFunction(options: MyOptions) {
  // ...
}

// 6. Export types
export type { MyOptions };
```

### Naming Conventions

- **Files**: kebab-case (`my-file.ts`)
- **Classes**: PascalCase (`MyClass`)
- **Functions**: camelCase (`myFunction`)
- **Constants**: UPPER_SNAKE_CASE (`MY_CONSTANT`)
- **Interfaces**: PascalCase (`MyInterface`)
- **Types**: PascalCase (`MyType`)

### Comments

Use JSDoc for public APIs:

```typescript
/**
 * Inspect an element and get its source location
 * @param selector - CSS selector for the element
 * @returns Element details or error
 */
export function inspectElement(selector: string): Result {
  // ...
}
```

---

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Other changes (dependencies, etc.)

### Scopes

- `babel-plugin`
- `vite-plugin`
- `bridge`
- `mcp-server`
- `extension`
- `docs`
- `examples`

### Examples

```
feat(vite-plugin): add support for Vue 3 components

Add transformation support for Vue 3 SFC files.
Includes tests and documentation.

Closes #123
```

```
fix(bridge): handle elements without source mapping

Previously threw error when sourceFile was null.
Now returns null gracefully.

Fixes #456
```

```
docs(api): update MCP tools reference

Added examples for all 14 MCP tools.
Clarified error handling behavior.
```

---

## Pull Request Process

### 1. Update Your Branch

```bash
git fetch upstream
git rebase upstream/main
```

### 2. Run Tests

```bash
npx vitest run
```

### 3. Update Documentation

- Update API docs if adding/changing public APIs
- Update README if changing user-facing behavior
- Add examples if introducing new features

### 4. Create Pull Request

1. Push your branch to your fork:

```bash
git push origin feature/your-feature-name
```

2. Open PR on GitHub
3. Fill out the PR template
4. Link related issues

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Example app tested

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass
```

### 5. Review Process

- Maintainers will review your PR
- Address feedback in new commits
- Don't force-push during review
- Squash commits before merge (if requested)

### 6. Merge

Once approved:
- Maintainer will merge your PR
- Delete your branch after merge

---

## Release Process

(For maintainers)

### 1. Version Bump

```bash
# Update version in package.json files
npm version patch  # or minor, or major

# Update CHANGELOG.md
```

### 2. Build

```bash
npx pnpm build
```

### 3. Test

```bash
npx vitest run
```

### 4. Tag

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 5. Publish

```bash
# Publish to npm
cd packages/babel-plugin && npm publish
cd packages/vite-plugin && npm publish
cd packages/bridge && npm publish
cd packages/mcp-server && npm publish
```

### 6. GitHub Release

Create release on GitHub with:
- Release notes from CHANGELOG
- Binary assets (if any)
- Installation instructions

---

## Architecture Guidelines

### Adding a New Package

1. Create directory: `packages/my-package/`
2. Add `package.json` with workspace config
3. Add to root `package.json` workspace
4. Add build script
5. Add tests
6. Add documentation

### Adding a New MCP Tool

1. Define tool schema in `packages/mcp-server/src/index.ts`
2. Add handler function
3. Add integration with browser client
4. Add tests
5. Update API documentation
6. Add to manual testing checklist

### Adding Framework Support

1. Update Vite plugin transformation logic
2. Add framework-specific tests
3. Create example app
4. Update documentation

---

## Code Review Guidelines

### For Authors

- Keep PRs focused (one feature/fix per PR)
- Write clear descriptions
- Add tests for new code
- Update documentation
- Respond to feedback promptly

### For Reviewers

- Be constructive and respectful
- Focus on logic, not style (use linter)
- Ask questions, don't demand changes
- Approve when ready, request changes if needed
- Test manually if possible

---

## Getting Help

- **Questions**: Open a [Discussion](https://github.com/your-username/visioncraft/discussions)
- **Bugs**: Open an [Issue](https://github.com/your-username/visioncraft/issues)
- **Security**: Email security@visioncraft.dev (do not open public issue)

---

## License

By contributing to VisionCraft, you agree that your contributions will be licensed under the MIT License.

---

## Attribution

This Contributing Guide was inspired by:
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Contributing Guide](https://github.com/angular/angular/blob/main/CONTRIBUTING.md)
- [Atom Contributing Guide](https://github.com/atom/atom/blob/master/CONTRIBUTING.md)

---

Thank you for contributing to VisionCraft! 🚀
