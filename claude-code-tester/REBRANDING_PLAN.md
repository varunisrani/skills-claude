# Rebranding Plan: Claude Code Test Runner → Varun Israni Claude Tester

## Executive Summary

This document outlines a comprehensive plan to rebrand the "Claude Code Test Runner" project to "Varun Israni Claude Tester". The rebranding includes renaming, updating documentation, modifying configuration files, and ensuring all references are consistent across the codebase.

---

## 1. Project Overview

### Current State
- **Project Name**: Claude Code Test Runner
- **Repository**: claude-code-test-runner
- **Package Name**: claude-code-tests
- **CLI Executable**: cc-test-runner
- **Owner**: firstloophq

### Target State
- **Project Name**: Varun Israni Claude Tester
- **Repository**: varun-claude-tester
- **Package Name**: varun-claude-tester
- **CLI Executable**: vc-tester
- **Owner**: varunisrani

---

## 2. Rebranding Scope

### 2.1 Repository & Directory Structure

| Current | New | Action |
|---------|-----|--------|
| `claude-code-test-runner/` | `varun-claude-tester/` | Rename directory |
| `cli/` | `cli/` | Keep as is |
| `samples/` | `samples/` | Keep as is |
| `.github/` | `.github/` | Update workflow names |

### 2.2 Package Configuration

**File: `cli/package.json`**

Changes required:
```json
{
  "name": "claude-code-tests",           → "varun-claude-tester"

  "scripts": {
    "build": "bun build --compile ./src/index.ts --outfile ./dist/cc-test-runner --target bun"
           → "bun build --compile ./src/index.ts --outfile ./dist/vc-tester --target bun"
  }
}
```

### 2.3 CLI Executable

| Current | New |
|---------|-----|
| `cc-test-runner` | `vc-tester` |

**Files to update:**
- `cli/package.json` (build script)
- `README.md` (all examples)
- `.github/workflows/*.yml` (Docker image commands)
- `Dockerfile` (COPY command)

### 2.4 Docker Configuration

**File: `Dockerfile`**

```dockerfile
# Line 24 (current)
COPY --from=build /app/cli/dist/cc-test-runner /app/cc-test-runner

# Change to:
COPY --from=build /app/cli/dist/vc-tester /app/vc-tester
```

### 2.5 GitHub Actions Workflows

**File: `.github/workflows/build-and-publish.yml`**
- Update Docker image tags
- Update container name references

**File: `.github/workflows/sample-tests-action.yml`**
```yaml
# Line referencing executable (current)
run: /app/cc-test-runner --testsPath=...

# Change to:
run: /app/vc-tester --testsPath=...
```

**File: `.github/workflows/pull-request.yml`**
- Update job names (optional)
- Update Docker build context references

### 2.6 Documentation

**File: `README.md`**

Update all occurrences:

| Section | Current | New |
|---------|---------|-----|
| Title | Claude Code Test Runner | Varun Israni Claude Tester |
| CLI Tool Name | `cc-test-runner` | `vc-tester` |
| Package Name | `claude-code-tests` | `varun-claude-tester` |
| Example Commands | `./dist/cc-test-runner` | `./dist/vc-tester` |
| Owner References | firstloophq | varunisrani |

Example commands to update:
```bash
# Before
./dist/cc-test-runner --testsPath=./tests.json

# After
./dist/vc-tester --testsPath=./tests.json
```

### 2.7 Source Code References

**File: `cli/src/utils/test-reporter.ts`**

Update CTRF tool name:
```typescript
// Line ~XX (current)
tool: {
    name: "claude-code-tests",
    version: "1.0.0"
}

// Change to:
tool: {
    name: "varun-claude-tester",
    version: "1.0.0"
}
```

### 2.8 Sample Files

**File: `samples/thisinto-e2e-tests.json`**
- No changes required (test cases are project-agnostic)

---

## 3. Detailed Implementation Steps

### Phase 1: Local File Renaming

#### Step 1.1: Rename Root Directory
```bash
cd "C:\Users\Varun israni\skills-claude"
mv claude-code-test-runner varun-claude-tester
cd varun-claude-tester
```

#### Step 1.2: Update package.json
```bash
# File: cli/package.json
# Line 2: "name": "claude-code-tests" → "varun-claude-tester"
# Line 17: --outfile ./dist/cc-test-runner → --outfile ./dist/vc-tester
```

#### Step 1.3: Update Dockerfile
```bash
# File: Dockerfile
# Line 24: /app/cc-test-runner → /app/vc-tester
```

#### Step 1.4: Update GitHub Actions
```bash
# File: .github/workflows/sample-tests-action.yml
# Update all /app/cc-test-runner → /app/vc-tester
```

#### Step 1.5: Update Test Reporter
```bash
# File: cli/src/utils/test-reporter.ts
# Update tool name in CTRF generation
```

### Phase 2: Documentation Update

#### Step 2.1: Update README.md

