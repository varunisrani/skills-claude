'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { createGitHubClient } from '@/lib/github/client';
import { listPRs, getPR, getPRFiles, getPRComments } from '@/lib/github/pulls';
import { cache } from '@/lib/storage/cache';

export function usePulls(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') {
  const { token } = useAuth();
  const [pulls, setPulls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !owner || !repo) {
      setLoading(false);
      return;
    }

    const fetchPulls = async () => {
      try {
        setLoading(true);

        // Try to get from cache
        const cacheKey = `pulls_${owner}_${repo}_${state}`;
        const cached = cache.get<any[]>(cacheKey);

        if (cached) {
          setPulls(cached);
          setLoading(false);
          return;
        }

        // Fetch from API if not in cache
        const octokit = createGitHubClient(token);
        const data = await listPRs(octokit, owner, repo, state);
        setPulls(data);
        setError(null);

        // Cache the result
        cache.set(cacheKey, data, 3 * 60 * 1000); // Cache for 3 minutes
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPulls();
  }, [token, owner, repo, state]);

  return { pulls, loading, error };
}

export function usePull(owner: string, repo: string, pullNumber: number) {
  const { token } = useAuth();
  const [pull, setPull] = useState<any | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !owner || !repo || !pullNumber) {
      setLoading(false);
      return;
    }

    const fetchPRDetails = async () => {
      try {
        setLoading(true);

        // Try to get from cache
        const cacheKey = `pull_${owner}_${repo}_${pullNumber}`;
        const cached = cache.get<{ pull: any; files: any[]; comments: any[] }>(cacheKey);

        if (cached) {
          setPull(cached.pull);
          setFiles(cached.files);
          setComments(cached.comments);
          setLoading(false);
          return;
        }

        // Fetch from API if not in cache
        const octokit = createGitHubClient(token);
        const [prData, filesData, commentsData] = await Promise.all([
          getPR(octokit, owner, repo, pullNumber),
          getPRFiles(octokit, owner, repo, pullNumber),
          getPRComments(octokit, owner, repo, pullNumber),
        ]);
        setPull(prData);
        setFiles(filesData);
        setComments(commentsData);
        setError(null);

        // Cache the result
        cache.set(cacheKey, { pull: prData, files: filesData, comments: commentsData }, 3 * 60 * 1000);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPRDetails();
  }, [token, owner, repo, pullNumber]);

  const refresh = async () => {
    if (!token || !owner || !repo || !pullNumber) return;

    try {
      const octokit = createGitHubClient(token);
      const [prData, filesData, commentsData] = await Promise.all([
        getPR(octokit, owner, repo, pullNumber),
        getPRFiles(octokit, owner, repo, pullNumber),
        getPRComments(octokit, owner, repo, pullNumber),
      ]);
      setPull(prData);
      setFiles(filesData);
      setComments(commentsData);
      setError(null);

      // Update cache
      const cacheKey = `pull_${owner}_${repo}_${pullNumber}`;
      cache.set(cacheKey, { pull: prData, files: filesData, comments: commentsData }, 3 * 60 * 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return { pull, files, comments, loading, error, refresh };
}
