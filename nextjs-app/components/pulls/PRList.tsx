'use client';

import { useState } from 'react';
import PRCard from './PRCard';
import styles from './PRList.module.css';

interface PRListProps {
  pulls: any[];
  owner: string;
  repo: string;
}

export default function PRList({ pulls, owner, repo }: PRListProps) {
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPulls = pulls.filter((pull) => {
    const matchesFilter = filter === 'all' || pull.state === filter;
    const matchesSearch = pull.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pull.body?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openCount = pulls.filter(p => p.state === 'open').length;
  const closedCount = pulls.filter(p => p.state === 'closed').length;

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
            All ({pulls.length})
          </button>
        </div>

        <div className={styles.search}>
          <input
            type="text"
            placeholder="Search pull requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {filteredPulls.length === 0 ? (
        <div className={styles.empty}>
          <p>No pull requests found</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filteredPulls.map((pull) => (
            <PRCard
              key={pull.id}
              pull={pull}
              owner={owner}
              repo={repo}
            />
          ))}
        </div>
      )}
    </div>
  );
}