Find and replace:
- `Claude Code Test Runner` → `Varun Israni Claude Tester`
- `cc-test-runner` → `vc-tester`
- `claude-code-tests` → `varun-claude-tester`
- `firstloophq` → `varunisrani`

#### Step 2.2: Add Branding Section
```markdown
## Credits

**Author**: Varun Israni
**Original Project**: Based on Claude Code Test Runner by FirstLoop HQ
**License**: MIT
```

### Phase 3: Git Repository Setup

#### Step 3.1: Initialize New Git Repository (if needed)
```bash
# If starting fresh
git init
git remote add origin https://github.com/varunisrani/varun-claude-tester.git
```

#### Step 3.2: Commit All Changes
```bash
git add .
git commit -m "Rebrand to Varun Israni Claude Tester

- Rename package from claude-code-tests to varun-claude-tester
- Rename CLI executable from cc-test-runner to vc-tester
- Update all documentation and configuration files
- Update Docker image references
- Update GitHub Actions workflows"
```

#### Step 3.3: Push to GitHub
```bash
git branch -M main
git push -u origin main
```

### Phase 4: Rebuild and Test

#### Step 4.1: Rebuild CLI
```bash
cd cli
bun install
bun run build
```

#### Step 4.2: Test CLI
```bash
./dist/vc-tester --testsPath=../samples/thisinto-e2e-tests.json
```

#### Step 4.3: Test Docker Build
```bash
docker build -t varun-claude-tester:latest .
```

### Phase 5: GitHub Repository Configuration

#### Step 5.1: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `varun-claude-tester`
3. Description: "E2E test automation using Claude Code with natural language test definitions - by Varun Israni"
4. Public/Private: Choose based on preference
5. Initialize with README: No (we have one)

#### Step 5.2: Update GitHub Actions Secrets
Add required secrets to the new repository:
- `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY`

#### Step 5.3: Configure GitHub Container Registry
Update Docker workflows to push to:
```
ghcr.io/varunisrani/varun-claude-tester:latest
```

---

## 4. File-by-File Change Checklist

### Configuration Files

- [ ] `cli/package.json`
  - [ ] Update `name` field
  - [ ] Update `build` script output path

- [ ] `Dockerfile`
  - [ ] Update COPY command for executable
  - [ ] Update final path reference

- [ ] `cli/tsconfig.json` (No changes)
- [ ] `cli/eslint.config.ts` (No changes)
- [ ] `.prettierrc.json` (No changes)
- [ ] `.gitignore` (No changes)

### GitHub Actions

- [ ] `.github/workflows/build-and-publish.yml`
  - [ ] Update image name/tags
  - [ ] Update repository references

- [ ] `.github/workflows/pull-request.yml`
  - [ ] Update workflow name (optional)

- [ ] `.github/workflows/sample-tests-action.yml`
  - [ ] Update container executable path
  - [ ] Update image references

### Source Code

- [ ] `cli/src/index.ts` (No changes)
- [ ] `cli/src/prompts/start-test.ts` (No changes)
- [ ] `cli/src/prompts/system.ts` (No changes)
- [ ] `cli/src/mcp/test-state/server.ts` (No changes)
- [ ] `cli/src/types/test-case.ts` (No changes)
- [ ] `cli/src/utils/args.ts` (No changes)
- [ ] `cli/src/utils/logger.ts` (No changes)

- [ ] `cli/src/utils/test-reporter.ts`
  - [ ] Update CTRF tool name

### Documentation

- [ ] `README.md`
  - [ ] Update title
  - [ ] Update all CLI command examples
  - [ ] Update Docker examples
  - [ ] Update repository URLs
  - [ ] Add credits section

- [ ] Create `REBRANDING_PLAN.md` (this file)

### Samples

- [ ] `samples/thisinto-e2e-tests.json` (No changes)

---

## 5. Naming Convention Reference

### Old Naming Scheme
- **Project**: Claude Code Test Runner
- **Package**: claude-code-tests
- **CLI**: cc-test-runner
- **Prefix**: cctr-
- **Owner**: firstloophq

### New Naming Scheme
- **Project**: Varun Israni Claude Tester
- **Package**: varun-claude-tester
- **CLI**: vc-tester
- **Prefix**: vct-
- **Owner**: varunisrani

### Abbreviation Mapping
- `cc` (Claude Code) → `vc` (Varun Claude)
- `cctr` (Claude Code Test Runner) → `vct` (Varun Claude Tester)

---

## 6. Testing Strategy

### Unit Testing
1. Verify package builds successfully
2. Confirm executable name is correct
3. Test CLI argument parsing

### Integration Testing
1. Run sample test cases
2. Verify CTRF report generation
3. Confirm Markdown summary creation
4. Check log file creation

### Docker Testing
1. Build Docker image
2. Run container with sample tests
3. Verify output artifacts

### GitHub Actions Testing
1. Push to repository
2. Trigger build-and-publish workflow
3. Verify Docker image in GHCR
4. Run sample tests workflow

