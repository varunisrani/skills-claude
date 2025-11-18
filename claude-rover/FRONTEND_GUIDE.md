# Claude-Rover Frontend Guide

**Complete documentation for the Claude-Rover Web Interface**

---

## ⚠️ Important Notice

**This frontend is part of the Claude-Rover experimental development branch.**

- 🚧 Under active development
- ⚠️ Not production-ready
- 🧪 Experimental features

See [STATUS.md](./STATUS.md) for overall project status.

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Technology Stack](#technology-stack)
4. [Installation](#installation)
5. [Running the Frontend](#running-the-frontend)
6. [Development](#development)
7. [Testing](#testing)
8. [Features](#features)
9. [Project Structure](#project-structure)
10. [Configuration](#configuration)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The **Claude-Rover Frontend** is a modern web interface built with Next.js for managing AI coding agents. It provides a visual dashboard for:

- 📊 **Task Management** - Create, monitor, and manage AI agent tasks
- 🤖 **Agent Control** - Control Claude Code and other AI agents
- 📁 **Workspace Management** - View and manage isolated task workspaces
- 📈 **Real-time Monitoring** - Track agent progress and status
- 🔍 **Code Diff Viewer** - Review changes made by AI agents
- 💻 **Terminal Integration** - Interactive terminal for task workspaces

---

## Quick Start

### Prerequisites

Before you begin, ensure you have:

- **Node.js 22+** ([Download](https://nodejs.org))
- **npm** (comes with Node.js)
- **Git** ([Download](https://git-scm.com))

### Fast Setup (3 Steps)

```bash
# 1. Navigate to frontend directory
cd claude-rover/frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

**Open browser:** [http://localhost:3000](http://localhost:3000)

---

## Technology Stack

### Core Framework
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety

### UI Components
- **Radix UI** - Accessible component primitives
  - Dialog, Dropdown Menu, Progress, Select, Switch, Tabs, Toast
- **Tailwind CSS 4** - Utility-first CSS
- **Lucide React** - Icon library

### State & Data
- **TanStack Query (React Query)** - Server state management
- **Zustand** - Client state management
- **Zod** - Runtime type validation

### Special Features
- **xterm.js** - Terminal emulator
- **react-diff-view** - Code diff viewer
- **chokidar** - File system watcher
- **date-fns** - Date formatting

### Development Tools
- **Vitest** - Unit testing
- **Testing Library** - Component testing
- **ESLint** - Code linting

---

## Installation

### Step 1: Clone & Navigate

```bash
cd claude-rover/frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages listed in `package.json`.

### Step 3: Verify Installation

```bash
npm run lint
```

You should see no errors.

---

## Running the Frontend

### Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

**Access at:** [http://localhost:3000](http://localhost:3000)

Features in development mode:
- ⚡ Hot module replacement (instant updates)
- 🐛 Detailed error messages
- 🔍 React Query DevTools

### Production Build

Build and run optimized production version:

```bash
# Build for production
npm run build

# Start production server
npm start
```

**Access at:** [http://localhost:3000](http://localhost:3000)

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint checks |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ui` | Open Vitest UI |
| `npm run test:coverage` | Generate coverage report |

### Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Make Changes**
   - Edit files in `app/`, `components/`, `hooks/`, etc.
   - Changes auto-reload in browser

3. **Test Your Changes**
   ```bash
   npm run test:watch
   ```

4. **Lint Your Code**
   ```bash
   npm run lint
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

---

## Testing

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Open Vitest UI (visual test runner)
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Testing Documentation

Comprehensive testing guides available:
- [TEST_SETUP.md](./frontend/TEST_SETUP.md) - Testing configuration
- [ACCESSIBILITY_TESTING.md](./frontend/ACCESSIBILITY_TESTING.md) - A11y testing

### Testing Tools

- **Vitest** - Fast unit test runner
- **Testing Library** - Component testing utilities
- **jsdom** - DOM simulation for Node.js

---

## Features

### 🎯 Core Features

#### 1. Task Dashboard
- View all AI agent tasks
- Filter by status (running, completed, failed)
- Sort by creation date, priority
- Quick action buttons

#### 2. Task Creation
- Create new tasks for AI agents
- Select agent type (Claude Code, Codex, Gemini, Qwen)
- Provide task description
- Configure task settings

#### 3. Real-time Monitoring
- Live task status updates
- Progress indicators
- Time tracking
- Agent activity logs

#### 4. Code Review
- Diff viewer for changes
- Side-by-side comparison
- Syntax highlighting
- File tree navigation

#### 5. Terminal Integration
- Interactive terminal for workspaces
- Execute commands in task environment
- View agent output
- Full terminal emulator support

#### 6. Workspace Management
- Browse task workspaces
- View git branches
- Inspect changes
- Merge or discard changes

### 🚀 Advanced Features

#### Keyboard Shortcuts
See [KEYBOARD_SHORTCUTS.md](./frontend/KEYBOARD_SHORTCUTS.md) for full list:
- `Ctrl/Cmd + K` - Quick task search
- `Ctrl/Cmd + N` - New task
- `Ctrl/Cmd + T` - Toggle terminal
- `Ctrl/Cmd + /` - Show shortcuts

#### Accessibility
See [ACCESSIBILITY.md](./frontend/ACCESSIBILITY.md):
- Screen reader support
- Keyboard navigation
- ARIA labels
- Focus management

---

## Project Structure

```
frontend/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   └── tasks/                 # Task pages
│
├── components/                 # React components
│   ├── ui/                    # UI components (Radix)
│   ├── task-list.tsx          # Task list component
│   ├── task-card.tsx          # Task card component
│   ├── diff-viewer.tsx        # Code diff viewer
│   └── terminal.tsx           # Terminal component
│
├── hooks/                      # Custom React hooks
│   ├── use-tasks.ts           # Task management
│   ├── use-agents.ts          # Agent control
│   └── use-workspace.ts       # Workspace operations
│
├── lib/                        # Utilities
│   ├── api.ts                 # API client
│   ├── utils.ts               # Helper functions
│   └── constants.ts           # Constants
│
├── types/                      # TypeScript types
│   ├── task.ts                # Task types
│   ├── agent.ts               # Agent types
│   └── workspace.ts           # Workspace types
│
├── test/                       # Test files
│   └── setup.ts               # Test configuration
│
├── public/                     # Static assets
│
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── next.config.ts             # Next.js config
├── tailwind.config.ts         # Tailwind config
├── vitest.config.ts           # Vitest config
└── README.md                  # Basic README
```

---

## Configuration

### Next.js Configuration

Edit `next.config.ts`:

```typescript
const nextConfig = {
  // Your custom configuration
  reactStrictMode: true,
  // API proxy, experimental features, etc.
}
```

### TypeScript Configuration

Edit `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    // ... more options
  }
}
```

### Tailwind Configuration

Edit `tailwind.config.ts` for custom styling:

```typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Custom colors
      }
    }
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Use a different port
PORT=3001 npm run dev

# Or kill the process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

#### 2. Module Not Found

**Error:** `Cannot find module '...'`

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 3. Build Errors

**Error:** Build fails with TypeScript errors

**Solution:**
```bash
# Check TypeScript errors
npx tsc --noEmit

# Fix errors and rebuild
npm run build
```

#### 4. Test Failures

**Error:** Tests fail or don't run

**Solution:**
```bash
# Clear Vitest cache
rm -rf node_modules/.vitest

# Reinstall dependencies
npm install

# Run tests
npm test
```

---

## Advanced Documentation

### Implementation Guides

Located in `frontend/` directory:

- **[IMPLEMENTATION_PLAN.md](./frontend/IMPLEMENTATION_PLAN.md)** - Overall implementation strategy
- **[PHASE_ONE_IMPLEMENTATION.md](./frontend/PHASE_ONE_IMPLEMENTATION.md)** - Phase 1 features
- **[PHASE_TWO_IMPLEMENTATION.md](./frontend/PHASE_TWO_IMPLEMENTATION.md)** - Phase 2 features
- **[PHASE_5_SUMMARY.md](./frontend/PHASE_5_SUMMARY.md)** - Phase 5 completion
- **[ROVER_CLI_IMPLEMENTATION.md](./frontend/ROVER_CLI_IMPLEMENTATION.md)** - CLI integration
- **[ERROR_HANDLING_IMPLEMENTATION.md](./frontend/ERROR_HANDLING_IMPLEMENTATION.md)** - Error handling

### Accessibility

- **[ACCESSIBILITY.md](./frontend/ACCESSIBILITY.md)** - Accessibility features
- **[ACCESSIBILITY_CHANGES.md](./frontend/ACCESSIBILITY_CHANGES.md)** - A11y changelog
- **[ACCESSIBILITY_TESTING.md](./frontend/ACCESSIBILITY_TESTING.md)** - A11y testing

### Keyboard Shortcuts

- **[KEYBOARD_SHORTCUTS.md](./frontend/KEYBOARD_SHORTCUTS.md)** - All shortcuts
- **[SHORTCUTS_IMPLEMENTATION.md](./frontend/SHORTCUTS_IMPLEMENTATION.md)** - Implementation details
- **[SHORTCUTS_SUMMARY.md](./frontend/SHORTCUTS_SUMMARY.md)** - Summary

---

## Integration with Claude-Rover CLI

### How Frontend Connects to CLI

The frontend communicates with the Claude-Rover CLI via:

1. **REST API** - HTTP endpoints for task management
2. **WebSocket** - Real-time updates
3. **File System** - Direct workspace access

### Starting Both Together

```bash
# Terminal 1: Start Rover CLI
cd claude-rover
rover serve

# Terminal 2: Start Frontend
cd claude-rover/frontend
npm run dev
```

The frontend will automatically connect to the CLI backend.

---

## Contributing

### Development Guidelines

1. **Code Style**
   - Follow TypeScript best practices
   - Use functional components
   - Implement proper error handling

2. **Testing**
   - Write tests for new features
   - Maintain >80% coverage
   - Test accessibility

3. **Documentation**
   - Update this guide for new features
   - Add JSDoc comments
   - Create examples

### Submitting Changes

See main [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## Support & Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [Radix UI Docs](https://www.radix-ui.com/docs/primitives/overview/introduction)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Original Rover Project
- [Rover GitHub](https://github.com/endorhq/rover)
- [Rover Docs](https://docs.endor.dev/rover)

### Claude Resources
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code/setup)
- [Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk)

---

## License

This frontend is part of Claude-Rover, based on Rover by Endor.

**License:** Apache 2.0 (see [LICENSE.md](./LICENSE.md))

---

## Version History

### Current: v0.1.0 (Under Development)
- Initial Next.js 16 setup
- Task management interface
- Code diff viewer
- Terminal integration
- Real-time monitoring

### Future Releases
- v0.2.0 - Enhanced Claude integration
- v0.3.0 - Advanced workspace features
- v1.0.0 - Production-ready release

---

<div align="center">

**🚧 Frontend Under Development 🚧**

*Part of the Claude-Rover experimental project*

[Main Documentation](./README.md) • [Status](./STATUS.md) • [Report Issues](https://github.com/endorhq/rover/issues)

</div>
