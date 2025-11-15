# Rebranding Plan: Varun Israni Claude Tester

**Project Status**: claude-code-test-runner → **Varun Israni Claude Tester**
**Date**: 2025-11-15
**Repository**: varunisrani/skills-claude

---

## Executive Summary

This document outlines the complete rebranding strategy for transforming the claude-code-test-runner into **Varun Israni Claude Tester** (VICT). The rebrand will establish a unique identity while maintaining all technical capabilities and improving user experience.

---

## 1. Naming Strategy

### 1.1 Primary Names

| Component | Current Name | New Name |
|-----------|--------------|----------|
| **Project Name** | claude-code-test-runner | varun-israni-claude-tester |
| **CLI Tool** | cc-test-runner | vict (Varun Israni Claude Tester) |
| **Package Name** | claude-code-tests | varun-israni-claude-tester |
| **MCP Server** | test-state-server | vict-state-server |
| **Docker Image** | ghcr.io/firstloophq/claude-code-test-runner | ghcr.io/varunisrani/varun-israni-claude-tester |
| **CTRF Tool Name** | claude-code-tests | varun-israni-claude-tester |

### 1.2 Naming Rationale

- **vict**: Short, memorable CLI command (like `jest`, `vitest`)
- **Prefix consistency**: "vict-" prefix for related components (vict-state-server, vict-playwright)
- **Personal branding**: Maintains "Varun Israni" attribution throughout

---

## 2. File-by-File Changes

### 2.1 Root Directory

#### `/claude-code-test-runner/README.md`
**Changes Required:**
- Title: `# Claude Code Test Runner` → `# Varun Israni Claude Tester (VICT)`
- Description: Add attribution and branding
- CLI commands: `cc-test-runner` → `vict`
- Docker image: Update to new GHCR path
- Add "About the Author" section

**New Content Additions:**
```markdown
## About

**Varun Israni Claude Tester (VICT)** is an innovative E2E testing framework that leverages
Claude Code's AI capabilities to execute natural language test definitions. Created by Varun Israni.

### Why VICT?

VICT bridges the gap between traditional automated testing and manual QA by using AI to understand
context, adapt to UI changes, and execute tests like a human would.
```

#### `/claude-code-test-runner/Dockerfile`
**Changes Required:**
- Comments: Update project references
- Final binary path: `/app/cc-test-runner` → `/app/vict`

#### `/claude-code-test-runner/.github/workflows/sample-tests-action.yml`
**Changes Required:**
- Job name: `test-action` → `vict-test-action`
- Image: `ghcr.io/${{ github.repository }}` (will auto-update with repo name)
- Command: `/app/cc-test-runner` → `/app/vict`

#### `/claude-code-test-runner/.github/workflows/build-and-publish.yml`
**Changes Required:**
- Image naming already uses `${{ github.repository }}` (auto-updates)
- Add workflow name: `Build and Publish VICT`

### 2.2 CLI Directory (`/claude-code-test-runner/cli/`)

#### `package.json`
**Changes Required:**
```json
{
  "name": "varun-israni-claude-tester",
  "version": "1.0.0",
  "description": "AI-powered E2E testing with Claude Code by Varun Israni",
  "author": "Varun Israni",
  "repository": {
    "type": "git",
    "url": "https://github.com/varunisrani/varun-israni-claude-tester.git"
  },
  "private": false,
  "scripts": {
    "build": "bun build --compile ./src/index.ts --outfile ./dist/vict --target bun"
  }
}
```

#### `src/mcp/test-state/server.ts`
**Changes Required:**
```typescript
// Line 28-30
this.mcpServer = new Server({
    name: "vict-state-server",
    version: "1.0.0",
}, ...);
```

#### `src/prompts/start-test.ts`
**Changes Required:**
```typescript
// MCP server naming (lines 26-43)
mcpServers: {
    "vict-playwright": {
        command: "bunx",
        args: ["@playwright/mcp@v0.0.31", ...]
    },
    "vict-state": {
        type: "http",
        url: "http://localhost:3001/",
        ...
    }
},
allowedTools: [
    // Playwright MCP tools
    "mcp__vict-playwright__browser_close",
    "mcp__vict-playwright__browser_resize",
    // ... (update all 22 tools)

    // State MCP tools
    "mcp__vict-state__get_test_plan",
    "mcp__vict-state__update_test_step",
]
```

