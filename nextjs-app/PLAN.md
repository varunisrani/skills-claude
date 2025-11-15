# GitHub Repository Management App - Simple Implementation Plan

## 🎯 Project Overview

A lightweight GitHub repository management web application built with Next.js that allows users to manage their repositories, issues, and pull requests through an intuitive interface. **No database required** - uses browser localStorage for data persistence.

---

## 📚 Tech Stack (Simplified)

### Frontend
- **Framework:** Next.js 16.0.3 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4
- **State Management:** React Context API
- **Storage:** Browser localStorage / sessionStorage
- **UI Components:** shadcn/ui or custom components
- **Icons:** lucide-react

### Backend
- **API:** Client-side only (no API routes needed)
- **Authentication:** Simple GitHub OAuth with Personal Access Token
- **Storage:** Browser localStorage (no database!)

### GitHub Integration
- **SDK:** Octokit (@octokit/rest)
- **Authentication:** GitHub Personal Access Token or OAuth
- **Scopes Required:** `repo`, `user`, `read:org`

### Deployment
- **Platform:** Vercel / Netlify (static export)
- **Type:** Client-side only (no server needed)

---

## 🏗️ Simplified Project Structure

```
nextjs-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                         # Home/Login page
│   ├── dashboard/
│   │   ├── page.tsx                     # Dashboard home
│   │   └── layout.tsx                   # Dashboard layout
│   ├── repositories/
│   │   ├── page.tsx                     # Repos list
│   │   └── [owner]/
│   │       └── [repo]/
│   │           ├── page.tsx             # Repo details
│   │           ├── issues/
│   │           │   ├── page.tsx         # Issues list
│   │           │   └── [number]/
│   │           │       └── page.tsx     # Issue details
│   │           └── pulls/
│   │               ├── page.tsx         # PRs list
│   │               └── [number]/
│   │                   └── page.tsx     # PR details
│   └── settings/
│       └── page.tsx                     # App settings
├── components/
│   ├── ui/                              # shadcn components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── repository/
│   │   ├── RepoCard.tsx
│   │   ├── RepoList.tsx
│   │   └── RepoStats.tsx
│   ├── issues/
│   │   ├── IssueCard.tsx
│   │   ├── IssueList.tsx
│   │   ├── IssueForm.tsx
│   │   └── CommentBox.tsx
│   ├── pulls/
│   │   ├── PRCard.tsx
│   │   ├── PRList.tsx
│   │   └── PRDiff.tsx
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── ErrorMessage.tsx
│       └── MarkdownRenderer.tsx
├── lib/
│   ├── github/
│   │   ├── client.ts                    # Octokit client setup
│   │   ├── repos.ts                     # Repository operations
│   │   ├── issues.ts                    # Issues operations
│   │   └── pulls.ts                     # PR operations
│   ├── storage/
│   │   ├── localStorage.ts              # localStorage utilities
│   │   ├── auth.ts                      # Auth token management
│   │   └── cache.ts                     # Cache management
│   ├── context/
│   │   ├── AuthContext.tsx              # Auth state
│   │   └── ThemeContext.tsx             # Theme state
│   └── utils/
│       ├── cn.ts                        # Class name utility
│       ├── date.ts                      # Date formatting
│       └── markdown.ts                  # Markdown utilities
├── types/
│   ├── github.ts
│   └── index.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useLocalStorage.ts
│   ├── useRepos.ts
│   ├── useIssues.ts
│   └── usePulls.ts
├── public/
│   └── images/
├── .env.example
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🔐 Simple Authentication Setup

### Option 1: GitHub Personal Access Token (Easiest)

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `user`, `read:org`
4. Copy the token
5. Paste it in the app's login page

**Pros:** Super simple, no OAuth setup needed
**Cons:** Manual token management

### Option 2: GitHub OAuth (More Professional)

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Homepage URL:** `http://localhost:3000`
   - **Callback URL:** `http://localhost:3000`
4. Save Client ID to `.env.local`

---

## 💾 localStorage Data Structure

