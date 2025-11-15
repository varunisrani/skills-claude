import Link from 'next/link';
import { Star, GitFork, Code, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import styles from './RepoCard.module.css';

interface RepoCardProps {
  repo: any;
}

export default function RepoCard({ repo }: RepoCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Link
          href={`/repositories/${repo.owner.login}/${repo.name}`}
          className={styles.repoName}
        >
          {repo.name}
        </Link>
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.externalLink}
          title="Open on GitHub"
        >
          <ExternalLink size={16} />
        </a>
      </div>

      {repo.description && (
        <p className={styles.description}>
          {repo.description}
        </p>
      )}

      <div className={styles.meta}>
        {repo.language && (
          <div className={styles.language}>
            <Code size={14} />
            <span>{repo.language}</span>
          </div>
        )}
        <div className={styles.stats}>
          <span className={styles.stat}>
            <Star size={14} />
            {repo.stargazers_count}
          </span>
          <span className={styles.stat}>
            <GitFork size={14} />
            {repo.forks_count}
          </span>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.updated}>
          Updated {formatDistanceToNow(new Date(repo.updated_at), { addSuffix: true })}
        </span>
        {repo.private && (
          <span className={styles.badge}>Private</span>
        )}
      </div>
    </div>
  );
}
