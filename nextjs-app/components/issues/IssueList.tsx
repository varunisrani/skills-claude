'use client';

import { useState } from 'react';
import IssueCard from './IssueCard';
import styles from './IssueList.module.css';

interface IssueListProps {
  issues: any[];
  owner: string;
  repo: string;
}

export default function IssueList({ issues, owner, repo }: IssueListProps) {
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIssues = issues.filter((issue) => {
    const matchesFilter = filter === 'all' || issue.state === filter;
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.body?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openCount = issues.filter(i => i.state === 'open').length;
  const closedCount = issues.filter(i => i.state === 'closed').length;

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === 'open' ? styles.active : ''}`}
            onClick={() => setFilter('open')}
          >
            Open ({openCount})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'closed' ? styles.active : ''}`}
            onClick={() => setFilter('closed')}
          >
            Closed ({closedCount})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({issues.length})
          </button>
        </div>

        <div className={styles.search}>
          <input
            type="text"
            placeholder="Search issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {filteredIssues.length === 0 ? (
        <div className={styles.empty}>
          <p>No issues found</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filteredIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              owner={owner}
              repo={repo}
            />
          ))}
        </div>
      )}
    </div>
  );
}