```typescript
// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'github_auth_token',
  USER_DATA: 'github_user_data',
  SETTINGS: 'app_settings',
  FAVORITES: 'favorite_repos',
  CACHE: 'api_cache',
  THEME: 'app_theme',
};

// Example data structures
interface StoredAuthData {
  token: string;
  expiresAt?: number;
  createdAt: number;
}

interface StoredUserData {
  login: string;
  name: string;
  avatar_url: string;
  email?: string;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  itemsPerPage: number;
  defaultRepoView: 'grid' | 'list';
  cacheEnabled: boolean;
}

interface FavoriteRepo {
  owner: string;
  repo: string;
  addedAt: number;
}

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}
```

---

## 📦 Dependencies Installation

```bash
# Core dependencies
npm install @octokit/rest
npm install lucide-react
npm install react-markdown
npm install date-fns
npm install zustand

# UI dependencies (shadcn/ui - optional but recommended)
npx shadcn@latest init
npx shadcn@latest add button card input dialog textarea badge separator skeleton

# Or use these minimal alternatives
npm install clsx tailwind-merge
```

**Total dependencies: ~10 packages** (vs 30+ with database)

---

## 🚀 Implementation Phases (Simplified)

### **Phase 1: Setup & Authentication** (Day 1)

#### Tasks:
1. ✅ Initialize Next.js project (Done!)
2. ⬜ Create authentication flow
3. ⬜ Set up localStorage utilities
4. ⬜ Create auth context
5. ⬜ Build login page
6. ⬜ Build basic layout (Navbar)

#### Files to Create:

**`lib/storage/localStorage.ts`** - localStorage wrapper
```typescript
export const storage = {
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage error:', error);
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  },
};
```

**`lib/storage/auth.ts`** - Auth management
```typescript
import { storage } from './localStorage';

const AUTH_KEY = 'github_auth_token';
const USER_KEY = 'github_user_data';

export const authStorage = {
  getToken: () => storage.get<string>(AUTH_KEY),

  setToken: (token: string) => {
    storage.set(AUTH_KEY, token);
  },

  removeToken: () => {
    storage.remove(AUTH_KEY);
    storage.remove(USER_KEY);
  },

  getUser: () => storage.get<any>(USER_KEY),

  setUser: (user: any) => {
    storage.set(USER_KEY, user);
  },

  isAuthenticated: () => !!storage.get<string>(AUTH_KEY),
};
```

**`lib/context/AuthContext.tsx`** - Auth context
```typescript
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authStorage } from '@/lib/storage/auth';
import { Octokit } from '@octokit/rest';

interface AuthContextType {
  token: string | null;
  user: any | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    const savedToken = authStorage.getToken();
    const savedUser = authStorage.getUser();

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (newToken: string) => {
    try {
      // Verify token by fetching user data
      const octokit = new Octokit({ auth: newToken });
      const { data: userData } = await octokit.rest.users.getAuthenticated();

      setToken(newToken);
      setUser(userData);
      authStorage.setToken(newToken);
      authStorage.setUser(userData);
    } catch (error) {
      throw new Error('Invalid token');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    authStorage.removeToken();
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

**`app/page.tsx`** - Login page
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(token);
      router.push('/dashboard');
    } catch (err) {
      setError('Invalid token. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">GitHub Repo Manager</h2>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              GitHub Personal Access Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,user,read:org"
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                Generate a token here
              </a>
            </p>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

### **Phase 2: Repository Management** (Day 2)

#### Features:
- List all repositories
- Search repositories
- View repository details
- Display README
- Star/unstar repos

#### Key Implementation:

**`lib/github/client.ts`**
```typescript
import { Octokit } from '@octokit/rest';

export function createGitHubClient(token: string) {
  return new Octokit({ auth: token });
}
```

**`lib/github/repos.ts`**
```typescript
import { Octokit } from '@octokit/rest';

export async function listRepos(octokit: Octokit) {
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100,
  });
  return data;
}

export async function getRepo(octokit: Octokit, owner: string, repo: string) {
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return data;
}

