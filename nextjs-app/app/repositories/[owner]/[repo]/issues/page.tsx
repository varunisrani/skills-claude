'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useIssues } from '@/hooks/useIssues';
import IssueList from '@/components/issues/IssueList';
import IssueForm from '@/components/issues/IssueForm';
import { RotateCcw, Plus } from 'lucide-react';
import styles from './page.module.css';

export default function IssuesPage() {
  const params = useParams();
  const router = useRouter();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const [showForm, setShowForm] = useState(false);
  const [stateFilter, setStateFilter] = useState<'open' | 'closed' | 'all'>('open');

  const { issues, loading, error, refresh } = useIssues(owner, repo, stateFilter);

  console.log('IssuesPage - Current state:', { 
    issues: issues.length, 
    loading, 
    error, 
    stateFilter,
    issuesList: issues.map(issue => ({ id: issue.number, title: issue.title }))
  });

  const handleIssueCreated = () => {
    console.log('IssuesPage - Issue created, hiding form and refreshing');
    setShowForm(false);
    // Refresh issues data to show new issue
    refresh();
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
          <div className={styles.actions}>
            <button
              onClick={() => {
                console.log('Manual refresh button clicked');
                refresh();
              }}
              className={styles.refreshBtn}
              disabled={loading}
            >
              <RotateCcw size={16} className={loading ? styles.spinning : ''} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className={styles.newIssueBtn}
            >
              <Plus size={16} />
              {showForm ? 'Cancel' : 'New Issue'}
            </button>
          </div>
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
        <div className={styles.stateFilters}>
          <button
            className={`${styles.stateBtn} ${stateFilter === 'open' ? styles.active : ''}`}
            onClick={() => setStateFilter('open')}
          >
            Open Issues
          </button>
          <button
            className={`${styles.stateBtn} ${stateFilter === 'closed' ? styles.active : ''}`}
            onClick={() => setStateFilter('closed')}
          >
            Closed Issues
          </button>
          <button
            className={`${styles.stateBtn} ${stateFilter === 'all' ? styles.active : ''}`}
            onClick={() => setStateFilter('all')}
          >
            All Issues
          </button>
        </div>
        
        <IssueList issues={issues} owner={owner} repo={repo} hideStateFilter={true} />
      </div>
    </div>
  );
}
