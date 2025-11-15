'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePull } from '@/hooks/usePulls';
import { useAuth } from '@/lib/context/AuthContext';
import { createGitHubClient } from '@/lib/github/client';
import { mergePR } from '@/lib/github/pulls';
import PRDiff from '@/components/pulls/PRDiff';
import CommentBox from '@/components/issues/CommentBox';
import styles from './page.module.css';

export default function PullRequestDetailsPage() {
  const params = useParams();
  const { token } = useAuth();
  const owner = params.owner as string;
  const repo = params.repo as string;
  const number = parseInt(params.number as string);

  const { pull, files, comments, loading, error, refresh } = usePull(owner, repo, number);
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

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

  const handleMerge = async () => {
    if (!token || !pull) return;

    setMerging(true);
    setMergeError(null);

    try {
      const octokit = createGitHubClient(token);
      await mergePR(octokit, owner, repo, number);
      await refresh();
    } catch (err: any) {
      setMergeError(err.message || 'Failed to merge pull request');
    } finally {
      setMerging(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading pull request...</div>
      </div>
    );
  }

  if (error || !pull) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error: {error || 'Pull request not found'}</div>
      </div>
    );
  }

  const isMerged = pull.merged;
  const isClosed = pull.state === 'closed';
  const canMerge = pull.state === 'open' && pull.mergeable;

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
        <Link href={`/repositories/${owner}/${repo}/pulls`} className={styles.breadcrumbLink}>
          Pull Requests
        </Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>#{number}</span>
      </div>

      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>
            {pull.title}
            <span className={styles.number}>#{number}</span>
          </h1>
        </div>

        <div className={styles.meta}>
          <span className={`${styles.state} ${isMerged ? styles.stateMerged : isClosed ? styles.stateClosed : styles.stateOpen}`}>
            {isMerged ? '✓ Merged' : isClosed ? '✕ Closed' : '● Open'}
          </span>
          <span className={styles.author}>
            {pull.user?.login} wants to merge {pull.commits} commit{pull.commits !== 1 ? 's' : ''} into <code className={styles.branch}>{pull.base.ref}</code> from <code className={styles.branch}>{pull.head.ref}</code>
          </span>
        </div>

        {pull.labels && pull.labels.length > 0 && (
          <div className={styles.labels}>
            {pull.labels.map((label: any) => (
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
          <div className={styles.prBody}>
            <div className={styles.commentHeader}>
              {pull.user?.avatar_url && (
                <img
                  src={pull.user.avatar_url}
                  alt={pull.user.login}
                  className={styles.avatar}
                />
              )}
              <div className={styles.commentMeta}>
                <span className={styles.commentAuthor}>{pull.user?.login}</span>
                <span className={styles.commentDate}>opened on {formatDate(pull.created_at)}</span>
              </div>
            </div>
            <div className={styles.commentBody}>
              {pull.body ? (
                <pre className={styles.bodyText}>{pull.body}</pre>
              ) : (
                <p className={styles.noDescription}>No description provided.</p>
              )}
            </div>
          </div>

          <div className={styles.diffSection}>
            <PRDiff files={files} />
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

          {!isClosed && !isMerged && (
            <div className={styles.newComment}>
              <h2 className={styles.commentsTitle}>Add a comment</h2>
              <CommentBox
                owner={owner}
                repo={repo}
                issueNumber={number}
                onSuccess={refresh}
              />
            </div>
          )}
        </div>

        <div className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>Changes</h3>
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Commits:</span>
                <span className={styles.statValue}>{pull.commits}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Files changed:</span>
                <span className={styles.statValue}>{pull.changed_files}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.additions}>+{pull.additions}</span>
                <span className={styles.deletions}>-{pull.deletions}</span>
              </div>
            </div>
          </div>

          {canMerge && (
            <div className={styles.mergeSection}>
              {mergeError && (
                <div className={styles.mergeError}>
                  {mergeError}
                </div>
              )}
              <button
                onClick={handleMerge}
                disabled={merging}
                className={styles.mergeBtn}
              >
                {merging ? 'Merging...' : 'Merge Pull Request'}
              </button>
            </div>
          )}

          {isMerged && (
            <div className={styles.mergedInfo}>
              <p>✓ Merged by {pull.merged_by?.login}</p>
              <p className={styles.mergedDate}>{formatDate(pull.merged_at)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
