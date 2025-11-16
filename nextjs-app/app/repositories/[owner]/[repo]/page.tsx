'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, GitFork, Eye, CircleDot, GitPullRequest, Code, Calendar, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/lib/context/AuthContext';
import styles from './page.module.css';

interface RepositoryDetails {
  name: string;
  full_name: string;
  description: string | null;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  html_url: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  default_branch: string;
  topics: string[];
}

export default function RepositoryPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user, isLoading: authLoading } = useAuth();
  const owner = params.owner as string;
  const repo = params.repo as string;

  console.log('RepositoryPage - Component rendered', { owner, repo });
  console.log('RepositoryPage - Auth state:', { token: !!token, user, authLoading });

  const [repository, setRepository] = useState<RepositoryDetails | null>(null);
  const [readme, setReadme] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issuesCount, setIssuesCount] = useState(0);
  const [prsCount, setPrsCount] = useState(0);

  useEffect(() => {
    console.log('RepositoryPage - useEffect triggered', { authLoading, user, token: !!token });
    
    if (!authLoading && !user) {
      console.log('RepositoryPage - No user found, redirecting to home');
      router.push('/');
      return;
    }

    if (!token || authLoading) {
      console.log('RepositoryPage - Waiting for auth to complete');
      return;
    }

    const fetchRepository = async () => {
      try {
        console.log('RepositoryPage - Starting to fetch repository data');

        // Fetch repository details
        const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (!repoResponse.ok) {
          throw new Error('Failed to fetch repository');
        }

        const repoData = await repoResponse.json();
        setRepository(repoData);

        // Fetch README
        try {
          const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
            headers: {
              Authorization: `token ${token}`,
              Accept: 'application/vnd.github.v3.raw',
            },
          });

          if (readmeResponse.ok) {
            const readmeText = await readmeResponse.text();
            setReadme(readmeText);
          }
        } catch {
          // README not found, ignore
        }

        // Fetch issues count
        const issuesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=1`, {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (issuesResponse.ok) {
          const linkHeader = issuesResponse.headers.get('Link');
          if (linkHeader && linkHeader.includes('last')) {
            const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
            if (lastPageMatch) {
              setIssuesCount(parseInt(lastPageMatch[1]));
            }
          } else {
            const issues = await issuesResponse.json();
            setIssuesCount(issues.length);
          }
        }

        // Fetch PRs count
        const prsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=1`, {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (prsResponse.ok) {
          const linkHeader = prsResponse.headers.get('Link');
          if (linkHeader && linkHeader.includes('last')) {
            const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
            if (lastPageMatch) {
              setPrsCount(parseInt(lastPageMatch[1]));
            }
          } else {
            const prs = await prsResponse.json();
            setPrsCount(prs.length);
          }
        }

      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchRepository();
  }, [owner, repo, router, token, user, authLoading]);

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Authenticating...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading repository...</div>
      </div>
    );
  }

  if (error || !repository) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error: {error || 'Repository not found'}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/repositories" className={styles.breadcrumbLink}>
            Repositories
          </Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbCurrent}>{repository.full_name}</span>
        </div>

        <div className={styles.titleRow}>
          <h1 className={styles.title}>{repository.name}</h1>
          <a
            href={repository.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.githubLink}
          >
            <ExternalLink size={20} />
            View on GitHub
          </a>
        </div>

        {repository.description && (
          <p className={styles.description}>{repository.description}</p>
        )}

        <div className={styles.metadata}>
          {repository.private && <span className={styles.privateBadge}>Private</span>}
          {repository.language && (
            <span className={styles.language}>
              <Code size={16} />
              {repository.language}
            </span>
          )}
          <span className={styles.stat}>
            <Star size={16} />
            {repository.stargazers_count} stars
          </span>
          <span className={styles.stat}>
            <GitFork size={16} />
            {repository.forks_count} forks
          </span>
          <span className={styles.stat}>
            <Eye size={16} />
            {repository.watchers_count} watchers
          </span>
        </div>

        {repository.topics && repository.topics.length > 0 && (
          <div className={styles.topics}>
            {repository.topics.map(topic => (
              <span key={topic} className={styles.topic}>
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actionsGrid}>
        <Link href={`/repositories/${owner}/${repo}/issues`} className={styles.actionCard}>
          <div className={styles.actionIcon}>
            <CircleDot size={24} />
          </div>
          <div className={styles.actionContent}>
            <h3 className={styles.actionTitle}>Issues</h3>
            <p className={styles.actionDescription}>View and manage issues</p>
            <span className={styles.actionCount}>{issuesCount} open</span>
          </div>
        </Link>

        <Link href={`/repositories/${owner}/${repo}/pulls`} className={styles.actionCard}>
          <div className={styles.actionIcon}>
            <GitPullRequest size={24} />
          </div>
          <div className={styles.actionContent}>
            <h3 className={styles.actionTitle}>Pull Requests</h3>
            <p className={styles.actionDescription}>Review and merge PRs</p>
            <span className={styles.actionCount}>{prsCount} open</span>
          </div>
        </Link>
      </div>

      <div className={styles.info}>
        <div className={styles.infoItem}>
          <Calendar size={16} />
          <span>Created {formatDistanceToNow(new Date(repository.created_at), { addSuffix: true })}</span>
        </div>
        <div className={styles.infoItem}>
          <Calendar size={16} />
          <span>Last updated {formatDistanceToNow(new Date(repository.updated_at), { addSuffix: true })}</span>
        </div>
        <div className={styles.infoItem}>
          <Calendar size={16} />
          <span>Last push {formatDistanceToNow(new Date(repository.pushed_at), { addSuffix: true })}</span>
        </div>
      </div>

      {readme && (
        <div className={styles.readme}>
          <h2 className={styles.readmeTitle}>README</h2>
          <div className={styles.readmeContent}>
            <pre>{readme}</pre>
          </div>
        </div>
      )}
    </div>
  );
}