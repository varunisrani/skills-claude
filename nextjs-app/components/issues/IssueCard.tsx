import Link from 'next/link';
import styles from './IssueCard.module.css';

interface IssueCardProps {
  issue: any;
  owner: string;
  repo: string;
}

export default function IssueCard({ issue, owner, repo }: IssueCardProps) {
  const getStateClass = () => {
    return issue.state === 'open' ? styles.stateOpen : styles.stateClosed;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Link href={`/repositories/${owner}/${repo}/issues/${issue.number}`} className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={`${styles.state} ${getStateClass()}`}>
            {issue.state === 'open' ? '●' : '✓'}
          </span>
          <h3>{issue.title}</h3>
        </div>
        <span className={styles.number}>#{issue.number}</span>
      </div>

      {issue.body && (
        <p className={styles.body}>
          {issue.body.substring(0, 150)}
          {issue.body.length > 150 ? '...' : ''}
        </p>
      )}

      <div className={styles.footer}>
        <div className={styles.meta}>
          <span className={styles.author}>
            Opened by {issue.user?.login || 'unknown'}
          </span>
          <span className={styles.date}>{formatDate(issue.created_at)}</span>
        </div>

        <div className={styles.stats}>
          {issue.comments > 0 && (
            <span className={styles.comments}>
              💬 {issue.comments}
            </span>
          )}
          {issue.labels && issue.labels.length > 0 && (
            <div className={styles.labels}>
              {issue.labels.slice(0, 3).map((label: any) => (
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
      </div>
    </Link>
  );
}
