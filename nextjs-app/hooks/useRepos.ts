'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { createGitHubClient } from '@/lib/github/client';
import { listRepos } from '@/lib/github/repos';
import { cache } from '@/lib/storage/cache';

export function useRepos() {
  const { token, user } = useAuth();
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user) {
      setLoading(false);
      return;
    }

    const fetchRepos = async () => {
      try {
        setLoading(true);

        // Try to get from cache
        const cacheKey = `repos_${user.login}`;
        const cached = cache.get<any[]>(cacheKey);

        if (cached) {
          setRepos(cached);
          setLoading(false);
          return;
        }

        // Fetch from API if not in cache
        const octokit = createGitHubClient(token);
        const data = await listRepos(octokit);
        setRepos(data);
        setError(null);

        // Cache the result
        cache.set(cacheKey, data, 5 * 60 * 1000); // Cache for 5 minutes
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [token, user]);

  return { repos, loading, error };
}
