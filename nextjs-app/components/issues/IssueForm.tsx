'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { createGitHubClient } from '@/lib/github/client';
import { createIssue } from '@/lib/github/issues';
import styles from './IssueForm.module.css';

interface IssueFormProps {
  owner: string;
  repo: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function IssueForm({ owner, repo, onSuccess, onCancel }: IssueFormProps) {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !title.trim()) return;

    console.log('IssueForm - Creating issue', { owner, repo, title });
    setLoading(true);
    setError(null);

    try {
      const octokit = createGitHubClient(token);
      const result = await createIssue(octokit, owner, repo, title, body);
      console.log('IssueForm - Issue created successfully', result);

      // Reset form
      setTitle('');
      setBody('');

      // Call success callback
      if (onSuccess) {
        console.log('IssueForm - Calling onSuccess callback');
        onSuccess();
      }
    } catch (err: any) {
      console.error('IssueForm - Error creating issue:', err);
      setError(err.message || 'Failed to create issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="title" className={styles.label}>
          Title <span className={styles.required}>*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Issue title"
          className={styles.input}
          required
          disabled={loading}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="body" className={styles.label}>
          Description
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a description (optional)"
          className={styles.textarea}
          rows={8}
          disabled={loading}
        />
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.actions}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelBtn}
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading || !title.trim()}
        >
          {loading ? 'Creating...' : 'Create Issue'}
        </button>
      </div>
    </form>
  );
}