export async function getReadme(octokit: Octokit, owner: string, repo: string) {
  try {
    const { data } = await octokit.rest.repos.getReadme({ owner, repo });
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return content;
  } catch {
    return null;
  }
}
```

**`hooks/useRepos.ts`**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { createGitHubClient } from '@/lib/github/client';
import { listRepos } from '@/lib/github/repos';

export function useRepos() {
  const { token } = useAuth();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    const fetchRepos = async () => {
      try {
        const octokit = createGitHubClient(token);
        const data = await listRepos(octokit);
        setRepos(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [token]);

  return { repos, loading, error };
}
```

**`app/repositories/page.tsx`**
```typescript
'use client';

import { useRepos } from '@/hooks/useRepos';
import RepoCard from '@/components/repository/RepoCard';

export default function RepositoriesPage() {
  const { repos, loading, error } = useRepos();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Repositories</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {repos.map((repo: any) => (
          <RepoCard key={repo.id} repo={repo} />
        ))}
      </div>
    </div>
  );
}
```

---

### **Phase 3: Issues Management** (Day 3-4)

#### Features:
- List issues
- View issue details
- Create issue
- Add comments
- Close/reopen issues

**`lib/github/issues.ts`**
```typescript
import { Octokit } from '@octokit/rest';

export async function listIssues(
  octokit: Octokit,
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
) {
  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state,
  });
  return data;
}

export async function getIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number
) {
  const { data } = await octokit.rest.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });
  return data;
}

export async function createIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  title: string,
  body: string
) {
  const { data } = await octokit.rest.issues.create({
    owner,
    repo,
    title,
    body,
  });
  return data;
}

export async function createComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
) {
  const { data } = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });
  return data;
}

export async function listComments(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number
) {
  const { data } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
  });
  return data;
}
```

---

### **Phase 4: Pull Requests** (Day 5-6)

#### Features:
- List PRs
- View PR details
- View diff
- Create PR
- Comment on PR
- Merge PR

**`lib/github/pulls.ts`**
```typescript
import { Octokit } from '@octokit/rest';

export async function listPRs(
  octokit: Octokit,
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
) {
  const { data } = await octokit.rest.pulls.list({
    owner,
    repo,
    state,
  });
  return data;
}

export async function getPR(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number
) {
  const { data } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });
  return data;
}

export async function getPRFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number
) {
  const { data } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
  });
  return data;
}

export async function createPR(
  octokit: Octokit,
  owner: string,
  repo: string,
  title: string,
  head: string,
  base: string,
  body?: string
) {
  const { data } = await octokit.rest.pulls.create({
    owner,
    repo,
    title,
    head,
    base,
    body,
  });
  return data;
}

export async function mergePR(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number
) {
  const { data } = await octokit.rest.pulls.merge({
    owner,
    repo,
    pull_number: pullNumber,
  });
  return data;
}
```

---

### **Phase 5: Caching & Optimization** (Day 7)

#### Simple Cache Implementation:

**`lib/storage/cache.ts`**
```typescript
import { storage } from './localStorage';

const CACHE_PREFIX = 'cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export const cache = {
  get: <T>(key: string): T | null => {
    const entry = storage.get<CacheEntry<T>>(`${CACHE_PREFIX}${key}`);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      storage.remove(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return entry.data;
  },

  set: <T>(key: string, data: T, ttl: number = DEFAULT_TTL): void => {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttl,
    };
    storage.set(`${CACHE_PREFIX}${key}`, entry);
  },

  remove: (key: string): void => {
    storage.remove(`${CACHE_PREFIX}${key}`);
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  },
};
```

**Usage Example:**
```typescript
// In your hooks
const cacheKey = `repos_${user.login}`;
const cached = cache.get(cacheKey);

if (cached) {
  setRepos(cached);
  setLoading(false);
  return;
}

// Fetch and cache
const data = await listRepos(octokit);
cache.set(cacheKey, data, 5 * 60 * 1000); // Cache for 5 minutes
```

---

### **Phase 6: UI Polish** (Day 8)

#### Features:
- Loading states
- Error boundaries
- Responsive design
- Dark mode
- Markdown rendering
- Search functionality

**`components/common/MarkdownRenderer.tsx`**
```typescript
'use client';

import ReactMarkdown from 'react-markdown';

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
```

