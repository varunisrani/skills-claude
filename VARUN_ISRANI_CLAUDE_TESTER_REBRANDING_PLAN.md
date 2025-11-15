# Varun Israni Claude Tester (VICT) - Comprehensive Rebranding Plan

**Date**: November 15, 2025
**Repository**: skills-claude → varun-israni-claude-tester
**Author**: Varun Israni
**Status**: Ready for Implementation

---

## Executive Summary

This document provides a complete rebranding strategy to transform the current **skills-claude** repository into **Varun Israni Claude Tester (VICT)**, establishing personal brand identity while maintaining all technical functionality.

### Key Changes
- **Repository Name**: `skills-claude` → `varun-israni-claude-tester`
- **Project Name**: Claude Code Test Runner → Varun Israni Claude Tester (VICT)
- **CLI Command**: `cc-test-runner` → `vict`
- **Package Name**: `claude-code-tests` → `varun-israni-claude-tester`
- **Author Attribution**: All projects attributed to Varun Israni

### Scope
- ✅ claude-code-test-runner (E2E testing framework)
- ✅ Repository-level branding (README, docs)
- ✅ GitHub repository settings
- ✅ Docker images and CI/CD
- ⚠️ OpenHands (reference only - separate project)
- ⚠️ Rover (Endor project - no changes)

---

## Table of Contents

