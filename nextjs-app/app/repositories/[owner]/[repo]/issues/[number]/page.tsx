'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useIssue } from '@/hooks/useIssues';
import { useAuth } from '@/lib/context/AuthContext';
import { createGitHubClient } from '@/lib/github/client';
import { updateIssue } from '@/lib/github/issues';
import CommentBox from '@/components/issues/CommentBox';
import styles from './page.module.css';
import { useState, useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';

export default function IssueDetailsPage() {
  const params = useParams();
  const { token } = useAuth();
  const owner = params.owner as string;
  const repo = params.repo as string;
  const number = parseInt(params.number as string);

  const { issue, comments, timeline, loading, error, refresh } = useIssue(owner, repo, number);
  const [updating, setUpdating] = useState(false);
  const [newCommentIds, setNewCommentIds] = useState<Set<number>>(new Set());
  const previousCommentsRef = useRef<any[]>([]);

  // Track new comments
  useEffect(() => {
    if (comments && previousCommentsRef.current.length > 0) {
      const previousIds = new Set(previousCommentsRef.current.map(c => c.id));
      const newIds = comments.filter(c => !previousIds.has(c.id)).map(c => c.id);
      
      if (newIds.length > 0) {
        console.log('New comments added:', newIds.length);
        setNewCommentIds(new Set(newIds));
        
        // Clear the "new" indicator after 10 seconds
        setTimeout(() => {
          setNewCommentIds(new Set());
        }, 10000);
      }
    }
    previousCommentsRef.current = comments || [];
  }, [comments]);

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
          <button
            onClick={() => {
              console.log('Issue detail refresh button clicked');
              refresh();
            }}
            className={styles.refreshBtn}
            disabled={loading}
          >
            <RotateCcw size={16} className={loading ? styles.spinning : ''} />
            {loading ? 'Refreshing...' : 'Refresh Comments'}
          </button>
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
              <h2 className={styles.commentsTitle}>
                Comments
                {newCommentIds.size > 0 && (
                  <span className={styles.newIndicator}>
                    {newCommentIds.size} new
                  </span>
                )}
              </h2>
              {comments.map((comment: any) => {
                const isNew = newCommentIds.has(comment.id);
                const isBot = comment.user?.type === 'Bot' || comment.performed_via_github_app;
                const isClaude = comment.user?.login === 'claude' || 
                                 comment.user?.login?.includes('claude') ||
                                 comment.body?.includes('Claude finished') ||
                                 comment.body?.includes('Claude Code is working');
                
                console.log('Comment analysis:', {
                  id: comment.id,
                  user: comment.user?.login,
                  user_type: comment.user?.type,
                  performed_via_github_app: !!comment.performed_via_github_app,
                  isBot,
                  isClaude,
                  created_at: comment.created_at
                });
                
                return (
                  <div 
                    key={comment.id} 
                    className={`${styles.comment} ${isNew ? styles.newComment : ''} ${isBot ? styles.botComment : ''} ${isClaude ? styles.claudeComment : ''}`}
                  >
                    <div className={styles.commentHeader}>
                      {comment.user?.avatar_url && (
                        <img
                          src={comment.user.avatar_url}
                          alt={comment.user.login}
                          className={styles.avatar}
                        />
                      )}
                      <div className={styles.commentMeta}>
                        <span className={styles.commentAuthor}>
                          {comment.user?.login}
                          {isBot && <span className={styles.botBadge}>BOT</span>}
                          {isClaude && <span className={styles.claudeBadge}>CLAUDE</span>}
                        </span>
                        <span className={styles.commentDate}>
                          commented on {formatDate(comment.created_at)}
                          {isNew && <span className={styles.newBadge}>NEW</span>}
                        </span>
                      </div>
                    </div>
                    <div className={styles.commentBody}>
                      <div 
                        className={styles.bodyText}
                        dangerouslySetInnerHTML={{
                          __html: comment.body?.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {timeline && timeline.length > 0 && (
            <div className={styles.timeline}>
              <h2 className={styles.commentsTitle}>Timeline Events</h2>
              {timeline
                .filter(event => 
                  event.event === 'cross-referenced' || 
                  event.actor?.type === 'Bot' ||
                  (event.event === 'commented' && event.actor?.login !== issue?.user?.login)
                )
                .map((event: any) => (
                  <div key={event.id || event.created_at} className={styles.timelineEvent}>
                    <div className={styles.commentHeader}>
                      {event.actor?.avatar_url && (
                        <img
                          src={event.actor.avatar_url}
                          alt={event.actor.login}
                          className={styles.avatar}
                        />
                      )}
                      <div className={styles.commentMeta}>
                        <span className={styles.commentAuthor}>
                          {event.actor?.login || 'System'}
                          {event.actor?.type === 'Bot' && <span className={styles.botBadge}>BOT</span>}
                        </span>
                        <span className={styles.commentDate}>
                          {event.event} on {formatDate(event.created_at)}
                        </span>
                      </div>
                    </div>
                    {event.body && (
                      <div className={styles.commentBody}>
                        <pre className={styles.bodyText}>{event.body}</pre>
                      </div>
                    )}
                    {event.source && (
                      <div className={styles.commentBody}>
                        <p className={styles.timelineLink}>
                          Referenced from: <a href={event.source.issue?.html_url} target="_blank" rel="noopener noreferrer">
                            {event.source.issue?.title}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          <div className={styles.newCommentSection}>
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
