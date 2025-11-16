'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { createGitHubClient } from '@/lib/github/client';
import { createComment } from '@/lib/github/issues';
import { cache } from '@/lib/storage/cache';
import styles from './CommentBox.module.css';

interface CommentBoxProps {
  owner: string;
  repo: string;
  issueNumber: number;
  onSuccess?: () => void;
}

export default function CommentBox({ owner, repo, issueNumber, onSuccess }: CommentBoxProps) {
  const { token, user } = useAuth();
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !body.trim()) return;

    setLoading(true);
    setError(null);

    try {
      console.log('CommentBox - Creating comment', { owner, repo, issueNumber, body: body.substring(0, 50) + '...' });
      
      const octokit = createGitHubClient(token);
      const result = await createComment(octokit, owner, repo, issueNumber, body);
      
      console.log('CommentBox - Comment created successfully', result);

      // Clear the issue cache to force refresh
      const cacheKey = `issue_${owner}_${repo}_${issueNumber}`;
      console.log('CommentBox - Clearing cache key:', cacheKey);
      cache.remove(cacheKey);

      // Reset form
      setBody('');

      // Call success callback
      if (onSuccess) {
        console.log('CommentBox - Calling onSuccess callback');
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {user?.avatar_url && (
          <img
            src={user.avatar_url}
            alt={user.login}
            className={styles.avatar}
          />
        )}
        <div className={styles.userInfo}>
          <span className={styles.username}>{user?.login || 'User'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment..."
          className={styles.textarea}
          rows={5}
          disabled={loading}
        />

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !body.trim()}
          >
            {loading ? 'Adding comment...' : 'Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}
