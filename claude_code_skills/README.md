# Claude Code Skills Library

A comprehensive collection of reusable Claude Code skills for software development, organized by category for easy discovery and integration.

## Table of Contents
- [Overview](#overview)
- [Folder Structure](#folder-structure)
- [Categories](#categories)
- [How to Use Skills](#how-to-use-skills)
- [How to Import Skills to Your Project](#how-to-import-skills-to-your-project)
- [Skill Descriptions](#skill-descriptions)

## Overview

This repository contains a curated collection of Claude Code skills that cover various aspects of software development, from backend and frontend development to AI/LLM integration, DevOps, security, and more. Skills are organized both in an `all-skills` folder (containing all skills) and in category-specific folders for easier browsing.

## Folder Structure

```
claude_code_skills/
├── all-skills/              # All skills in one place
├── backend-development/     # Backend, Python, Node.js, APIs
├── frontend-development/    # React, TypeScript, JavaScript, Testing
├── architecture-design/     # System architecture, API design, patterns
├── devops-infrastructure/   # CI/CD, cloud, deployment, secrets
├── ai-llm/                  # AI, LLM, RAG, prompt engineering
├── security-auth/           # Authentication, authorization, security
├── payments-billing/        # Payment processing, billing systems
├── code-quality-testing/    # Code review, debugging, error handling
└── tools-utilities/         # Development tools and utilities
```

## Categories

### 1. Backend Development
Backend development skills covering Python, Node.js, FastAPI, async patterns, testing, and performance optimization.

**Skills in this category:**
- `async-python-patterns` - Python asyncio and concurrent programming
- `fastapi-templates` - Production-ready FastAPI projects
- `nodejs-backend-patterns` - Node.js backend services with Express/Fastify
- `python-packaging` - Creating distributable Python packages
- `python-performance-optimization` - Profiling and optimizing Python code
- `python-testing-patterns` - Comprehensive testing with pytest

### 2. Frontend Development
Modern frontend development with React, TypeScript, JavaScript, and testing frameworks.

**Skills in this category:**
- `frontend-dev-guidelines` - React/TypeScript application patterns
- `javascript-testing-patterns` - Testing with Jest, Vitest, Testing Library
- `modern-javascript-patterns` - ES6+ features and functional programming
- `typescript-advanced-types` - Advanced TypeScript type system
- `webapp-testing` - End-to-end web application testing

### 3. Architecture & Design
System architecture patterns, microservices, API design, and cloud architecture.

**Skills in this category:**
- `api-design-principles` - REST and GraphQL API design
- `architecture-patterns` - Clean Architecture, Hexagonal Architecture, DDD
- `microservices-patterns` - Microservices design and communication
- `multi-cloud-architecture` - Multi-cloud system design

### 4. DevOps & Infrastructure
CI/CD pipelines, cloud infrastructure, deployment automation, and cost optimization.

**Skills in this category:**
- `cost-optimization` - Cloud cost optimization strategies
- `deployment-pipeline-design` - Multi-stage CI/CD pipelines
- `github-actions-templates` - GitHub Actions workflows
- `hybrid-cloud-networking` - Hybrid cloud connectivity
- `secrets-management` - Secure secrets management for CI/CD

### 5. AI & LLM
AI application development, LLM integration, RAG systems, and prompt engineering.

**Skills in this category:**
- `claude-agent-sdk` - Building Claude SDK agents
- `claude-sdk-agent-generator` - Generating Claude SDK agents
- `langchain-architecture` - LangChain application design
- `llm-evaluation` - LLM performance evaluation
- `mcp-builder` - Building MCP (Model Context Protocol) servers
- `prompt-engineering-patterns` - Advanced prompt engineering
- `rag-implementation` - Retrieval-Augmented Generation systems

### 6. Security & Authentication
Authentication, authorization, and security compliance.

**Skills in this category:**
- `auth-implementation-patterns` - JWT, OAuth2, session management, RBAC
- `pci-compliance` - PCI DSS compliance for payment systems

### 7. Payments & Billing
Payment processing integration and billing automation.

**Skills in this category:**
- `billing-automation` - Automated billing and subscription management
- `paypal-integration` - PayPal payment processing
- `stripe-integration` - Stripe payment processing

### 8. Code Quality & Testing
Code review practices, debugging strategies, and error handling patterns.

**Skills in this category:**
- `code-review-excellence` - Effective code review practices
- `debugging-strategies` - Systematic debugging techniques
- `error-handling-patterns` - Error handling across languages

### 9. Tools & Utilities
Development tools, package managers, and utility skills.

**Skills in this category:**
- `Skill Builder` - Create new Claude Code skills
- `uv-package-manager` - Modern Python package management

## How to Use Skills

### Method 1: Using the Skill Tool (Recommended)
In Claude Code, you can invoke skills using the Skill tool:

```
Use the `api-design-principles` skill
```

Claude Code will load the skill and provide you with specialized guidance for that domain.

### Method 2: Direct Invocation
In your conversation with Claude Code, simply reference the skill:

```
I need help with FastAPI. Use the fastapi-templates skill.
```

### Method 3: Browse and Read
Navigate to any skill folder and read the skill file (usually a `.md` file) to understand the patterns, best practices, and examples provided.

## How to Import Skills to Your Project

### Option 1: Copy Individual Skills
Copy specific skill folders from `claude_code_skills/all-skills/` or any category folder to your project's `.claude/skills/` directory:

```bash
# Copy a single skill
cp -r claude_code_skills/all-skills/fastapi-templates your-project/.claude/skills/

# Copy multiple skills from a category
cp -r claude_code_skills/backend-development/* your-project/.claude/skills/
```

### Option 2: Symlink the Entire Collection
Create a symbolic link to make all skills available:

```bash
# On Unix/Linux/Mac
ln -s /path/to/claude_code_skills your-project/.claude/skills

# On Windows (requires admin privileges)
mklink /D "your-project\.claude\skills" "path\to\claude_code_skills"
```

### Option 3: Copy All Skills
Copy all skills to your project:

```bash
cp -r claude_code_skills/all-skills/* your-project/.claude/skills/
```

### Option 4: Clone This Repository
Clone or download this repository and reference it globally:

```bash
# Set up a global skills directory (example)
export CLAUDE_SKILLS_PATH="/path/to/claude_code_skills"
```

Then reference skills from this location in your Claude Code configuration.

## Skill Descriptions

### Backend Development

#### `async-python-patterns`
Master Python asyncio, concurrent programming, and async/await patterns for high-performance applications. Use when building async APIs, concurrent systems, or I/O-bound applications requiring non-blocking operations.

#### `fastapi-templates`
Create production-ready FastAPI projects with async patterns, dependency injection, and comprehensive error handling. Use when building new FastAPI applications or setting up backend API projects.

#### `nodejs-backend-patterns`
Build production-ready Node.js backend services with Express/Fastify, implementing middleware patterns, error handling, authentication, database integration, and API design best practices.

#### `python-packaging`
Create distributable Python packages with proper project structure, setup.py/pyproject.toml, and publishing to PyPI. Use when packaging Python libraries, creating CLI tools, or distributing Python code.

#### `python-performance-optimization`
Profile and optimize Python code using cProfile, memory profilers, and performance best practices. Use when debugging slow Python code, optimizing bottlenecks, or improving application performance.

#### `python-testing-patterns`
Implement comprehensive testing strategies with pytest, fixtures, mocking, and test-driven development. Use when writing Python tests, setting up test suites, or implementing testing best practices.

### Frontend Development

#### `frontend-dev-guidelines`
Frontend development guidelines for React/TypeScript applications. Modern patterns including Suspense, lazy loading, useSuspenseQuery, file organization, MUI v7 styling, TanStack Router, and performance optimization.

#### `javascript-testing-patterns`
Implement comprehensive testing strategies using Jest, Vitest, and Testing Library for unit tests, integration tests, and end-to-end testing with mocking, fixtures, and test-driven development.

#### `modern-javascript-patterns`
Master ES6+ features including async/await, destructuring, spread operators, arrow functions, promises, modules, iterators, generators, and functional programming patterns for writing clean, efficient JavaScript code.

#### `typescript-advanced-types`
Advanced TypeScript type system features for building type-safe applications.

#### `webapp-testing`
End-to-end testing strategies for web applications.

### Architecture & Design

#### `api-design-principles`
Master REST and GraphQL API design principles to build intuitive, scalable, and maintainable APIs that delight developers. Use when designing new APIs, reviewing API specifications, or establishing API design standards.

#### `architecture-patterns`
Implement proven backend architecture patterns including Clean Architecture, Hexagonal Architecture, and Domain-Driven Design. Use when architecting complex backend systems or refactoring existing applications for better maintainability.

#### `microservices-patterns`
Design microservices architectures with service boundaries, event-driven communication, and resilience patterns. Use when building distributed systems, decomposing monoliths, or implementing microservices.

#### `multi-cloud-architecture`
Design multi-cloud architectures using a decision framework to select and integrate services across AWS, Azure, and GCP. Use when building multi-cloud systems, avoiding vendor lock-in, or leveraging best-of-breed services.

### DevOps & Infrastructure

#### `cost-optimization`
Optimize cloud costs through resource rightsizing, tagging strategies, reserved instances, and spending analysis. Use when reducing cloud expenses, analyzing infrastructure costs, or implementing cost governance policies.

#### `deployment-pipeline-design`
Design multi-stage CI/CD pipelines with approval gates, security checks, and deployment orchestration. Use when architecting deployment workflows, setting up continuous delivery, or implementing GitOps practices.

#### `github-actions-templates`
Create production-ready GitHub Actions workflows for automated testing, building, and deploying applications. Use when setting up CI/CD with GitHub Actions, automating development workflows, or creating reusable workflow templates.

#### `hybrid-cloud-networking`
Configure secure, high-performance connectivity between on-premises infrastructure and cloud platforms using VPN and dedicated connections. Use when building hybrid cloud architectures or implementing secure cross-premises networking.

#### `secrets-management`
Implement secure secrets management for CI/CD pipelines using Vault, AWS Secrets Manager, or native platform solutions. Use when handling sensitive credentials, rotating secrets, or securing CI/CD environments.

### AI & LLM

#### `claude-agent-sdk`
Building Claude SDK agents with specialized capabilities.

#### `claude-sdk-agent-generator`
Generate complete Claude SDK agents with prompt templates and configuration.

#### `langchain-architecture`
Design LLM applications using the LangChain framework with agents, memory, and tool integration patterns. Use when building LangChain applications, implementing AI agents, or creating complex LLM workflows.

#### `llm-evaluation`
Implement comprehensive evaluation strategies for LLM applications using automated metrics, human feedback, and benchmarking. Use when testing LLM performance, measuring AI application quality, or establishing evaluation frameworks.

#### `mcp-builder`
Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools. Use when building MCP servers in Python (FastMCP) or Node/TypeScript.

#### `prompt-engineering-patterns`
Master advanced prompt engineering techniques to maximize LLM performance, reliability, and controllability in production. Use when optimizing prompts, improving LLM outputs, or designing production prompt templates.

#### `rag-implementation`
Build Retrieval-Augmented Generation (RAG) systems for LLM applications with vector databases and semantic search. Use when implementing knowledge-grounded AI, building document Q&A systems, or integrating LLMs with external knowledge bases.

### Security & Authentication

#### `auth-implementation-patterns`
Master authentication and authorization patterns including JWT, OAuth2, session management, and RBAC to build secure, scalable access control systems. Use when implementing auth systems, securing APIs, or debugging security issues.

#### `pci-compliance`
Implement PCI DSS compliance requirements for secure handling of payment card data and payment systems. Use when securing payment processing, achieving PCI compliance, or implementing payment card security measures.

### Payments & Billing

#### `billing-automation`
Build automated billing systems for recurring payments, invoicing, subscription lifecycle, and dunning management. Use when implementing subscription billing, automating invoicing, or managing recurring payment systems.

#### `paypal-integration`
Integrate PayPal payment processing with support for express checkout, subscriptions, and refund management. Use when implementing PayPal payments, processing online transactions, or building e-commerce checkout flows.

#### `stripe-integration`
Implement Stripe payment processing for robust, PCI-compliant payment flows including checkout, subscriptions, and webhooks. Use when integrating Stripe payments, building subscription systems, or implementing secure checkout flows.

### Code Quality & Testing

#### `code-review-excellence`
Master effective code review practices to provide constructive feedback, catch bugs early, and foster knowledge sharing while maintaining team morale. Use when reviewing pull requests, establishing review standards, or mentoring developers.

#### `debugging-strategies`
Master systematic debugging techniques, profiling tools, and root cause analysis to efficiently track down bugs across any codebase or technology stack. Use when investigating bugs, performance issues, or unexpected behavior.

#### `error-handling-patterns`
Master error handling patterns across languages including exceptions, Result types, error propagation, and graceful degradation to build resilient applications. Use when implementing error handling, designing APIs, or improving application reliability.

### Tools & Utilities

#### `Skill Builder`
Create new Claude Code Skills with proper YAML frontmatter, progressive disclosure structure, and complete directory organization. Use when you need to build custom skills for specific workflows or generate skill templates.

#### `uv-package-manager`
Modern Python package management with uv for fast, reliable dependency management.

---

## Contributing

To add new skills to this collection:
1. Create your skill in the `all-skills/` directory
2. Copy it to the appropriate category folder(s)
3. Update this README with the skill description
4. Ensure the skill follows Claude Code skill format guidelines

## License

This collection is organized for personal and team use with Claude Code. Individual skills may have their own licenses or usage guidelines.

## Support

For questions or issues with:
- **Claude Code**: Visit https://github.com/anthropics/claude-code/issues
- **This Skills Collection**: Create an issue in this repository

---

**Last Updated**: 2025-11-18
**Total Skills**: 37
