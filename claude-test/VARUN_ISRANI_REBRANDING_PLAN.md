# Varun Israni Claude Tester - Rebranding Plan

## Executive Summary

This document outlines the complete rebranding strategy for converting the **Claude Code Test Runner** to **Varun Israni Claude Tester (VICT)**. The rebranding involves updating 100+ references across 14+ files while maintaining full functionality.

---

## 1. Rebranding Strategy

### Current Branding
- **Project Name:** Claude Code Test Runner
- **Package Name:** claude-code-tests
- **CLI Binary:** cc-test-runner
- **MCP Prefix:** cctr-
- **Tool Prefix:** mcp__cctr-*
- **Purpose:** Generic E2E test automation using Claude Code

### New Branding
- **Project Name:** Varun Israni Claude Tester (VICT)
- **Package Name:** varun-israni-claude-tester
- **CLI Binary:** vict-runner
- **MCP Prefix:** vict-
- **Tool Prefix:** mcp__vict-*
- **Purpose:** Personalized AI-powered testing framework by Varun Israni

### Branding Rationale
- **Personal Brand:** Associates the tool with Varun Israni's name
- **Professional Identity:** Establishes ownership and authorship
- **Memorable Acronym:** VICT (Victory in Claude Testing)
- **Unique Identifier:** Distinguishes from generic Claude Code projects

---

## 2. Comprehensive Change Inventory

### 2.1 Package & Project Names (5 locations)

| File | Current Value | New Value | Line/Location |
|------|---------------|-----------|---------------|
| `cli/package.json` | `"name": "claude-code-tests"` | `"name": "varun-israni-claude-tester"` | Line 2 |
| `cli/src/utils/test-reporter.ts` | `name: "claude-code-tests"` | `name: "varun-israni-claude-tester"` | Line 63 |
| `README.md` | `# Claude Code Test Runner` | `# Varun Israni Claude Tester (VICT)` | Line 1 |
| `README.md` | Various references | Update to VICT | Multiple |
| `cli/bun.lock` | `"claude-code-tests"` | Auto-updates on `bun install` | Line 5 |

### 2.2 CLI Binary Names (8 locations)

| File | Current Value | New Value |
|------|---------------|-----------|
| `cli/package.json` | `./dist/cc-test-runner` | `./dist/vict-runner` |
| `README.md` | `cc-test-runner` (8 occurrences) | `vict-runner` |
| `Dockerfile` | `/app/cc-test-runner` | `/app/vict-runner` |
| `S/workflows/sample-tests-action.yml` | `/app/cc-test-runner` | `/app/vict-runner` |

### 2.3 MCP Server Names (4 locations)

| File | Current Value | New Value |
|------|---------------|-----------|
| `cli/src/mcp/test-state/server.ts` | `name: "test-state-server"` | `name: "vict-state-server"` |
| `cli/src/prompts/start-test.ts` | `"cctr-playwright"` | `"vict-playwright"` |
| `cli/src/prompts/start-test.ts` | `"cctr-state"` | `"vict-state"` |
| `cli/src/mcp/test-state/server.ts` | `'testState MCP Server running'` | `'VICT State MCP Server running'` |

### 2.4 MCP Tool Prefixes (30+ locations)

**All tools in `cli/src/prompts/start-test.ts` (lines 47-73):**

Replace `mcp__cctr-playwright__*` with `mcp__vict-playwright__*`:
- `mcp__vict-playwright__browser_close`
- `mcp__vict-playwright__browser_resize`
- `mcp__vict-playwright__browser_console_messages`
- `mcp__vict-playwright__browser_handle_dialog`
- `mcp__vict-playwright__browser_evaluate`
- `mcp__vict-playwright__browser_file_upload`
- `mcp__vict-playwright__browser_install`
- `mcp__vict-playwright__browser_press_key`
- `mcp__vict-playwright__browser_type`
- `mcp__vict-playwright__browser_navigate`
- `mcp__vict-playwright__browser_navigate_back`
- `mcp__vict-playwright__browser_navigate_forward`
- `mcp__vict-playwright__browser_network_requests`
- `mcp__vict-playwright__browser_snapshot`
- `mcp__vict-playwright__browser_click`
- `mcp__vict-playwright__browser_drag`
- `mcp__vict-playwright__browser_hover`
- `mcp__vict-playwright__browser_select_option`
- `mcp__vict-playwright__browser_tab_list`
- `mcp__vict-playwright__browser_tab_new`
- `mcp__vict-playwright__browser_tab_select`
- `mcp__vict-playwright__browser_tab_close`
- `mcp__vict-playwright__browser_take_screenshot`
- `mcp__vict-playwright__browser_wait_for`
- `mcp__vict-state__get_test_plan`
- `mcp__vict-state__update_test_step`

