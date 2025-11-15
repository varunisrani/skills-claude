'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useIssues } from '@/hooks/useIssues';
import IssueList from '@/components/issues/IssueList';
import IssueForm from '@/components/issues/IssueForm';
import styles from './page.module.css';

export default function IssuesPage() {
  const params = useParams();
  const router = useRouter();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const [showForm, setShowForm] = useState(false);
  const [stateFilter, setStateFilter] = useState<'open' | 'closed' | 'all'>('open');

  const { issues, loading, error } = useIssues(owner, repo, stateFilter);

  const handleIssueCreated = () => {
    setShowForm(false);
    // Refresh the page to show new issue
    router.refresh();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading issues...</div>
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
          <span className={styles.breadcrumbCurrent}>Issues</span>
        </div>

        <div className={styles.titleRow}>
          <h1 className={styles.title}>Issues</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className={styles.newIssueBtn}
          >
            {showForm ? 'Cancel' : 'New Issue'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className={styles.formSection}>
          <h2 className={styles.formTitle}>Create New Issue</h2>
          <IssueForm
            owner={owner}
            repo={repo}
            onSuccess={handleIssueCreated}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className={styles.content}>
        <IssueList issues={issues} owner={owner} repo={repo} />
      </div>
    </div>
  );
}