#### `src/prompts/system.ts`
**Changes Required:**
```typescript
export const systemPrompt = () => `
You are a software tester using Varun Israni Claude Tester (VICT),
an AI-powered testing framework built with Playwright MCP.

You will be executing a test plan made available via the mcp__vict-state__get_test_plan tool.
Always ask for the test plan before executing any steps.

## Browser Actions
- Use the mcp__vict-playwright__* tools to interact with the browser to perform test steps.
  DO NOT USE ANY OTHER MCP TOOLS TO INTERACT WITH THE BROWSER.

## Test Execution State
- Use the mcp__vict-state__get_test_plan tool from the VICT State MCP server to get the current test plan.
- Use the mcp__vict-state__update_test_step tool from the VICT State MCP server to update test steps.
...
`;
```

#### `src/utils/test-reporter.ts`
**Changes Required:**
```typescript
// Line 63-65
tool: {
    name: "varun-israni-claude-tester",
    version: "1.0.0",
},
```

#### `src/utils/logger.ts`
**Changes Required:**
- Update any log messages referencing the old name
- Add header comment with attribution

### 2.3 Sample Files

#### `/claude-code-test-runner/samples/thisinto-e2e-tests.json`
**Changes Required:**
- Update file name to `vict-sample-tests.json`
- Update comments/descriptions to reference VICT

---

## 3. Branding & Visual Identity

### 3.1 Logo & Icon (Optional)

**Recommendation**: Create simple ASCII art or emoji branding
```
__     _____ ____ _____
\ \   / /_ _/ ___|_   _|
 \ \ / / | | |     | |
  \ V /  | | |___  | |
   \_/  |___\____| |_|

Varun Israni Claude Tester
```

### 3.2 Color Scheme (for documentation)