**System Prompt Updates (`cli/src/prompts/system.ts`):**
- Replace all `mcp__cctr-` prefixes with `mcp__vict-`
- Lines: 10, 15, 19, 24, 25

### 2.5 Documentation Updates (README.md - 30+ locations)

| Section | Change Type | Details |
|---------|-------------|---------|
| Title (Line 1) | Complete replacement | `# Varun Israni Claude Tester (VICT)` |
| Subtitle (Line 3) | Add attribution | "Created by Varun Israni - Full E2E test automation using Claude Code" |
| Section Headers | Update references | Replace "Claude Code Test Runner" with "VICT" |
| Architecture Diagram | Component names | Update STATE, RUNNER labels to VICT equivalents |
| Usage Examples | CLI commands | Replace `cc-test-runner` with `vict-runner` |
| Installation | Package name | Update all package references |
| MCP References | Component names | "VICT State MCP", "VICT Playwright Integration" |

### 2.6 GitHub Actions Workflows (5 locations)

| File | Current | New |
|------|---------|-----|
| `S/workflows/sample-tests-action.yml` | `name: Test Claude Code Action` | `name: Test VICT Action` |
| `S/workflows/sample-tests-action.yml` | `- name: Run Claude Code Tests` | `- name: Run VICT Tests` |
| `S/workflows/sample-tests-action.yml` | `/app/cc-test-runner` | `/app/vict-runner` |
| `S/workflows/pull-request.yml` | Keep as-is (generic) | Optional: Add VICT branding |
| `S/workflows/build-and-publish.yml` | Keep as-is (generic) | Optional: Update description |

### 2.7 Dockerfile (3 locations)

| Line | Current | New |
|------|---------|-----|
| 44 | `--outfile ./dist/cc-test-runner` | `--outfile ./dist/vict-runner` |
| 44 | `COPY --from=build /app/cli/dist/cc-test-runner` | `COPY --from=build /app/cli/dist/vict-runner` |
| 44 | `/app/cc-test-runner` | `/app/vict-runner` |

### 2.8 Code Comments (15+ locations)

| File | Update Type |
|------|-------------|
| `cli/src/prompts/system.ts` | Update comment references to "VICT query" |
| `cli/src/prompts/start-test.ts` | Update JSDoc comments with VICT branding |
| `cli/src/index.ts` | Update log messages with VICT references |
| `cli/src/utils/args.ts` | Update help text descriptions |
| `Dockerfile` | Update comments about VICT CLI |

### 2.9 Sample Data (Optional - 7 locations)

| File | Current | Suggested New |
|------|---------|---------------|
| `samples/thisinto-e2e-tests.json` | Sample domain references | Keep as-is (examples) |
| Rename file | `thisinto-e2e-tests.json` | `vict-sample-tests.json` |

---

## 3. Implementation Plan

### Phase 1: Core Package Updates (Priority: CRITICAL)
**Estimated Time:** 30 minutes

1. **Update package.json**
   - Change package name to `varun-israni-claude-tester`
   - Update build script to output `vict-runner`
   - Update description field with Varun Israni attribution

2. **Update test reporter**
   - File: `cli/src/utils/test-reporter.ts:63`
   - Change name to `varun-israni-claude-tester`

3. **Regenerate lockfile**
   - Run `bun install` to update `bun.lock`

### Phase 2: MCP Architecture Updates (Priority: CRITICAL)
**Estimated Time:** 45 minutes

1. **Update MCP server names**
   - File: `cli/src/mcp/test-state/server.ts`
   - Change server name to `vict-state-server`
   - Update log messages

2. **Update MCP server keys**
   - File: `cli/src/prompts/start-test.ts`
   - Change `cctr-playwright` → `vict-playwright`
   - Change `cctr-state` → `vict-state`

3. **Update all MCP tool prefixes**
   - File: `cli/src/prompts/start-test.ts` (lines 47-73)
   - Replace all `mcp__cctr-` with `mcp__vict-`
   - 26 tool names to update

