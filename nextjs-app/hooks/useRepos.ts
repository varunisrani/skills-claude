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

  console.log('useRepos - Hook called', { token: !!token, user });

  useEffect(() => {
    console.log('useRepos - useEffect triggered', { token: !!token, user });
    
    if (!token || !user) {
      console.log('useRepos - No token or user, setting loading to false');
      setLoading(false);
      return;
    }

    const fetchRepos = async () => {
      try {
        console.log('useRepos - Starting to fetch repos');
        setLoading(true);

        // Try to get from cache
        const cacheKey = `repos_${user.login}`;
        console.log('useRepos - Checking cache with key:', cacheKey);
        const cached = cache.get<any[]>(cacheKey);

        if (cached) {
          console.log('useRepos - Found cached repos:', cached.length);
          setRepos(cached);
          setLoading(false);
          return;
        }

        console.log('useRepos - No cache found, fetching from API');
        // Fetch from API if not in cache
        const octokit = createGitHubClient(token);
        const data = await listRepos(octokit);
        console.log('useRepos - Fetched repos from API:', data.length);
        setRepos(data);
        setError(null);

        // Cache the result
        console.log('useRepos - Caching repos for 5 minutes');
        cache.set(cacheKey, data, 5 * 60 * 1000); // Cache for 5 minutes
      } catch (err: any) {
        console.error('useRepos - Error fetching repos:', err);
        setError(err.message);
      } finally {
        console.log('useRepos - Setting loading to false');
        setLoading(false);
      }
    };

    fetchRepos();
  }, [token, user]);

  console.log('useRepos - Returning state:', { repos: repos.length, loading, error });
  return { repos, loading, error };
}
