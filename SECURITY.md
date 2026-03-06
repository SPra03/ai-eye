# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in AI Eye, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

1. **Preferred**: Use [GitHub Security Advisories](https://github.com/SPra03/ai-eye/security/advisories/new) to report privately.
2. **Alternative**: Email the maintainers directly (see GitHub profile for contact info).

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix timeline**: Depends on severity, typically within 2 weeks for critical issues

### Scope

The following are in scope:
- `aieye` (MCP server package)
- `@ai-eye/vite-plugin`
- `@ai-eye/babel-plugin`
- The VS Code extension
- The bridge script injected into web pages

### Out of Scope

- Vulnerabilities in dependencies (report upstream)
- Issues requiring physical access to the machine
- Social engineering attacks

## Disclosure Policy

We follow coordinated disclosure. We ask that you:
1. Give us reasonable time to fix the issue before public disclosure
2. Make a good faith effort to avoid privacy violations and data destruction
3. Do not exploit the vulnerability beyond what is necessary to demonstrate it
