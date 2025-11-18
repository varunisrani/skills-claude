# Quick Reference - Claude Code Skills

## Skills by Category - Quick Lookup

### Backend Development (6 skills)
| Skill | Use Case |
|-------|----------|
| `async-python-patterns` | Async APIs, concurrent systems, I/O-bound applications |
| `fastapi-templates` | New FastAPI projects, backend API setup |
| `nodejs-backend-patterns` | Node.js services, Express/Fastify backends |
| `python-packaging` | Python libraries, CLI tools, PyPI distribution |
| `python-performance-optimization` | Performance bottlenecks, code optimization |
| `python-testing-patterns` | Python tests, pytest, TDD |

### Frontend Development (5 skills)
| Skill | Use Case |
|-------|----------|
| `frontend-dev-guidelines` | React/TypeScript apps, modern frontend patterns |
| `javascript-testing-patterns` | Jest, Vitest, Testing Library |
| `modern-javascript-patterns` | ES6+, functional programming |
| `typescript-advanced-types` | Type-safe applications, advanced TypeScript |
| `webapp-testing` | E2E testing, web application testing |

### Architecture & Design (4 skills)
| Skill | Use Case |
|-------|----------|
| `api-design-principles` | REST/GraphQL APIs, API specifications |
| `architecture-patterns` | Clean Architecture, DDD, system design |
| `microservices-patterns` | Distributed systems, microservices |
| `multi-cloud-architecture` | Multi-cloud systems, cloud strategy |

### DevOps & Infrastructure (5 skills)
| Skill | Use Case |
|-------|----------|
| `cost-optimization` | Cloud cost reduction, resource optimization |
| `deployment-pipeline-design` | CI/CD pipelines, GitOps |
| `github-actions-templates` | GitHub Actions, workflow automation |
| `hybrid-cloud-networking` | Hybrid cloud, VPN, cross-premises networking |
| `secrets-management` | Credentials, secret rotation, secure CI/CD |

### AI & LLM (7 skills)
| Skill | Use Case |
|-------|----------|
| `claude-agent-sdk` | Claude SDK agents |
| `claude-sdk-agent-generator` | Agent generation, templates |
| `langchain-architecture` | LangChain apps, AI agents |
| `llm-evaluation` | LLM testing, performance metrics |
| `mcp-builder` | MCP servers, LLM tool integration |
| `prompt-engineering-patterns` | Prompt optimization, LLM outputs |
| `rag-implementation` | RAG systems, vector databases, knowledge Q&A |

### Security & Authentication (2 skills)
| Skill | Use Case |
|-------|----------|
| `auth-implementation-patterns` | JWT, OAuth2, RBAC, session management |
| `pci-compliance` | Payment security, PCI DSS compliance |

### Payments & Billing (3 skills)
| Skill | Use Case |
|-------|----------|
| `billing-automation` | Subscription billing, recurring payments |
| `paypal-integration` | PayPal payments, checkout flows |
| `stripe-integration` | Stripe payments, subscriptions |

### Code Quality & Testing (3 skills)
| Skill | Use Case |
|-------|----------|
| `code-review-excellence` | PR reviews, code review standards |
| `debugging-strategies` | Bug investigation, root cause analysis |
| `error-handling-patterns` | Error handling, resilient applications |

### Tools & Utilities (2 skills)
| Skill | Use Case |
|-------|----------|
| `Skill Builder` | Create custom skills, skill templates |
| `uv-package-manager` | Modern Python package management |

---

## Common Task → Skill Mapping

### I want to build...

**A new API**
- `api-design-principles`
- `fastapi-templates` (Python)
- `nodejs-backend-patterns` (Node.js)

**A frontend application**
- `frontend-dev-guidelines`
- `modern-javascript-patterns`
- `javascript-testing-patterns`

**An AI-powered application**
- `langchain-architecture`
- `rag-implementation`
- `prompt-engineering-patterns`
- `llm-evaluation`

**A payment system**
- `stripe-integration` or `paypal-integration`
- `billing-automation`
- `pci-compliance`

**A microservices architecture**
- `microservices-patterns`
- `api-design-principles`
- `architecture-patterns`

**CI/CD pipeline**
- `github-actions-templates`
- `deployment-pipeline-design`
- `secrets-management`

**Authentication system**
- `auth-implementation-patterns`

**MCP server**
- `mcp-builder`

### I need to...

**Optimize performance**
- `python-performance-optimization`
- `cost-optimization` (cloud costs)

**Debug a problem**
- `debugging-strategies`
- `error-handling-patterns`

**Write tests**
- `python-testing-patterns` (Python)
- `javascript-testing-patterns` (JavaScript/TypeScript)
- `webapp-testing` (E2E)

**Review code**
- `code-review-excellence`

**Secure my application**
- `auth-implementation-patterns`
- `pci-compliance`
- `secrets-management`

**Deploy to cloud**
- `deployment-pipeline-design`
- `multi-cloud-architecture`
- `hybrid-cloud-networking`

**Create a new skill**
- `Skill Builder`

---

## Import Cheat Sheet

### Copy one skill
```bash
cp -r claude_code_skills/all-skills/SKILL_NAME your-project/.claude/skills/
```

### Copy a category
```bash
cp -r claude_code_skills/CATEGORY_NAME/* your-project/.claude/skills/
```

### Symlink all skills (Unix/Linux/Mac)
```bash
ln -s /path/to/claude_code_skills your-project/.claude/skills
```

### Symlink all skills (Windows - Admin required)
```cmd
mklink /D "your-project\.claude\skills" "C:\path\to\claude_code_skills"
```

---

## Usage Examples

### Basic invocation
```
Use the fastapi-templates skill to create a new API
```

### Multiple skills
```
Use the stripe-integration and billing-automation skills
```

### Category-based
```
I'm building a microservices backend.
Use relevant skills from architecture-design and backend-development.
```

---

**Total Skills**: 37
**Last Updated**: 2025-11-18

For detailed information, see:
- [README.md](README.md) - Full documentation
- [USAGE_GUIDE.md](USAGE_GUIDE.md) - Detailed usage instructions