4. **Update system prompt**
   - File: `cli/src/prompts/system.ts`
   - Replace all `mcp__cctr-` with `mcp__vict-`
   - Update description text

### Phase 3: CLI Binary & Build System (Priority: HIGH)
**Estimated Time:** 20 minutes

1. **Update build script**
   - File: `cli/package.json:17`
   - Change output to `./dist/vict-runner`

2. **Update Dockerfile**
   - File: `Dockerfile:44`
   - Change all `cc-test-runner` references to `vict-runner`

3. **Update GitHub Actions**
   - File: `S/workflows/sample-tests-action.yml`
   - Change `/app/cc-test-runner` to `/app/vict-runner`
   - Update workflow name and step names

### Phase 4: Documentation (Priority: HIGH)
**Estimated Time:** 60 minutes

1. **Update README.md title and introduction**
   - Line 1: New title with VICT branding
   - Line 3: Add "Created by Varun Israni" attribution
   - Update all section headers

2. **Update architecture diagrams**
   - Update component labels (lines 112-118)
   - Change STATE, RUNNER references to VICT equivalents

3. **Update usage examples**
   - Replace all `cc-test-runner` with `vict-runner`
   - Lines: 53, 64, 80, 83, 86

4. **Update component descriptions**
   - Lines 139-148: Update MCP component names
   - Add Varun Israni attribution section

### Phase 5: Code Comments & Documentation (Priority: MEDIUM)
**Estimated Time:** 30 minutes

1. **Update TypeScript comments**
   - `cli/src/prompts/system.ts:4`
   - `cli/src/prompts/start-test.ts:8,10`
   - `cli/src/index.ts:23`
   - `cli/src/utils/args.ts:19,21`

2. **Update Dockerfile comments**
   - Lines 1-3, 18

### Phase 6: Sample Data & Examples (Priority: LOW)
**Estimated Time:** 15 minutes

1. **Rename sample file**
   - `samples/thisinto-e2e-tests.json` → `samples/vict-sample-tests.json`

2. **Update workflow references**
   - Update sample path in workflows

3. **Optional: Update sample content**
   - Keep existing examples or create new ones

### Phase 7: Testing & Validation (Priority: CRITICAL)
**Estimated Time:** 45 minutes

1. **Build verification**
   - Run `bun run build`
   - Verify output at `./dist/vict-runner`
   - Test CLI execution

2. **Linting verification**
   - Run `bun run lint`
   - Fix any issues

3. **Docker build verification**
   - Build Docker image
   - Test containerized execution

4. **MCP integration testing**
   - Verify MCP server starts correctly
   - Test tool invocation with new prefixes
   - Validate test execution

5. **GitHub Actions testing**
   - Trigger workflow manually
   - Verify successful execution

---

## 4. Detailed File Change Checklist

### ✅ Must Update (Critical)

- [ ] `cli/package.json` (name, build script)
- [ ] `cli/src/utils/test-reporter.ts` (name property)
- [ ] `cli/src/mcp/test-state/server.ts` (server name, logs)
- [ ] `cli/src/prompts/start-test.ts` (MCP keys, 26 tool names)
- [ ] `cli/src/prompts/system.ts` (tool references, descriptions)
- [ ] `Dockerfile` (binary name in 3 places)
- [ ] `S/workflows/sample-tests-action.yml` (binary path, names)
- [ ] `README.md` (title, examples, architecture)

### ⚠️ Should Update (High Priority)

- [ ] `cli/src/index.ts` (log messages, comments)
- [ ] `cli/src/utils/args.ts` (help text, descriptions)
- [ ] `S/workflows/pull-request.yml` (workflow name)
- [ ] `S/workflows/build-and-publish.yml` (workflow name)

### 📝 Optional Updates (Medium/Low Priority)

- [ ] `samples/thisinto-e2e-tests.json` (rename file, update content)
- [ ] `cli/init.dev.sh` (comments)
- [ ] All code comments with "Claude Code" references

---

## 5. Search & Replace Patterns

### Pattern 1: Package Name
```bash
# Find all instances
grep -r "claude-code-tests" .

# Replace
claude-code-tests → varun-israni-claude-tester
```