---

## 7. Potential Issues and Mitigations

### Issue 1: Hard-coded References
**Risk**: Some files may have hard-coded strings that were missed
**Mitigation**: Perform global search for "claude-code-test", "cc-test-runner", "firstloop"

### Issue 2: Docker Image Caching
**Risk**: Old images may persist in local Docker cache
**Mitigation**: Use `docker system prune` and rebuild from scratch

### Issue 3: GitHub Actions Workflow Names
**Risk**: Workflow names may appear in GitHub UI inconsistently
**Mitigation**: Update all workflow `name:` fields for consistency

### Issue 4: MCP Server Names
**Risk**: MCP server names like "cctr-playwright" may need updating
**Decision**: Keep MCP server names as is (internal identifiers)

---

## 8. Post-Rebranding Tasks

### Immediate
- [ ] Test all CLI commands
- [ ] Verify Docker build and run
- [ ] Update GitHub repository settings
- [ ] Configure GitHub Actions secrets

### Short-term
- [ ] Add custom logo/branding
- [ ] Create comprehensive CHANGELOG.md
- [ ] Set up GitHub Pages (optional)
- [ ] Create release tags

### Long-term
- [ ] Publish to npm (optional)
- [ ] Create demo videos
- [ ] Write blog post about the tool
- [ ] Submit to awesome lists

---

## 9. Rollback Plan

If rebranding needs to be reverted:

1. Restore original directory name
2. Revert all package.json changes
3. Revert Dockerfile
4. Restore GitHub Actions workflows
5. Rebuild CLI with original name
6. Push revert commit to repository

---

## 10. Success Criteria

Rebranding is considered successful when:

- [ ] All builds complete without errors
- [ ] CLI executable runs with new name (`vc-tester`)
- [ ] Docker image builds and runs successfully
- [ ] GitHub Actions workflows execute correctly
- [ ] All documentation reflects new branding
- [ ] No references to old names remain (except credits)
- [ ] CTRF reports show new tool name
- [ ] GitHub repository is properly configured

---

## 11. Timeline Estimate

| Phase | Estimated Time | Complexity |
|-------|----------------|------------|
| Local File Renaming | 15 minutes | Low |
| Documentation Update | 30 minutes | Low |
| Git Repository Setup | 10 minutes | Low |
| Rebuild and Test | 20 minutes | Medium |
| GitHub Configuration | 15 minutes | Low |
| **Total** | **~90 minutes** | **Low-Medium** |

---

## 12. Additional Recommendations

### Branding Enhancements
1. Add custom ASCII art banner to CLI output
2. Create logo/icon for GitHub repository
3. Update terminal output colors/themes
4. Add version information with attribution

### Code Improvements (Optional)
1. Add `--version` flag showing "Varun Israni Claude Tester v1.0.0"
2. Add `--about` flag with project credits
3. Include link to personal website/portfolio

### Marketing
1. Create Twitter/LinkedIn announcement
2. Write blog post explaining the tool
3. Submit to Product Hunt (optional)
4. Share in relevant Discord/Slack communities

---

## Appendix A: Global Search & Replace Commands

### Using `sed` (Linux/Mac)
```bash
# Replace package name
find . -type f -name "*.md" -exec sed -i 's/claude-code-tests/varun-claude-tester/g' {} +

# Replace CLI name
find . -type f -name "*.md" -exec sed -i 's/cc-test-runner/vc-tester/g' {} +

# Replace project name
find . -type f -name "*.md" -exec sed -i 's/Claude Code Test Runner/Varun Israni Claude Tester/g' {} +
```

### Using PowerShell (Windows)
```powershell
# Replace in all Markdown files
Get-ChildItem -Recurse -Filter *.md | ForEach-Object {
    (Get-Content $_.FullName) -replace 'claude-code-tests', 'varun-claude-tester' | Set-Content $_.FullName
}
```

---

## Appendix B: Quick Reference - All Files to Modify

### Must Change
1. `cli/package.json` - name, build script
2. `Dockerfile` - COPY command
3. `README.md` - all references
4. `.github/workflows/sample-tests-action.yml` - executable path
5. `cli/src/utils/test-reporter.ts` - CTRF tool name

### Optional Change
6. `.github/workflows/build-and-publish.yml` - image names
7. `.github/workflows/pull-request.yml` - workflow names

### No Change Required
- All TypeScript source files (except test-reporter.ts)
- Sample test files
- Configuration files (tsconfig, eslint, prettier)
- MCP server implementations

---

## Conclusion

This rebranding plan provides a comprehensive roadmap for transforming the Claude Code Test Runner into Varun Israni Claude Tester. The changes are straightforward, low-risk, and can be completed in approximately 90 minutes. Following this plan ensures consistency across all project assets while maintaining the core functionality and architecture of the original tool.

**Next Steps**: Begin with Phase 1 (Local File Renaming) and proceed sequentially through all phases, checking off items as they're completed.