- **Primary**: Blue (#0066CC) - Trust, reliability
- **Accent**: Green (#00CC66) - Success, testing
- **Text**: Dark gray (#333333)

### 3.3 Tagline Options

1. "AI-Powered E2E Testing, Humanized"
2. "Natural Language Testing with Claude Code"
3. "Test Like a Human, Scale Like a Machine"
4. "Adaptive Testing for Modern Web Apps"

---

## 4. Documentation Updates

### 4.1 README.md Structure

```markdown
# Varun Israni Claude Tester (VICT)

> AI-Powered E2E Testing with Claude Code

[![Build Status](badge)]
[![License](badge)]
[![Version](badge)]

## What is VICT?

VICT is an innovative end-to-end testing framework that uses Claude Code to execute
natural language test definitions through browser automation...

## Features

- 🤖 **AI-Driven Testing**: Claude Code interprets natural language test steps
- 🎯 **Adaptive Execution**: Resilient to UI changes and transient issues
- 📊 **Comprehensive Reporting**: CTRF format + Markdown summaries
- 🐳 **Docker Ready**: Pre-built container images for CI/CD
- 🚀 **GitHub Actions**: Native integration with workflows

## Quick Start

### Installation

#### Option 1: NPM (Local)
```bash
npm install -g varun-israni-claude-tester
vict --testsPath=./tests.json
```

#### Option 2: Docker
```bash
docker run ghcr.io/varunisrani/varun-israni-claude-tester:latest \
  -v $(pwd)/tests.json:/tests.json \
  vict --testsPath=/tests.json
```

#### Option 3: GitHub Actions
```yaml
- uses: varunisrani/varun-israni-claude-tester@v1
  with:
    tests-path: ./e2e-tests.json
```

## Usage

### CLI

```bash
vict [options]
```

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--testsPath` | `-t` | string | Required | Path to test definitions JSON |
| `--resultsPath` | `-o` | string | `./results` | Output directory |
| `--verbose` | `-v` | boolean | false | Detailed logging |
| `--screenshots` | | boolean | false | Capture screenshots |
| `--maxTurns` | | number | 30 | Max AI interactions |
| `--model` | `-m` | string | default | Override AI model |

### Test Definition Format

```json
{
  "id": "login-test",
  "description": "Verify user login flow",
  "steps": [
    { "id": 1, "description": "Navigate to login page" },
    { "id": 2, "description": "Enter credentials" },
    { "id": 3, "description": "Verify successful login" }
  ]
}
```

## Architecture

[Include updated architecture diagram with VICT branding]

## About the Author

**Varun Israni** is a software engineer passionate about AI-driven development tools
and test automation. VICT was created to demonstrate how AI can make testing more
intuitive and adaptive.

- GitHub: [@varunisrani](https://github.com/varunisrani)
- Website: [varunisrani.com](https://varunisrani.com) (if applicable)

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please read CONTRIBUTING.md for guidelines.
```

### 4.2 New Files to Create

#### `CONTRIBUTING.md`
Guidelines for contributors, code style, PR process

#### `CODE_OF_CONDUCT.md`
Community standards and behavior expectations

#### `LICENSE`
MIT License with Varun Israni as copyright holder

#### `CHANGELOG.md`
Version history starting with v1.0.0

---

## 5. GitHub Repository Configuration

### 5.1 Repository Settings

**Repository Name**: `varun-israni-claude-tester` (or `vict`)

**Description**:
```
🤖 AI-Powered E2E Testing with Claude Code | Natural language test definitions | Adaptive browser automation
```

**Topics/Tags**:
- `testing`
- `e2e-testing`
- `claude-code`
- `playwright`
- `ai-testing`
- `test-automation`
- `mcp`
- `model-context-protocol`

**Website**: GitHub Pages with documentation

### 5.2 Branch Protection

- **Main branch**: Require PR reviews, status checks
- **Semantic versioning**: Use tags (v1.0.0, v1.1.0, etc.)

### 5.3 GitHub Actions Secrets

Ensure these secrets are configured:
- `CLAUDE_CODE_OAUTH_TOKEN`
- `ANTHROPIC_API_KEY` (backup)
- `GITHUB_TOKEN` (automatic)

---

## 6. Docker & Container Registry

### 6.1 Image Naming

**Current**: `ghcr.io/firstloophq/claude-code-test-runner:main`
**New**: `ghcr.io/varunisrani/varun-israni-claude-tester:latest`

**Tag Strategy**:
- `latest`: Most recent main branch build
- `v1.0.0`, `v1.1.0`: Semantic versions
- `sha-abc123f`: Git commit SHAs

### 6.2 Dockerfile Updates

```dockerfile
FROM mcr.microsoft.com/playwright:v1.54.2 AS base

# Varun Israni Claude Tester (VICT)
# AI-Powered E2E Testing Framework
LABEL org.opencontainers.image.title="Varun Israni Claude Tester"
LABEL org.opencontainers.image.description="AI-powered E2E testing with Claude Code"
LABEL org.opencontainers.image.author="Varun Israni <email@example.com>"
LABEL org.opencontainers.image.source="https://github.com/varunisrani/varun-israni-claude-tester"
LABEL org.opencontainers.image.licenses="MIT"

# ... rest of Dockerfile

# Copy built VICT CLI
COPY --from=build /app/cli/dist/vict /app/vict
WORKDIR /app

ENTRYPOINT ["/bin/bash"]
```

---

## 7. MCP Server Rebranding

### 7.1 State Server Configuration

**Server Name**: `vict-state-server`
**Tools Prefix**: `mcp__vict-state__*`

**Updated Tool Names**:
- `mcp__vict-state__get_test_plan`
- `mcp__vict-state__update_test_step`

### 7.2 Playwright Server Configuration

**Server Alias**: `vict-playwright`
**Tools Prefix**: `mcp__vict-playwright__*`

**Example Tool Names**:
- `mcp__vict-playwright__browser_navigate`
- `mcp__vict-playwright__browser_click`
- `mcp__vict-playwright__browser_snapshot`

---

## 8. CTRF Reporting

### 8.1 Tool Metadata

```typescript
{
  reportFormat: "CTRF",
  specVersion: "0.0.0",
  results: {
    tool: {
      name: "varun-israni-claude-tester",
      version: "1.0.0",
      url: "https://github.com/varunisrani/varun-israni-claude-tester"
    },
    summary: { ... },
    tests: [ ... ]
  }
}
```

---

## 9. Implementation Checklist

### Phase 1: Core Rebranding (Priority: High)

- [ ] Update README.md with VICT branding
- [ ] Rename CLI binary: `cc-test-runner` → `vict`
- [ ] Update package.json metadata
- [ ] Update MCP server names
- [ ] Update tool prefixes in allowed tools list
- [ ] Update system prompts with VICT references
- [ ] Update CTRF tool metadata

### Phase 2: Documentation (Priority: High)

- [ ] Create comprehensive README with examples
- [ ] Add CONTRIBUTING.md
- [ ] Add CODE_OF_CONDUCT.md
- [ ] Add LICENSE (MIT with Varun Israni)
- [ ] Create CHANGELOG.md
- [ ] Update sample test files

### Phase 3: Repository & CI/CD (Priority: Medium)

- [ ] Update GitHub repository name/description
- [ ] Configure repository topics/tags
- [ ] Update GitHub Actions workflows
- [ ] Update Docker labels and metadata
- [ ] Test container builds with new naming
- [ ] Update GHCR image paths

### Phase 4: Polish & Promotion (Priority: Low)

- [ ] Create ASCII art logo for CLI
- [ ] Add badges to README (build status, version, license)
- [ ] Create GitHub Pages documentation site
- [ ] Write blog post/announcement
- [ ] Submit to awesome-lists (awesome-testing, awesome-ai-tools)
- [ ] Create demo video/GIF for README

---

## 10. Migration Strategy

### 10.1 Backward Compatibility

**Approach**: Hard cutover (no backward compatibility needed as this is a rebrand of existing project)

**Communication**:
- Update all documentation simultaneously
- Clear commit message explaining rebrand
- Tag as v1.0.0 to signify major milestone

### 10.2 Rollout Plan

1. **Week 1**: Core rebranding (Phase 1)
2. **Week 2**: Documentation updates (Phase 2)
3. **Week 3**: CI/CD and testing (Phase 3)
4. **Week 4**: Polish and launch (Phase 4)

---

## 11. Testing the Rebrand

### 11.1 Functional Tests

- [ ] Build CLI locally: `bun run build`
- [ ] Test CLI execution: `./dist/vict --testsPath=./samples/vict-sample-tests.json`
- [ ] Verify MCP servers start correctly
- [ ] Confirm test execution completes
- [ ] Check report generation (CTRF + Markdown)

### 11.2 Docker Tests

- [ ] Build container: `docker build -t vict-test .`
- [ ] Run container: `docker run vict-test /app/vict --help`
- [ ] Test full workflow in container

### 11.3 GitHub Actions Tests

- [ ] Trigger workflow manually
- [ ] Verify container pulls correctly
- [ ] Confirm tests execute in CI
- [ ] Check artifact uploads

---

## 12. Marketing & Promotion

### 12.1 Launch Announcement

**Platforms**:
- GitHub Discussions
- Reddit: r/testing, r/QualityAssurance, r/programming
- Hacker News
- LinkedIn
- Twitter/X

**Message Template**:
```
🚀 Introducing Varun Israni Claude Tester (VICT)

Write E2E tests in plain English. Let AI handle the rest.

✨ Features:
- Natural language test definitions
- AI-powered adaptive execution
- Resilient to UI changes
- Full Playwright integration
- CTRF reporting

Try it now: github.com/varunisrani/varun-israni-claude-tester

#testing #ai #automation #e2e
```

### 12.2 Content Strategy

**Blog Posts**:
1. "Introducing VICT: AI-Powered E2E Testing"
2. "Why We Built VICT: Making Tests More Human"
3. "VICT vs Traditional Testing: A Comparison"
4. "Getting Started with VICT: Tutorial Series"

**Video Content**:
- Demo video showing test execution
- Tutorial: Writing your first VICT test
- Deep dive: How VICT uses Claude Code

---

## 13. Success Metrics

### 13.1 Technical Metrics

- [ ] All tests pass with new naming
- [ ] Docker builds successfully
- [ ] GitHub Actions workflows complete
- [ ] CTRF reports generate correctly
- [ ] No broken links in documentation

### 13.2 Adoption Metrics (Post-Launch)

- GitHub stars target: 100+ (first month)
- Docker pulls: 500+ (first month)
- Contributors: 5+ (first quarter)
- Issues/feedback: Active community engagement

---

## 14. Risk Mitigation

### 14.1 Potential Issues

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Name collision with existing tool | Low | High | Google search confirms "vict" CLI is available |
| Breaking changes in dependencies | Medium | Medium | Pin all dependency versions |
| Claude Code API changes | Medium | High | Abstract API calls, monitor changelog |
| Docker registry issues | Low | Medium | Use GHCR (reliable, GitHub-integrated) |

### 14.2 Rollback Plan

If critical issues arise:
1. Revert to previous commit
2. Keep old naming temporarily
3. Create issue for tracking rebrand completion
4. Fix issues incrementally

---

## 15. Post-Launch Roadmap

### Version 1.1 (Future Features)

- [ ] Parallel test execution
- [ ] Test retries for flaky tests
- [ ] Custom reporter plugins
- [ ] Web UI for test management
- [ ] VS Code extension
- [ ] Interactive test debugging

### Version 2.0 (Major Features)

- [ ] Multi-browser support (Firefox, Safari)
- [ ] Mobile testing (iOS, Android simulators)
- [ ] Visual regression testing
- [ ] AI-generated test suggestions
- [ ] Test recording UI

---

## 16. Contact & Support

**Project Maintainer**: Varun Israni
**Repository**: https://github.com/varunisrani/varun-israni-claude-tester
**Issues**: https://github.com/varunisrani/varun-israni-claude-tester/issues
**Discussions**: https://github.com/varunisrani/varun-israni-claude-tester/discussions

---

## Appendix A: Complete File Modification List

### Files to Modify

1. `/claude-code-test-runner/README.md` - Complete rewrite
2. `/claude-code-test-runner/Dockerfile` - Update binary paths, add labels
3. `/claude-code-test-runner/cli/package.json` - Update metadata, build output
4. `/claude-code-test-runner/cli/src/index.ts` - Update comments
5. `/claude-code-test-runner/cli/src/mcp/test-state/server.ts` - Update server name
6. `/claude-code-test-runner/cli/src/prompts/start-test.ts` - Update MCP names, tools
7. `/claude-code-test-runner/cli/src/prompts/system.ts` - Update prompt text
8. `/claude-code-test-runner/cli/src/utils/test-reporter.ts` - Update CTRF metadata
9. `/claude-code-test-runner/.github/workflows/*.yml` - Update commands, names
10. `/claude-code-test-runner/samples/*.json` - Rename, update references

### Files to Create

1. `CONTRIBUTING.md` - Contribution guidelines
2. `CODE_OF_CONDUCT.md` - Community standards
3. `LICENSE` - MIT license
4. `CHANGELOG.md` - Version history
5. `.github/ISSUE_TEMPLATE/bug_report.md` - Bug report template
6. `.github/ISSUE_TEMPLATE/feature_request.md` - Feature request template

---

## Appendix B: Search & Replace Patterns

### Global Find/Replace Operations

| Find | Replace |
|------|---------|
| `claude-code-test-runner` | `varun-israni-claude-tester` |
| `cc-test-runner` | `vict` |
| `claude-code-tests` | `varun-israni-claude-tester` |
| `test-state-server` | `vict-state-server` |
| `cctr-playwright` | `vict-playwright` |
| `cctr-state` | `vict-state` |
| `mcp__cctr-playwright__` | `mcp__vict-playwright__` |
| `mcp__cctr-state__` | `mcp__vict-state__` |

**Tools**: Use VS Code find/replace or `sed` for batch operations

---

## Sign-Off

**Plan Created**: 2025-11-15
**Plan Owner**: Varun Israni
**Status**: Ready for Implementation

**Next Steps**:
1. Review this plan
2. Begin Phase 1 implementation
3. Test each change incrementally
4. Commit with semantic versioning
5. Launch v1.0.0

---

*End of Rebranding Plan*
