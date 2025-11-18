# Claude Code Skills - Usage Guide

This guide provides detailed instructions on how to use, import, and integrate skills from this collection into your projects.

## Table of Contents
- [Understanding Claude Code Skills](#understanding-claude-code-skills)
- [Quick Start](#quick-start)
- [Importing Skills to Your Project](#importing-skills-to-your-project)
- [Using Skills in Claude Code](#using-skills-in-claude-code)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Understanding Claude Code Skills

Claude Code skills are reusable knowledge modules that provide Claude with specialized expertise in specific domains. When you invoke a skill, Claude gains access to:

- Domain-specific best practices and patterns
- Code templates and examples
- Step-by-step implementation guides
- Common pitfalls and how to avoid them

Skills are stored as markdown files with YAML frontmatter that defines metadata and configuration.

## Quick Start

### 1. Browse Available Skills
Navigate to the category that matches your needs:

```bash
# View all skills
ls claude_code_skills/all-skills/

# View skills by category
ls claude_code_skills/backend-development/
ls claude_code_skills/frontend-development/
ls claude_code_skills/ai-llm/
```

### 2. Read a Skill
Each skill folder contains a markdown file with the skill content:

```bash
# Example: Read the FastAPI templates skill
cat claude_code_skills/all-skills/fastapi-templates/skill.md
```

### 3. Use a Skill
In your Claude Code session, invoke the skill:

```
Use the fastapi-templates skill to help me create a new API
```

## Importing Skills to Your Project

There are several methods to make skills available in your project:

### Method 1: Copy Specific Skills (Recommended for Most Projects)

Copy only the skills you need to your project's `.claude/skills/` directory:

```bash
# Navigate to your project
cd /path/to/your/project

# Create skills directory if it doesn't exist
mkdir -p .claude/skills

# Copy a single skill
cp -r /path/to/claude_code_skills/all-skills/fastapi-templates .claude/skills/

# Copy multiple skills
cp -r /path/to/claude_code_skills/all-skills/{fastapi-templates,python-testing-patterns,api-design-principles} .claude/skills/

# Copy an entire category
cp -r /path/to/claude_code_skills/backend-development/* .claude/skills/
```

**Advantages:**
- Only includes skills you actually use
- Keeps your project directory clean
- Easy to version control
- No dependencies on external paths

**Use when:**
- You know which specific skills you need
- You want to version control your skills
- You're working on a single project

### Method 2: Symlink the Skills Directory (Best for Multiple Projects)

Create a symbolic link to the entire skills collection:

```bash
# On Unix/Linux/Mac
cd /path/to/your/project
mkdir -p .claude
ln -s /path/to/claude_code_skills .claude/skills

# On Windows (requires administrator privileges)
cd C:\path\to\your\project
mkdir .claude
mklink /D ".claude\skills" "C:\path\to\claude_code_skills"
```

**Advantages:**
- Automatically get updates when skills are modified
- All skills available in all projects
- Saves disk space
- Single source of truth

**Use when:**
- You work on multiple projects
- You want to keep skills centralized
- You update skills frequently

### Method 3: Symlink Specific Categories

Create symlinks to specific category folders:

```bash
# Link only backend skills
cd /path/to/your/project/.claude
ln -s /path/to/claude_code_skills/backend-development backend-skills

# Link only AI/LLM skills
ln -s /path/to/claude_code_skills/ai-llm ai-skills
```

**Advantages:**
- Access to entire categories
- Organized by domain
- Still gets updates

**Use when:**
- You work primarily in specific domains
- You want some organization but not all skills

### Method 4: Environment Variable (Advanced)

Set up a global skills directory that Claude Code can reference:

```bash
# Add to your .bashrc, .zshrc, or equivalent
export CLAUDE_SKILLS_PATH="/path/to/claude_code_skills/all-skills"
```

Then configure your Claude Code settings to reference this path.

**Advantages:**
- Global access across all projects
- Centralized management
- Easy to update

**Use when:**
- You're an advanced user
- You want system-wide skill access
- You manage multiple development environments

## Using Skills in Claude Code

### Basic Invocation

Simply mention the skill name in your conversation:

```
I need help with authentication. Use the auth-implementation-patterns skill.
```

### Combining Multiple Skills

You can reference multiple skills in a single request:

```
I'm building a FastAPI application with Stripe payments.
Use the fastapi-templates and stripe-integration skills.
```

### Context-Aware Usage

Claude Code will automatically detect when a skill might be useful:

```
User: "I need to implement OAuth2 authentication in my API"
Claude: "I'll use the auth-implementation-patterns skill to help you implement OAuth2..."
```

### Asking for Skill Recommendations

```
What skills are available for building a payment processing system?
```

Claude will suggest relevant skills like:
- `stripe-integration`
- `paypal-integration`
- `billing-automation`
- `pci-compliance`

## Best Practices

### 1. Start with the Right Category
Browse categories to find relevant skills before starting your task:

- **Backend work?** → Check `backend-development/`
- **Frontend work?** → Check `frontend-development/`
- **Building AI features?** → Check `ai-llm/`

### 2. Combine Related Skills
Use multiple complementary skills together:

```
For a full-stack application:
- frontend-dev-guidelines
- nodejs-backend-patterns
- api-design-principles
- github-actions-templates
```

### 3. Keep Skills Updated
If you're using symlinks, periodically pull updates:

```bash
cd /path/to/claude_code_skills
git pull origin main
```

If you copied skills, re-copy them when updates are available.

### 4. Customize Skills for Your Team
Create project-specific variations:

```bash
# Copy a skill as a template
cp -r claude_code_skills/all-skills/fastapi-templates my-project/.claude/skills/our-api-template

# Edit to add your team's conventions
vim my-project/.claude/skills/our-api-template/skill.md
```

### 5. Version Control Your Skills
If you copy skills to your project, commit them:

```bash
git add .claude/skills/
git commit -m "Add Claude Code skills for API development"
```

## Troubleshooting

### Skill Not Found

**Problem:** Claude Code says it can't find a skill.

**Solutions:**
1. Verify the skill exists in `.claude/skills/`:
   ```bash
   ls .claude/skills/
   ```

2. Check the skill name matches exactly:
   ```bash
   ls -la .claude/skills/ | grep "skill-name"
   ```

3. Ensure the skill folder contains a valid skill file

4. Try restarting Claude Code

### Symlink Not Working

**Problem:** Symbolic link doesn't work on Windows.

**Solutions:**
1. Run Command Prompt or PowerShell as Administrator

2. Use the correct Windows syntax:
   ```cmd
   mklink /D "target" "source"
   ```

3. Alternatively, copy the skills instead of symlinking

### Skill Not Loading Properly

**Problem:** Skill loads but doesn't work as expected.

**Solutions:**
1. Check the skill file format (should be valid markdown with YAML frontmatter)

2. Verify the skill is compatible with your Claude Code version

3. Try using the skill from the `all-skills/` directory directly

4. Check for any error messages in Claude Code output

### Too Many Skills

**Problem:** Claude Code is slow or overwhelmed with too many skills.

**Solutions:**
1. Only copy the skills you actively use

2. Organize skills by project in separate directories

3. Use category folders instead of `all-skills/`

4. Remove unused skills from your project

## Advanced Usage

### Creating Custom Skill Collections

Create your own curated collections:

```bash
# Create a custom category
mkdir -p .claude/skills/my-team-skills

# Copy and customize relevant skills
cp -r claude_code_skills/all-skills/fastapi-templates .claude/skills/my-team-skills/
cp -r claude_code_skills/all-skills/python-testing-patterns .claude/skills/my-team-skills/

# Add your own custom skills
# Edit and customize for your team's specific needs
```

### Sharing Skills Across Teams

1. **Fork this repository**
2. **Add your team's custom skills**
3. **Share the repository URL with team members**
4. **Team members clone and symlink**:
   ```bash
   git clone https://github.com/your-team/claude-skills
   ln -s /path/to/claude-skills your-project/.claude/skills
   ```

### Building Your Own Skills

Use the `Skill Builder` skill to create new skills:

```
Use the Skill Builder skill to help me create a new skill for GraphQL API development
```

Follow the Claude Code skill format:
- YAML frontmatter with metadata
- Progressive disclosure structure
- Examples and code templates
- Clear use cases and when to apply

## Getting Help

### Skill-Specific Help
Each skill should contain documentation on:
- When to use it
- Key concepts
- Examples
- Common patterns

### General Claude Code Help
- Documentation: https://code.claude.com/docs
- Issues: https://github.com/anthropics/claude-code/issues
- Community: Claude Code Discord or forums

### This Collection
- Browse the README.md for skill descriptions
- Check individual skill folders for detailed documentation
- Create issues for problems or suggestions

---

**Happy Coding with Claude Code Skills!**
