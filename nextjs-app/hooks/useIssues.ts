'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { createGitHubClient } from '@/lib/github/client';
import { listIssues, getIssue, listComments } from '@/lib/github/issues';
import { cache } from '@/lib/storage/cache';

export function useIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') {
  const { token } = useAuth();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !owner || !repo) {
      setLoading(false);
      return;
    }

    const fetchIssues = async () => {
      try {
        setLoading(true);

        // Try to get from cache
        const cacheKey = `issues_${owner}_${repo}_${state}`;
        const cached = cache.get<any[]>(cacheKey);

        if (cached) {
          setIssues(cached);
          setLoading(false);
          return;
        }

        // Fetch from API if not in cache
        const octokit = createGitHubClient(token);
        const data = await listIssues(octokit, owner, repo, state);
        setIssues(data);
        setError(null);

        // Cache the result
        cache.set(cacheKey, data, 3 * 60 * 1000); // Cache for 3 minutes
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [token, owner, repo, state]);

  return { issues, loading, error };
}

export function useIssue(owner: string, repo: string, issueNumber: number) {
  const { token } = useAuth();
  const [issue, setIssue] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !owner || !repo || !issueNumber) {
      setLoading(false);
      return;
    }

    const fetchIssueAndComments = async () => {
      try {
        setLoading(true);

        // Try to get from cache
        const cacheKey = `issue_${owner}_${repo}_${issueNumber}`;
        const cached = cache.get<{ issue: any; comments: any[] }>(cacheKey);

        if (cached) {
          setIssue(cached.issue);
          setComments(cached.comments);
          setLoading(false);
          return;
        }

        // Fetch from API if not in cache
        const octokit = createGitHubClient(token);
        const [issueData, commentsData] = await Promise.all([
          getIssue(octokit, owner, repo, issueNumber),
          listComments(octokit, owner, repo, issueNumber),
        ]);
        setIssue(issueData);
        setComments(commentsData);
        setError(null);

        // Cache the result
        cache.set(cacheKey, { issue: issueData, comments: commentsData }, 3 * 60 * 1000);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIssueAndComments();
  }, [token, owner, repo, issueNumber]);

  const refresh = async () => {
    if (!token || !owner || !repo || !issueNumber) return;

    try {
      const octokit = createGitHubClient(token);
      const [issueData, commentsData] = await Promise.all([
        getIssue(octokit, owner, repo, issueNumber),
        listComments(octokit, owner, repo, issueNumber),
      ]);
      setIssue(issueData);
      setComments(commentsData);
      setError(null);

      // Update cache
      const cacheKey = `issue_${owner}_${repo}_${issueNumber}`;
      cache.set(cacheKey, { issue: issueData, comments: commentsData }, 3 * 60 * 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return { issue, comments, loading, error, refresh };
}