---

## 🎨 Component Examples

### Repository Card
**`components/repository/RepoCard.tsx`**
```typescript
import Link from 'next/link';
import { Star, GitFork, Code } from 'lucide-react';

export default function RepoCard({ repo }: { repo: any }) {
  return (
    <Link href={`/repositories/${repo.owner.login}/${repo.name}`}>
      <div className="border rounded-lg p-4 hover:shadow-lg transition">
        <h3 className="font-bold text-lg mb-2">{repo.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {repo.description || 'No description'}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Star size={16} />
            {repo.stargazers_count}
          </span>
          <span className="flex items-center gap-1">
            <GitFork size={16} />
            {repo.forks_count}
          </span>
          {repo.language && (
            <span className="flex items-center gap-1">
              <Code size={16} />
              {repo.language}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
```

---

## ⏱️ Simplified Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1: Auth & Setup | 1 day | localStorage, auth, login |
| Phase 2: Repositories | 1 day | List, view, search repos |
| Phase 3: Issues | 2 days | Issues CRUD, comments |
| Phase 4: Pull Requests | 2 days | PRs list, view, create |
| Phase 5: Caching | 1 day | localStorage cache |
| Phase 6: Polish | 1 day | UI, dark mode, responsive |
| **Total** | **8 days** | **Simple MVP** |

**50% faster than database version!**

---

## 🚀 Development Commands

```bash
# Development
npm run dev              # Start dev server at localhost:3000

# Build
npm run build            # Build for production
npm run start            # Start production server

# Or export as static site
npm run build            # Generates static HTML
# Then deploy the 'out' folder anywhere!
```

---

## 📊 localStorage vs Database Comparison

| Feature | localStorage | Database |
|---------|-------------|----------|
| Setup time | 5 minutes | 2 hours |
| Cost | Free | $5-20/month |
| Deployment | Anywhere | Server needed |
| Data persistence | Browser only | Global |
| Speed | Instant | Network delay |
| Best for | Personal use | Multi-user |

---

## 🔒 Security Notes

1. **Token Storage:** Tokens in localStorage are accessible via JavaScript
   - ✅ Okay for personal use
   - ❌ Not ideal for production with sensitive data
   - 💡 Consider sessionStorage for better security

2. **Data Privacy:** All data stays in your browser
   - No server = no data leaks
   - Clear browser data = lose everything
   - Consider export/import features

---

## 🎯 Features Checklist

- [ ] Login with GitHub token
- [ ] View all repositories
- [ ] Search repositories
- [ ] View repository details
- [ ] View README
- [ ] List issues
- [ ] Create issue
- [ ] Comment on issue
- [ ] List pull requests
- [ ] View PR details
- [ ] View PR diff
- [ ] Dark mode toggle
- [ ] Responsive design
- [ ] Caching for performance

---

## 🚢 Deployment

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Option 2: Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

### Option 3: GitHub Pages
```bash
# Add to next.config.ts
output: 'export'

npm run build
# Upload 'out' folder to GitHub Pages
```

---

## 📚 Resources

- [Octokit REST API Docs](https://octokit.github.io/rest.js/)
- [GitHub Personal Access Tokens](https://github.com/settings/tokens)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)

---

## 🎉 Quick Start

1. **Get your token:**
   ```
   https://github.com/settings/tokens/new?scopes=repo,user,read:org
   ```

2. **Start the app:**
   ```bash
   npm run dev
   ```

3. **Login:**
   - Paste your token
   - Start managing repos!

**That's it! No database, no complex setup, just code and go! 🚀**

---

## 💡 Pro Tips

1. **Clear cache** if you see old data:
   ```javascript
   localStorage.clear()
   ```

2. **Export your favorites** before clearing browser:
   ```javascript
   const favorites = localStorage.getItem('favorite_repos')
   console.log(favorites) // Copy and save
   ```

3. **Test with small repos first** to avoid rate limits

4. **Use browser DevTools** to inspect localStorage:
   - Open DevTools → Application → Local Storage

---

**Ready to build? Let's go! 🎯**