### Pattern 2: CLI Binary Name
```bash
# Find all instances
grep -r "cc-test-runner" .

# Replace
cc-test-runner → vict-runner
```

### Pattern 3: MCP Server Prefix
```bash
# Find all instances
grep -r "cctr-" .

# Replace
cctr- → vict-
```

### Pattern 4: MCP Tool Prefix
```bash
# Find all instances
grep -r "mcp__cctr-" .

# Replace
mcp__cctr- → mcp__vict-
```

### Pattern 5: Project Title
```bash
# Find all instances
grep -r "Claude Code Test Runner" .

# Replace
Claude Code Test Runner → Varun Israni Claude Tester (VICT)
```

---

## 6. New README Structure

### Suggested Outline

```markdown
# Varun Israni Claude Tester (VICT)

> Created by **Varun Israni** - AI-Powered E2E Test Automation Framework

## Overview

VICT (Varun Israni Claude Tester) enables full E2E test automation using Claude Code
with natural language test definitions through the Playwright MCP.

## Why VICT?

Traditional E2E tests are brittle and maintenance-heavy. VICT leverages Claude's
visual understanding and adaptive reasoning to create resilient, human-like test
execution.

## Features

- 🤖 Natural language test definitions
- 🎯 Intelligent element selection
- 🔄 Adaptive to UI changes
- 📊 Comprehensive test reporting
- 🐳 Docker-ready for CI/CD
- ⚡ Built with Bun + TypeScript

## Quick Start

### Installation

```bash
# Install CLI globally
bun install -g varun-israni-claude-tester

# Or use Docker
docker pull ghcr.io/[username]/varun-israni-claude-tester:main
```

### Usage

```bash
# Run tests
./dist/vict-runner --testsPath=./tests.json

# With options
./dist/vict-runner \
  --testsPath=./tests.json \
  --resultsPath=./results \
  --verbose \
  --screenshots
```

## Architecture

[Updated architecture diagram with VICT branding]

## About the Author

**Varun Israni** is [add bio/description here]

## License

[Add license information]
```

---

## 7. Post-Rebranding Tasks

### Immediate (Day 1)
1. Run full test suite
2. Update GitHub repository settings
   - Repository name (if applicable)
   - Description
   - Topics/tags
3. Update Docker registry tags
4. Update any external documentation

### Short-term (Week 1)
1. Create new logo/branding assets
2. Update social media references
3. Announce rebranding (if public)
4. Update any blog posts or articles

### Long-term (Month 1)
1. Monitor for any missed references
2. Update external integrations
3. Gather feedback from users
4. Consider domain/website updates

---

## 8. Risk Assessment & Mitigation

### Risk 1: Breaking Changes in MCP Tools
**Impact:** HIGH
**Probability:** MEDIUM
**Mitigation:**
- Maintain backward compatibility temporarily
- Add migration guide for existing users
- Test thoroughly before release

### Risk 2: Docker Image Registry
**Impact:** MEDIUM
**Probability:** LOW
**Mitigation:**
- Create new registry path
- Maintain old images with deprecation notice
- Update all CI/CD pipelines

### Risk 3: Lost Search/Discovery
**Impact:** MEDIUM
**Probability:** MEDIUM
**Mitigation:**
- Keep Claude Code references in description/keywords
- Add redirect documentation
- Update package keywords

### Risk 4: Incomplete Updates
**Impact:** HIGH
**Probability:** LOW
**Mitigation:**
- Use comprehensive search patterns
- Manual code review
- Automated testing
- Phased rollout

---

## 9. Rollback Plan

If critical issues arise post-rebranding:

1. **Immediate Actions:**
   - Revert git commits: `git revert [commit-hash]`
   - Restore Docker images from backup tags
   - Restore npm package versions

2. **Communication:**
   - Notify users of rollback
   - Document issues encountered
   - Plan corrective actions

3. **Recovery:**
   - Fix identified issues in separate branch
   - Test thoroughly
   - Re-attempt rebranding with corrections

---

## 10. Success Criteria

### Technical
- ✅ All tests pass with new branding
- ✅ Docker builds successfully
- ✅ GitHub Actions workflows complete
- ✅ No broken references in code
- ✅ Documentation is accurate and complete

### Functional
- ✅ CLI tool runs with new binary name
- ✅ MCP servers connect with new names
- ✅ All tool invocations work correctly
- ✅ Test reporting shows new package name
- ✅ Sample tests execute successfully

