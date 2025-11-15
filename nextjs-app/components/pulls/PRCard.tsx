import Link from 'next/link';
import styles from './PRCard.module.css';

interface PRCardProps {
  pull: any;
  owner: string;
  repo: string;
}

export default function PRCard({ pull, owner, repo }: PRCardProps) {
  const getStateClass = () => {
    if (pull.state === 'closed' && pull.merged) {
      return styles.stateMerged;
    }
    return pull.state === 'open' ? styles.stateOpen : styles.stateClosed;
  };

  const getStateIcon = () => {
    if (pull.state === 'closed' && pull.merged) {
      return '✓';
    }
    return pull.state === 'open' ? '●' : '✕';
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
    <Link href={`/repositories/${owner}/${repo}/pulls/${pull.number}`} className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={`${styles.state} ${getStateClass()}`}>
            {getStateIcon()}
          </span>
          <h3>{pull.title}</h3>
        </div>
        <span className={styles.number}>#{pull.number}</span>
      </div>

      {pull.body && (
        <p className={styles.body}>
          {pull.body.substring(0, 150)}
          {pull.body.length > 150 ? '...' : ''}
        </p>
      )}

      <div className={styles.footer}>
        <div className={styles.meta}>
          <span className={styles.author}>
            {pull.user?.login || 'unknown'}
          </span>
          <span className={styles.branch}>
            {pull.head.ref} → {pull.base.ref}
          </span>
          <span className={styles.date}>{formatDate(pull.created_at)}</span>
        </div>

        <div className={styles.stats}>
          {pull.comments > 0 && (
            <span className={styles.comments}>
              💬 {pull.comments}
            </span>
          )}
          <span className={styles.changes}>
            <span className={styles.additions}>+{pull.additions || 0}</span>
            <span className={styles.deletions}>-{pull.deletions || 0}</span>
          </span>
          {pull.labels && pull.labels.length > 0 && (
            <div className={styles.labels}>
              {pull.labels.slice(0, 2).map((label: any) => (
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
