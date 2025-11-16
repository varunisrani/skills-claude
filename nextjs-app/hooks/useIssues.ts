'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { createGitHubClient } from '@/lib/github/client';
import { listIssues, getIssue, listComments, listIssueTimeline } from '@/lib/github/issues';
import { cache } from '@/lib/storage/cache';

export function useIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') {
  const { token } = useAuth();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('useIssues - Hook called', { owner, repo, state });

  useEffect(() => {
    console.log('useIssues - useEffect triggered', { token: !!token, owner, repo, state });
    
    if (!token || !owner || !repo) {
      console.log('useIssues - Missing required params, skipping fetch');
      setLoading(false);
      return;
    }

    const fetchIssues = async () => {
      try {
        console.log('useIssues - Starting to fetch issues');
        setLoading(true);

        // Try to get from cache
        const cacheKey = `issues_${owner}_${repo}_${state}`;
        console.log('useIssues - Checking cache with key:', cacheKey);
        const cached = cache.get<any[]>(cacheKey);

        if (cached) {
          console.log('useIssues - Found cached issues:', cached.length);
          setIssues(cached);
          setLoading(false);
          return;
        }

        console.log('useIssues - No cache found, fetching from API');
        // Fetch from API if not in cache
        const octokit = createGitHubClient(token);
        const data = await listIssues(octokit, owner, repo, state);
        console.log('useIssues - Fetched issues from API:', data.length);
        setIssues(data);
        setError(null);

        // Cache the result for shorter time to ensure fresh data
        console.log('useIssues - Caching issues for 30 seconds');
        cache.set(cacheKey, data, 30 * 1000); // Cache for 30 seconds only
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [token, owner, repo, state]);

  const refresh = async () => {
    console.log('useIssues - Refresh called', { owner, repo, state });
    
    if (!token || !owner || !repo) {
      console.log('useIssues - Cannot refresh, missing params');
      return;
    }
    
    // Clear ALL issue caches for this repository to ensure fresh data
    const allStates = ['open', 'closed', 'all'];
    allStates.forEach(s => {
      const cacheKey = `issues_${owner}_${repo}_${s}`;
      console.log('useIssues - Clearing cache key:', cacheKey);
      cache.remove(cacheKey);
    });
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('useIssues - Refreshing issues from API');
      const octokit = createGitHubClient(token);
      const data = await listIssues(octokit, owner, repo, state);
      console.log('useIssues - Refresh fetched issues:', data.length, data.map(issue => ({
        number: issue.number,
        title: issue.title,
        created_at: issue.created_at
      })));
      
      setIssues(data);
      
      // Update cache with shorter expiry
      const cacheKey = `issues_${owner}_${repo}_${state}`;
      console.log('useIssues - Updating cache after refresh with key:', cacheKey);
      cache.set(cacheKey, data, 30 * 1000);
    } catch (err: any) {
      console.error('useIssues - Refresh error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  console.log('useIssues - Returning state:', { issues: issues.length, loading, error });
  return { issues, loading, error, refresh };
}

export function useIssue(owner: string, repo: string, issueNumber: number, enablePolling: boolean = true) {
  const { token } = useAuth();
  const [issue, setIssue] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCommentCount, setLastCommentCount] = useState(0);

  const fetchIssueAndComments = async (isPolling: boolean = false) => {
    if (!token || !owner || !repo || !issueNumber) {
      if (!isPolling) setLoading(false);
      return;
    }

    try {
      if (!isPolling) setLoading(true);

      // Always fetch fresh data when polling
      const octokit = createGitHubClient(token);
      const [issueData, commentsData, timelineData] = await Promise.all([
        getIssue(octokit, owner, repo, issueNumber),
        listComments(octokit, owner, repo, issueNumber),
        listIssueTimeline(octokit, owner, repo, issueNumber),
      ]);

      // Check if there are new comments
      if (isPolling && commentsData.length > lastCommentCount) {
        console.log('useIssue - New comments detected:', commentsData.length - lastCommentCount);
      }

      // Log timeline data to see what bot activities we can capture
      console.log('useIssue - Timeline data:', timelineData.filter(item => 
        item.event === 'cross-referenced' || 
        item.event === 'commented' || 
        item.actor?.type === 'Bot'
      ));

      setIssue(issueData);
      setComments(commentsData);
      setTimeline(timelineData);
      setLastCommentCount(commentsData.length);
      setError(null);

      // Update cache with shorter expiry for real-time updates
      const cacheKey = `issue_${owner}_${repo}_${issueNumber}`;
      cache.set(cacheKey, { issue: issueData, comments: commentsData, timeline: timelineData }, 10 * 1000); // Cache for only 10 seconds
    } catch (err: any) {
      if (!isPolling) setError(err.message);
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchIssueAndComments();

    // Set up polling interval if enabled
    if (enablePolling && token && owner && repo && issueNumber) {
      const interval = setInterval(() => {
        fetchIssueAndComments(true);
      }, 5000); // Poll every 5 seconds for faster comment updates

      return () => clearInterval(interval);
    }
  }, [token, owner, repo, issueNumber, enablePolling]);

  const refresh = async () => {
    await fetchIssueAndComments();
  };

  return { issue, comments, timeline, loading, error, refresh };
}