1. [Project Analysis Summary](#project-analysis-summary)
2. [Naming Strategy](#naming-strategy)
3. [File-by-File Changes](#file-by-file-changes)
4. [Implementation Phases](#implementation-phases)
5. [Testing & Validation](#testing--validation)
6. [Migration Checklist](#migration-checklist)
7. [Rollback Procedure](#rollback-procedure)

---

## Project Analysis Summary

### Current Repository Structure

```
/home/user/skills-claude/
├── claude-code-test-runner/     # E2E Testing Framework (163 KB)
│   ├── cli/                     # Main CLI tool
│   ├── samples/                 # Test samples
│   ├── Dockerfile               # Container image
│   └── .github/workflows/       # CI/CD pipelines
│
├── OpenHands/                   # OpenHands Framework (31 MB)
│   └── [Reference only - separate project]
│
├── rover/                       # Rover CLI (Endor project)
│   └── [No changes - third party]
│
├── .claude/skills/              # 39 Claude Code skills
│   └── [Supporting content]
│
└── [Root Documentation]         # 70+ MD/TXT files
    ├── README.md
    ├── START_HERE.md
    ├── REBRANDING_PLAN.md
    └── [Various analysis docs]
```

### Components Requiring Rebranding

| Component | Current Name | New Name | Priority |
|-----------|--------------|----------|----------|
| **CLI Executable** | cc-test-runner | vict | CRITICAL |
| **Package Name** | claude-code-tests | varun-israni-claude-tester | CRITICAL |
| **MCP Prefix** | cctr | vict | CRITICAL |
| **MCP State Server** | cctr-state | vict-state | CRITICAL |
| **MCP Playwright** | cctr-playwright | vict-playwright | CRITICAL |
| **Docker Image** | ghcr.io/firstloophq/... | ghcr.io/varunisrani/... | HIGH |
| **Repository** | skills-claude | varun-israni-claude-tester | HIGH |

---

## Naming Strategy

### New Brand Identity: VICT

**Full Name**: Varun Israni Claude Tester
**Acronym**: VICT
**Pronunciation**: "Vicked" or "V-I-C-T"

### Rationale for "VICT"
1. **Memorable**: Short, punchy, follows pattern of `jest`, `vitest`, `vite`
2. **Personal Branding**: Named after creator (Varun Israni)
3. **Professional**: Establishes unique identity in testing tools space
4. **Searchable**: Unique acronym for GitHub/npm discovery
5. **Pronounceable**: Easy to say in conversation

### Naming Conventions

```
Component                Current                    New
──────────────────────────────────────────────────────────────
CLI Command              cc-test-runner             vict
Package Name             claude-code-tests          varun-israni-claude-tester
npm Package              @endorhq/rover            @varunisrani/vict
MCP Server Prefix        cctr-                      vict-
MCP State Server         cctr-state                 vict-state
MCP Playwright           cctr-playwright            vict-playwright
Docker Image             ghcr.io/firstloophq/...   ghcr.io/varunisrani/vict
GitHub Repo              skills-claude              varun-israni-claude-tester
Tool Names               mcp__cctr-*                mcp__vict-*
Class Names              MCPStateServer             VictStateServer
Display Name             Claude Code Test Runner    Varun Israni Claude Tester
```

---

## File-by-File Changes

### CRITICAL Priority (Functionality Breaking)

#### 1. `/claude-code-test-runner/cli/package.json`

**Lines to Change**: 2, 17

```json
// BEFORE
{
  "name": "claude-code-tests",
  "scripts": {
    "build": "bun build --compile ./src/index.ts --outfile ./dist/cc-test-runner --target bun"
  }
}

// AFTER
{
  "name": "varun-israni-claude-tester",
  "scripts": {
    "build": "bun build --compile ./src/index.ts --outfile ./dist/vict --target bun"
  }
}
```

#### 2. `/claude-code-test-runner/cli/src/mcp/test-state/server.ts`

**Lines to Change**: 11, 29, 121

```typescript
// BEFORE (Line 11)
class MCPStateServer {

// AFTER
class VictStateServer {

// BEFORE (Line 29)
name: "test-state-server",

// AFTER
name: "vict-state-server",

// BEFORE (Line 121)
logger.debug(`testState MCP Server running on port ${this.port}`);

// AFTER
logger.debug(`VICT State MCP Server running on port ${this.port}`);

// Class export (Line 148)
// BEFORE
export { MCPStateServer };

// AFTER
export { VictStateServer };
```

#### 3. `/claude-code-test-runner/cli/src/index.ts`

**Lines to Change**: 1, 9

```typescript
// BEFORE
import { MCPStateServer } from "./mcp/test-state/server";
const server = new MCPStateServer(3001);

// AFTER
import { VictStateServer } from "./mcp/test-state/server";
const server = new VictStateServer(3001);
```

#### 4. `/claude-code-test-runner/cli/src/prompts/start-test.ts`

**Lines to Change**: 19, 26-73 (28 MCP tool references)

```typescript
// BEFORE (Line 26)
mcpServers: {
    "cctr-playwright": {
        command: "bunx",
        args: [
            "@playwright/mcp@v0.0.31",
            "--output-dir",
            `${inputs.resultsPath}/${testCase.id}/playwright`,
            "--save-trace",
            "--image-responses",
            "omit",
        ],
    },
    "cctr-state": {
        type: "http",
        url: "http://localhost:3001/",

// AFTER
mcpServers: {
    "vict-playwright": {
        command: "bunx",
        args: [
            "@playwright/mcp@v0.0.31",
            "--output-dir",
            `${inputs.resultsPath}/${testCase.id}/playwright`,
            "--save-trace",
            "--image-responses",
            "omit",
        ],
    },
    "vict-state": {
        type: "http",
        url: "http://localhost:3001/",

// Change all tool references (Lines 47-73)
// BEFORE: mcp__cctr-playwright__*
// AFTER:  mcp__vict-playwright__*

// BEFORE: mcp__cctr-state__*
// AFTER:  mcp__vict-state__*
```

**Complete Tool List to Update** (28 occurrences):
```
Playwright Tools (24):
- mcp__vict-playwright__browser_close
- mcp__vict-playwright__browser_resize
- mcp__vict-playwright__browser_console_messages
- mcp__vict-playwright__browser_handle_dialog
- mcp__vict-playwright__browser_evaluate
- mcp__vict-playwright__browser_file_upload
- mcp__vict-playwright__browser_install
- mcp__vict-playwright__browser_press_key
- mcp__vict-playwright__browser_type
- mcp__vict-playwright__browser_navigate
- mcp__vict-playwright__browser_navigate_back
- mcp__vict-playwright__browser_navigate_forward
- mcp__vict-playwright__browser_network_requests
- mcp__vict-playground__browser_snapshot
- mcp__vict-playwright__browser_click
- mcp__vict-playwright__browser_drag
- mcp__vict-playwright__browser_hover
- mcp__vict-playwright__browser_select_option
- mcp__vict-playwright__browser_tab_list
- mcp__vict-playwright__browser_tab_new
- mcp__vict-playwright__browser_tab_select
- mcp__vict-playwright__browser_tab_close
- mcp__vict-playwright__browser_take_screenshot
- mcp__vict-playwright__browser_wait_for

State Tools (2):
- mcp__vict-state__get_test_plan
- mcp__vict-state__update_test_step
```

#### 5. `/claude-code-test-runner/cli/src/prompts/system.ts`

**Lines to Change**: 10, 15, 24-26

```typescript
// BEFORE (Line 10)
You will be executing a test plan made available via the mcp__cctr-state__get_test_plan tool.

// AFTER
You will be executing a test plan made available via the mcp__vict-state__get_test_plan tool.

// BEFORE (Line 15-16)
- Use the mcp__cctr-playwright__* tools to interact with the browser to perform test steps.

// AFTER
- Use the mcp__vict-playwright__* tools to interact with the browser to perform test steps.

// BEFORE (Line 24-25)
- Use the mcp__cctr-state__get_test_plan tool from the testState MCP server
- Use the mcp__cctr-state__update_test_step tool from the testState MCP server

// AFTER
- Use the mcp__vict-state__get_test_plan tool from the VICT State MCP server
- Use the mcp__vict-state__update_test_step tool from the VICT State MCP server
```

#### 6. `/claude-code-test-runner/Dockerfile`

**Line to Change**: 44

```dockerfile
# BEFORE
COPY --from=build /app/cli/dist/cc-test-runner /app/cc-test-runner

# AFTER
COPY --from=build /app/cli/dist/vict /app/vict
```

---

### HIGH Priority (User-Facing)

#### 7. `/claude-code-test-runner/cli/src/utils/test-reporter.ts`

**Line to Change**: 63

```typescript
// BEFORE
tool: {
    name: "claude-code-tests",
    version: "1.0.0",
},

// AFTER
tool: {
    name: "varun-israni-claude-tester",
    version: "1.0.0",
},
```

#### 8. `/claude-code-test-runner/README.md`

**Lines to Change**: 1, 53, 64, 74, 80, 83, 86

```markdown
<!-- BEFORE (Line 1) -->
# Claude Code Test Runner

<!-- AFTER -->
# Varun Israni Claude Tester (VICT)

<!-- BEFORE (Line 53) -->
This project includes a CLI tool, `cc-test-runner`.

<!-- AFTER -->
This project includes a CLI tool, `vict`.

<!-- BEFORE (Line 64) -->
./dist/cc-test-runner [options]

<!-- AFTER -->
./dist/vict [options]

<!-- BEFORE (Lines 80-86) -->
# Basic usage with test file
./dist/cc-test-runner --testsPath=./tests.json

# With custom results directory and verbose output
./dist/cc-test-runner -t ./e2e-tests.json -o ./test-output -v

# Limit Claude Code interactions
./dist/cc-test-runner --testsPath=./tests.json --maxTurns=20

<!-- AFTER -->
# Basic usage with test file
./dist/vict --testsPath=./tests.json

# With custom results directory and verbose output
./dist/vict -t ./e2e-tests.json -o ./test-output -v

# Limit Claude Code interactions
./dist/vict --testsPath=./tests.json --maxTurns=20
```

Add author attribution at top:
```markdown
# Varun Israni Claude Tester (VICT)

**Author**: Varun Israni
**Version**: 1.0.0
**License**: MIT

This project enables full E2E test automation using Claude Code.
```

#### 9. `/claude-code-test-runner/.github/workflows/sample-tests-action.yml`

**Line to Change**: 27

```yaml
# BEFORE
- name: Run Claude Code Tests
  run: /app/cc-test-runner --testsPath=$GITHUB_WORKSPACE/samples/thisinto-e2e-tests.json --resultsPath=/test/results/

# AFTER
- name: Run VICT Tests
  run: /app/vict --testsPath=$GITHUB_WORKSPACE/samples/thisinto-e2e-tests.json --resultsPath=/test/results/
```

---

### Repository-Level Changes

#### 10. Root `/README.md`

**Complete Rewrite**:

```markdown
# Varun Israni Claude Tester

**Author**: Varun Israni
**Repository**: https://github.com/varunisrani/varun-israni-claude-tester
**License**: MIT

## Overview

This repository contains a comprehensive testing and development framework integrating:

1. **VICT (Varun Israni Claude Tester)** - E2E testing framework powered by Claude Code
2. **OpenHands Integration** - AI agent framework with Claude SDK
3. **Claude Code Skills** - 39 development skill modules
4. **Development Resources** - Documentation, guides, and analysis tools

## Quick Start

### VICT - E2E Testing
```bash
cd claude-code-test-runner/cli
bun install
bun run build
./dist/vict --testsPath=../samples/thisinto-e2e-tests.json
```

### OpenHands - AI Agents
```bash
cd OpenHands
pip install -e .
python -m openhands.server.app --port 3000
```

## Project Structure

- **`claude-code-test-runner/`** - VICT testing framework
- **`OpenHands/`** - OpenHands framework with Claude SDK integration
- **`.claude/skills/`** - 39 Claude Code skill modules
- **`rover/`** - Rover CLI reference (Endor project)

## Documentation

- [VICT Documentation](claude-code-test-runner/README.md)
- [OpenHands Setup](OpenHands/README.md)
- [Quick Start Guide](START_HERE.md)
- [Local Setup Guide](LOCAL_SETUP_GUIDE.md)

## Author

**Varun Israni**
- GitHub: [@varunisrani](https://github.com/varunisrani)
- Project: Varun Israni Claude Tester (VICT)

## License

MIT License - See LICENSE file for details
```

#### 11. Create `/LICENSE`

```
MIT License

Copyright (c) 2025 Varun Israni

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Implementation Phases

### Phase 1: Core Rebranding (Week 1) - CRITICAL

**Objective**: Update all functionality-breaking code references

**Tasks**:
- [ ] Update `package.json` (name, build script)
- [ ] Rename `MCPStateServer` → `VictStateServer`
- [ ] Update all MCP server names (`cctr-*` → `vict-*`)
- [ ] Update all 28 MCP tool references
- [ ] Update Dockerfile executable path
- [ ] Update system prompts and user messages
- [ ] Build and verify CLI works: `./dist/vict --help`

**Validation**:
```bash
cd claude-code-test-runner/cli
bun install
bun run build
./dist/vict --testsPath=../samples/thisinto-e2e-tests.json --verbose
```

**Success Criteria**:
- ✅ CLI builds successfully
- ✅ Executable named `vict` (not `cc-test-runner`)
- ✅ MCP servers start with new names
- ✅ Sample test runs without errors

---

### Phase 2: Documentation & Branding (Week 2) - HIGH

**Objective**: Update user-facing documentation and branding

**Tasks**:
- [ ] Rewrite `claude-code-test-runner/README.md`
- [ ] Update root `/README.md` with new structure
- [ ] Create `/LICENSE` file
- [ ] Update `test-reporter.ts` tool name
- [ ] Add author attribution to all major docs
- [ ] Update CLI help text and descriptions
- [ ] Create VICT logo/branding assets (optional)

**Validation**:
```bash
# Check all READMEs render correctly on GitHub
# Verify LICENSE is recognized by GitHub
# Ensure author attribution appears
```

**Success Criteria**:
- ✅ All documentation uses "VICT" terminology
- ✅ Author clearly identified as Varun Israni
- ✅ License file present and valid
- ✅ README renders correctly on GitHub

---

### Phase 3: Repository & CI/CD (Week 3) - HIGH

**Objective**: Update repository settings and automation

**Tasks**:
- [ ] Rename GitHub repository: `skills-claude` → `varun-israni-claude-tester`
- [ ] Update GitHub repository description
- [ ] Update repository topics/tags (vict, testing, claude, e2e)
- [ ] Update GitHub Actions workflow names
- [ ] Update Docker image references in workflows
- [ ] Configure GitHub Container Registry for new image
- [ ] Update branch protection rules (if any)
- [ ] Archive old Docker images (optional)

**GitHub Repository Settings**:
```
Name: varun-israni-claude-tester
Description: VICT - Varun Israni Claude Tester: E2E testing framework powered by Claude Code
Topics: vict, claude-code, e2e-testing, playwright, mcp, test-automation
```

**Docker Image Updates**:
```yaml
# .github/workflows/build-and-publish.yml
# BEFORE
image: ghcr.io/firstloophq/claude-code-test-runner

# AFTER
image: ghcr.io/varunisrani/vict
```

**Validation**:
```bash
# Verify repository accessible at new URL
# Check GitHub Actions pass on new repository
# Verify Docker image builds and publishes
```

**Success Criteria**:
- ✅ Repository renamed successfully
- ✅ All links redirect correctly
- ✅ CI/CD pipelines pass
- ✅ Docker images publish to new location

---

### Phase 4: Marketing & Polish (Week 4) - OPTIONAL

**Objective**: Launch and promote the rebranded project

**Tasks**:
- [ ] Create announcement blog post/tweet
- [ ] Update personal portfolio with project
- [ ] Submit to relevant communities (Reddit, HN, Twitter)
- [ ] Create demo video showing VICT in action
- [ ] Update LinkedIn with project showcase
- [ ] Create project website (vict.dev or similar)
- [ ] Add badges to README (build status, license, version)

**README Badges**:
```markdown
[![Build Status](https://github.com/varunisrani/varun-israni-claude-tester/workflows/CI/badge.svg)](https://github.com/varunisrani/varun-israni-claude-tester/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/github/v/release/varunisrani/varun-israni-claude-tester)](https://github.com/varunisrani/varun-israni-claude-tester/releases)
```

**Announcement Template**:
```
🚀 Introducing VICT - Varun Israni Claude Tester

VICT is an AI-powered E2E testing framework that uses Claude Code to execute
tests written in natural language.

✨ Features:
- Natural language test definitions
- Adaptive element selection
- Visual understanding
- Resilient to UI changes

Built with @anthropic Claude Code, Playwright, and MCP.

GitHub: https://github.com/varunisrani/varun-israni-claude-tester
```

---

## Testing & Validation

### Pre-Rebranding Tests

**Baseline Test Suite**:
```bash
cd claude-code-test-runner/cli

# 1. Build baseline
bun run build
./dist/cc-test-runner --testsPath=../samples/thisinto-e2e-tests.json --resultsPath=/tmp/baseline

# 2. Save results
cp -r /tmp/baseline /tmp/baseline-backup
```

### Post-Rebranding Tests

**Validation Test Suite**:
```bash
# 1. Clean build
rm -rf dist/ node_modules/
bun install
bun run build

# 2. Verify executable name
ls -la dist/
# Should see: vict (not cc-test-runner)

# 3. Test help command
./dist/vict --help

# 4. Run sample tests
./dist/vict --testsPath=../samples/thisinto-e2e-tests.json --resultsPath=/tmp/vict-test --verbose

# 5. Compare results
diff -r /tmp/baseline /tmp/vict-test
# Should be identical except for tool names

# 6. Verify MCP server names
grep -r "vict-state" dist/
grep -r "vict-playwright" dist/
# Should find multiple matches

# 7. Check no old references remain
grep -r "cctr-" dist/
grep -r "cc-test-runner" dist/
# Should find ZERO matches
```

### Automated Validation Script

Create `/claude-code-test-runner/scripts/validate-rebranding.sh`:

```bash
#!/bin/bash
set -e

echo "🔍 Validating VICT Rebranding..."

cd "$(dirname "$0")/.."

# 1. Check for old naming
echo "Checking for old references..."
if grep -r "cctr-" cli/src/ cli/package.json Dockerfile 2>/dev/null; then
    echo "❌ Found old 'cctr-' references"
    exit 1
fi

if grep -r "cc-test-runner" cli/src/ cli/package.json Dockerfile README.md 2>/dev/null; then
    echo "❌ Found old 'cc-test-runner' references"
    exit 1
fi

if grep -r "MCPStateServer" cli/src/ 2>/dev/null; then
    echo "❌ Found old 'MCPStateServer' class name"
    exit 1
fi

# 2. Check for new naming
echo "Checking for new references..."
if ! grep -q "vict" cli/package.json; then
    echo "❌ Missing 'vict' in package.json"
    exit 1
fi

if ! grep -q "VictStateServer" cli/src/mcp/test-state/server.ts; then
    echo "❌ Missing 'VictStateServer' class"
    exit 1
fi

# 3. Build test
echo "Building CLI..."
cd cli
bun install
bun run build

if [ ! -f "dist/vict" ]; then
    echo "❌ Executable 'vict' not found"
    exit 1
fi

# 4. Help test
echo "Testing CLI help..."
./dist/vict --help > /dev/null

echo "✅ All validation checks passed!"
```

**Run Validation**:
```bash
chmod +x claude-code-test-runner/scripts/validate-rebranding.sh
./claude-code-test-runner/scripts/validate-rebranding.sh
```

---

## Migration Checklist

### Pre-Migration
- [ ] Backup current repository
- [ ] Document current functionality
- [ ] Run baseline tests
- [ ] Create feature branch: `git checkout -b feature/vict-rebranding`

### Code Changes
- [ ] Update `cli/package.json` (name, build script)
- [ ] Rename `MCPStateServer` → `VictStateServer`
- [ ] Update MCP server configuration in `start-test.ts`
- [ ] Update all 28 MCP tool references
- [ ] Update system prompts
- [ ] Update Dockerfile
- [ ] Update `test-reporter.ts`

### Documentation
- [ ] Rewrite `claude-code-test-runner/README.md`
- [ ] Update root `/README.md`
- [ ] Create `/LICENSE`
- [ ] Update `START_HERE.md`
- [ ] Update any quickstart guides

### Build & Test
- [ ] Clean build: `rm -rf dist node_modules && bun install && bun run build`
- [ ] Verify executable: `ls dist/vict`
- [ ] Run help: `./dist/vict --help`
- [ ] Run sample tests: `./dist/vict --testsPath=../samples/thisinto-e2e-tests.json`
- [ ] Run validation script
- [ ] Compare test results with baseline

### CI/CD & Repository
- [ ] Update GitHub Actions workflows
- [ ] Update Docker image references
- [ ] Test Docker build locally
- [ ] Configure GHCR for new image name
- [ ] Rename repository on GitHub
- [ ] Update repository description/topics
- [ ] Verify redirects work

### Deployment
- [ ] Merge feature branch to main
- [ ] Tag release: `git tag v1.0.0-vict`
- [ ] Push tags: `git push --tags`
- [ ] Build and publish Docker image
- [ ] Verify CI/CD passes
- [ ] Update npm package (if published)

### Post-Launch
- [ ] Create announcement
- [ ] Update portfolio
- [ ] Share on social media
- [ ] Monitor for issues
- [ ] Respond to feedback

---

## Rollback Procedure

### If Issues Occur During Rebranding

**Immediate Rollback Steps**:
```bash
# 1. Checkout previous commit
git log  # Find last good commit
git reset --hard <commit-hash>

# 2. Force push (if already pushed)
git push --force origin main

# 3. Restore Docker images
docker pull ghcr.io/firstloophq/claude-code-test-runner:backup
docker tag ... ghcr.io/firstloophq/claude-code-test-runner:latest
docker push ...

# 4. Verify functionality
cd claude-code-test-runner/cli
bun run build
./dist/cc-test-runner --testsPath=../samples/thisinto-e2e-tests.json
```

### If Repository Renamed Incorrectly

GitHub provides automatic redirects for 90 days after rename. To revert:
1. Go to repository Settings
2. Rename back to `skills-claude`
3. All old links will work again

---

## Find-Replace Quick Reference

Use these patterns for bulk find-replace across the codebase:

| Find | Replace | Scope |
|------|---------|-------|
| `cc-test-runner` | `vict` | All files |
| `claude-code-tests` | `varun-israni-claude-tester` | package.json only |
| `cctr-` | `vict-` | TypeScript files |
| `mcp__cctr-` | `mcp__vict-` | TypeScript files |
| `MCPStateServer` | `VictStateServer` | TypeScript files |
| `Claude Code Test Runner` | `Varun Israni Claude Tester (VICT)` | Documentation |

**VSCode Multi-Cursor Instructions**:
1. Open `claude-code-test-runner/cli/src/prompts/start-test.ts`
2. Select `cctr-playwright` (first occurrence)
3. Press `Ctrl+Shift+L` (select all occurrences)
4. Type `vict-playwright` (replaces all 24 at once)
5. Repeat for `cctr-state` → `vict-state`

---

## Estimated Effort

### Time Breakdown

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| **Phase 1** | Core code changes | 3-4 hours |
| **Phase 2** | Documentation | 2-3 hours |
| **Phase 3** | Repository/CI/CD | 2-3 hours |
| **Phase 4** | Marketing (optional) | 4-6 hours |
| **Testing** | Throughout all phases | 2-3 hours |
| **Total** | All phases | 13-19 hours |

### Complexity Assessment

| Task | Complexity | Risk |
|------|-----------|------|
| Code changes | Medium | Low (automated tests catch issues) |
| Documentation | Low | Very Low (cosmetic only) |
| Repository rename | Low | Low (GitHub auto-redirects) |
| Docker/CI/CD | Medium | Medium (requires registry access) |
| Overall | **Medium** | **Low-Medium** |

---

## Success Metrics

### Technical Metrics
- ✅ All tests pass with new naming
- ✅ CLI executable works: `./dist/vict --help`
- ✅ MCP servers start with new names
- ✅ Docker image builds successfully
- ✅ CI/CD pipelines pass
- ✅ Zero old references remain in code

### Branding Metrics
- ✅ Repository appears under new name on GitHub
- ✅ README clearly shows "Varun Israni" as author
- ✅ License file present (MIT)
- ✅ All documentation uses VICT terminology
- ✅ Project discoverable via search

### User Experience Metrics
- ✅ CLI is intuitive: `vict` instead of `cc-test-runner`
- ✅ Documentation is clear and comprehensive
- ✅ Installation instructions work
- ✅ Sample tests run successfully

---

## Appendix A: Complete File List

### Files Requiring Changes (11 total)

**CRITICAL (6 files)**:
1. `/home/user/skills-claude/claude-code-test-runner/cli/package.json`
2. `/home/user/skills-claude/claude-code-test-runner/cli/src/mcp/test-state/server.ts`
3. `/home/user/skills-claude/claude-code-test-runner/cli/src/index.ts`
4. `/home/user/skills-claude/claude-code-test-runner/cli/src/prompts/start-test.ts`
5. `/home/user/skills-claude/claude-code-test-runner/cli/src/prompts/system.ts`
6. `/home/user/skills-claude/claude-code-test-runner/Dockerfile`

**HIGH (3 files)**:
7. `/home/user/skills-claude/claude-code-test-runner/cli/src/utils/test-reporter.ts`
8. `/home/user/skills-claude/claude-code-test-runner/README.md`
9. `/home/user/skills-claude/claude-code-test-runner/.github/workflows/sample-tests-action.yml`

**Repository Level (2 files)**:
10. `/home/user/skills-claude/README.md`
11. `/home/user/skills-claude/LICENSE` (create new)

---

## Appendix B: MCP Tool Reference Map

### Complete Mapping (28 tools)

```
OLD → NEW

Playwright Tools (24):
mcp__cctr-playwright__browser_close          → mcp__vict-playwright__browser_close
mcp__cctr-playwright__browser_resize         → mcp__vict-playwright__browser_resize
mcp__cctr-playwright__browser_console_messages → mcp__vict-playwright__browser_console_messages
mcp__cctr-playwright__browser_handle_dialog  → mcp__vict-playwright__browser_handle_dialog
mcp__cctr-playwright__browser_evaluate       → mcp__vict-playwright__browser_evaluate
mcp__cctr-playwright__browser_file_upload    → mcp__vict-playwright__browser_file_upload
mcp__cctr-playwright__browser_install        → mcp__vict-playwright__browser_install
mcp__cctr-playwright__browser_press_key      → mcp__vict-playwright__browser_press_key
mcp__cctr-playwright__browser_type           → mcp__vict-playwright__browser_type
mcp__cctr-playwright__browser_navigate       → mcp__vict-playwright__browser_navigate
mcp__cctr-playwright__browser_navigate_back  → mcp__vict-playwright__browser_navigate_back
mcp__cctr-playwright__browser_navigate_forward → mcp__vict-playwright__browser_navigate_forward
mcp__cctr-playwright__browser_network_requests → mcp__vict-playwright__browser_network_requests
mcp__cctr-playwright__browser_snapshot       → mcp__vict-playwright__browser_snapshot
mcp__cctr-playwright__browser_click          → mcp__vict-playwright__browser_click
mcp__cctr-playwright__browser_drag           → mcp__vict-playwright__browser_drag
mcp__cctr-playwright__browser_hover          → mcp__vict-playwright__browser_hover
mcp__cctr-playwright__browser_select_option  → mcp__vict-playwright__browser_select_option
mcp__cctr-playwright__browser_tab_list       → mcp__vict-playwright__browser_tab_list
mcp__cctr-playwright__browser_tab_new        → mcp__vict-playwright__browser_tab_new
mcp__cctr-playwright__browser_tab_select     → mcp__vict-playwright__browser_tab_select
mcp__cctr-playwright__browser_tab_close      → mcp__vict-playwright__browser_tab_close
mcp__cctr-playwright__browser_take_screenshot → mcp__vict-playwright__browser_take_screenshot
mcp__cctr-playwright__browser_wait_for       → mcp__vict-playwright__browser_wait_for

State Tools (2):
mcp__cctr-state__get_test_plan    → mcp__vict-state__get_test_plan
mcp__cctr-state__update_test_step → mcp__vict-state__update_test_step

Server Names (2):
cctr-playwright → vict-playwright
cctr-state      → vict-state
```

---

## Appendix C: Contact & Support

**Author**: Varun Israni
**GitHub**: [@varunisrani](https://github.com/varunisrani)
**Repository**: https://github.com/varunisrani/varun-israni-claude-tester

**For Issues**:
- GitHub Issues: https://github.com/varunisrani/varun-israni-claude-tester/issues
- Discussions: https://github.com/varunisrani/varun-israni-claude-tester/discussions

---

## Conclusion

This comprehensive rebranding plan transforms **skills-claude** into **Varun Israni Claude Tester (VICT)**, establishing personal brand identity while maintaining all technical functionality. The phased approach ensures safe, validated migration with clear rollback procedures.

**Next Steps**:
1. Review this plan with stakeholders
2. Create backup of current repository
3. Create feature branch: `git checkout -b feature/vict-rebranding`
4. Execute Phase 1 (Core Rebranding)
5. Run validation tests
6. Proceed through remaining phases

**Estimated Timeline**: 2-4 weeks
**Risk Level**: Low-Medium
**Complexity**: Medium

---

**Document Version**: 1.0
**Last Updated**: November 15, 2025
**Status**: Ready for Implementation
