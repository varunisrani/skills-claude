'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePulls } from '@/hooks/usePulls';
import PRList from '@/components/pulls/PRList';
import styles from './page.module.css';

export default function PullRequestsPage() {
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const { pulls, loading, error } = usePulls(owner, repo, 'all');

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading pull requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/repositories" className={styles.breadcrumbLink}>
            Repositories
          </Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <Link href={`/repositories/${owner}/${repo}`} className={styles.breadcrumbLink}>
            {owner}/{repo}
          </Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbCurrent}>Pull Requests</span>
        </div>

        <div className={styles.titleRow}>
          <h1 className={styles.title}>Pull Requests</h1>
        </div>
      </div>

      <div className={styles.content}>
        <PRList pulls={pulls} owner={owner} repo={repo} />
      </div>
    </div>
  );
}
