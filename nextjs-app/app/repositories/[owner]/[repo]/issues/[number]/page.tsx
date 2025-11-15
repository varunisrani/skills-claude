'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useIssue } from '@/hooks/useIssues';
import { useAuth } from '@/lib/context/AuthContext';
import { createGitHubClient } from '@/lib/github/client';
import { updateIssue } from '@/lib/github/issues';
import CommentBox from '@/components/issues/CommentBox';
import styles from './page.module.css';
import { useState } from 'react';

export default function IssueDetailsPage() {
  const params = useParams();
  const { token } = useAuth();
  const owner = params.owner as string;
  const repo = params.repo as string;
  const number = parseInt(params.number as string);

  const { issue, comments, loading, error, refresh } = useIssue(owner, repo, number);
  const [updating, setUpdating] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleToggleState = async () => {
    if (!token || !issue) return;

    setUpdating(true);
    try {
      const octokit = createGitHubClient(token);
      const newState = issue.state === 'open' ? 'closed' : 'open';
      await updateIssue(octokit, owner, repo, number, newState);
      await refresh();
    } catch (err) {
      console.error('Failed to update issue:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading issue...</div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error: {error || 'Issue not found'}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href="/repositories" className={styles.breadcrumbLink}>
          Repositories
        </Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <Link href={`/repositories/${owner}/${repo}`} className={styles.breadcrumbLink}>
          {owner}/{repo}
        </Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <Link href={`/repositories/${owner}/${repo}/issues`} className={styles.breadcrumbLink}>
          Issues
        </Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>#{number}</span>
      </div>

      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>
            {issue.title}
            <span className={styles.number}>#{number}</span>
          </h1>
        </div>

        <div className={styles.meta}>
          <span className={`${styles.state} ${issue.state === 'open' ? styles.stateOpen : styles.stateClosed}`}>
            {issue.state === 'open' ? '● Open' : '✓ Closed'}
          </span>
          <span className={styles.author}>
            {issue.user?.login} opened this issue on {formatDate(issue.created_at)}
          </span>
          {issue.comments > 0 && (
            <span className={styles.commentCount}>
              {issue.comments} {issue.comments === 1 ? 'comment' : 'comments'}
            </span>
          )}
        </div>

        {issue.labels && issue.labels.length > 0 && (
          <div className={styles.labels}>
            {issue.labels.map((label: any) => (
              <span
                key={label.id}
                className={styles.label}
                style={{ backgroundColor: `#${label.color}` }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.mainSection}>
          <div className={styles.issueBody}>
            <div className={styles.commentHeader}>
              {issue.user?.avatar_url && (
                <img
                  src={issue.user.avatar_url}
                  alt={issue.user.login}
                  className={styles.avatar}
                />
              )}
              <div className={styles.commentMeta}>
                <span className={styles.commentAuthor}>{issue.user?.login}</span>
                <span className={styles.commentDate}>commented on {formatDate(issue.created_at)}</span>
              </div>
            </div>
            <div className={styles.commentBody}>
              {issue.body ? (
                <pre className={styles.bodyText}>{issue.body}</pre>
              ) : (
                <p className={styles.noDescription}>No description provided.</p>
              )}
            </div>
          </div>

          {comments && comments.length > 0 && (
            <div className={styles.comments}>
              <h2 className={styles.commentsTitle}>Comments</h2>
              {comments.map((comment: any) => (
                <div key={comment.id} className={styles.comment}>
                  <div className={styles.commentHeader}>
                    {comment.user?.avatar_url && (
                      <img
                        src={comment.user.avatar_url}
                        alt={comment.user.login}
                        className={styles.avatar}
                      />
                    )}
                    <div className={styles.commentMeta}>
                      <span className={styles.commentAuthor}>{comment.user?.login}</span>
                      <span className={styles.commentDate}>commented on {formatDate(comment.created_at)}</span>
                    </div>
                  </div>
                  <div className={styles.commentBody}>
                    <pre className={styles.bodyText}>{comment.body}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.newComment}>
            <h2 className={styles.commentsTitle}>Add a comment</h2>
            <CommentBox
              owner={owner}
              repo={repo}
              issueNumber={number}
              onSuccess={refresh}
            />
          </div>
        </div>

        <div className={styles.sidebar}>
          <button
            onClick={handleToggleState}
            disabled={updating}
            className={issue.state === 'open' ? styles.closeBtn : styles.reopenBtn}
          >
            {updating ? 'Updating...' : issue.state === 'open' ? 'Close Issue' : 'Reopen Issue'}
          </button>
        </div>
      </div>
    </div>
  );
}