### Quality
- ✅ No linting errors
- ✅ No TypeScript compilation errors
- ✅ No unused dependencies (knip passes)
- ✅ Code formatting consistent
- ✅ Documentation professional and clear

---

## 11. Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Core Package | 30 min | None |
| Phase 2: MCP Architecture | 45 min | Phase 1 complete |
| Phase 3: CLI & Build | 20 min | Phase 1 complete |
| Phase 4: Documentation | 60 min | Phases 1-3 complete |
| Phase 5: Comments | 30 min | Phases 1-4 complete |
| Phase 6: Sample Data | 15 min | Any phase complete |
| Phase 7: Testing | 45 min | All phases complete |
| **TOTAL** | **~4 hours** | Sequential execution |

**Parallel Execution:** ~2.5 hours (if phases 2-6 done concurrently)

---

## 12. Maintenance Plan

### Ongoing
- Monitor for hardcoded references
- Update dependencies regularly
- Review user feedback
- Maintain documentation accuracy

### Quarterly
- Review branding consistency
- Update examples and samples
- Refresh documentation
- Check for deprecated references

### Annually
- Comprehensive brand audit
- User survey on naming/branding
- Consider evolutionary updates
- Archive old documentation

---

## 13. Contact & Support

**Project Owner:** Varun Israni
**Repository:** [Add GitHub URL]
**Issues:** [Add issues URL]
**Discussions:** [Add discussions URL]

---

## Appendix A: Complete File List

### Files Requiring Updates (14 files)

1. `/home/user/skills-claude/claude-test/README.md`
2. `/home/user/skills-claude/claude-test/cli/package.json`
3. `/home/user/skills-claude/claude-test/cli/src/prompts/start-test.ts`
4. `/home/user/skills-claude/claude-test/cli/src/prompts/system.ts`
5. `/home/user/skills-claude/claude-test/cli/src/index.ts`
6. `/home/user/skills-claude/claude-test/cli/src/utils/args.ts`
7. `/home/user/skills-claude/claude-test/cli/src/utils/test-reporter.ts`
8. `/home/user/skills-claude/claude-test/cli/src/mcp/test-state/server.ts`
9. `/home/user/skills-claude/claude-test/Dockerfile`
10. `/home/user/skills-claude/claude-test/S/workflows/sample-tests-action.yml`
11. `/home/user/skills-claude/claude-test/S/workflows/pull-request.yml`
12. `/home/user/skills-claude/claude-test/S/workflows/build-and-publish.yml`
13. `/home/user/skills-claude/claude-test/samples/thisinto-e2e-tests.json`
14. `/home/user/skills-claude/claude-test/cli/init.dev.sh`

### Files Auto-Updated (2 files)

1. `/home/user/skills-claude/claude-test/cli/bun.lock` (via `bun install`)
2. Any generated documentation

---

## Appendix B: Verification Commands

```bash
# Verify all old references removed
grep -r "claude-code-tests" .
grep -r "cc-test-runner" .
grep -r "mcp__cctr-" .

# Build and test
cd cli
bun install
bun run lint
bun run build

# Test execution
./dist/vict-runner --help
./dist/vict-runner --testsPath=../samples/vict-sample-tests.json

# Docker build
docker build -t vict:test .

# Docker test
docker run -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY vict:test /app/vict-runner --help
```

---

## Appendix C: Brand Identity Guidelines

### Logo/Visual Identity
- **Primary Color:** [TBD - suggest Claude orange/blue palette]
- **Secondary Colors:** [TBD]
- **Typography:** Modern, technical sans-serif
- **Icon/Logo:** [TBD - consider "VI" or "VICT" monogram]

### Voice & Tone
- **Professional:** Technical excellence and reliability
- **Personal:** "Built by Varun Israni" - individual craftsmanship
- **Innovative:** Cutting-edge AI technology
- **Accessible:** Easy to use and understand

### Messaging
- **Tagline Options:**
  - "Victory in Claude Testing"
  - "AI-Powered Testing by Varun Israni"
  - "Your Personal Claude Test Framework"
  - "Intelligent E2E Testing, Personalized"

---

**Document Version:** 1.0
**Created:** 2025-11-16
**Last Updated:** 2025-11-16
**Author:** Claude (Anthropic)
**For:** Varun Israni
