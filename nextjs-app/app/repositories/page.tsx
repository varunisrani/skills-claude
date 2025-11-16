'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useRepos } from '@/hooks/useRepos';
import RepoCard from '@/components/repository/RepoCard';
import { Search, AlertCircle } from 'lucide-react';
import styles from './page.module.css';

export default function RepositoriesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { repos, loading, error } = useRepos();
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  console.log('RepositoriesPage - Component rendered');
  console.log('RepositoriesPage - Auth state:', { user, authLoading });
  console.log('RepositoriesPage - Repos state:', { repos, loading, error });
  console.log('RepositoriesPage - Search query:', searchQuery);

  useEffect(() => {
    console.log('RepositoriesPage - useEffect triggered', { authLoading, user });
    if (!authLoading && !user) {
      console.log('RepositoriesPage - Redirecting to home, no user found');
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  const filteredRepos = repos.filter((repo) => {
    const query = searchQuery.toLowerCase();
    return (
      repo.name.toLowerCase().includes(query) ||
      repo.description?.toLowerCase().includes(query) ||
      repo.language?.toLowerCase().includes(query)
    );
  });

  console.log('RepositoriesPage - Filtered repos:', filteredRepos.length, 'out of', repos.length);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Repositories</h1>
          <p className={styles.subtitle}>
            {repos.length} {repos.length === 1 ? 'repository' : 'repositories'}
          </p>
        </div>

        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {loading && (
        <div className={styles.loadingSection}>
          <div className={styles.spinner}></div>
          <p>Loading repositories...</p>
        </div>
      )}

      {error && (
        <div className={styles.errorContainer}>
          <AlertCircle size={24} />
          <p>Error loading repositories: {error}</p>
        </div>
      )}

      {!loading && !error && filteredRepos.length === 0 && (
        <div className={styles.emptyState}>
          {searchQuery ? (
            <>
              <p className={styles.emptyTitle}>No repositories found</p>
              <p className={styles.emptyDescription}>
                Try adjusting your search query
              </p>
            </>
          ) : (
            <>
              <p className={styles.emptyTitle}>No repositories yet</p>
              <p className={styles.emptyDescription}>
                Create your first repository on GitHub to get started
              </p>
            </>
          )}
        </div>
      )}

      {!loading && !error && filteredRepos.length > 0 && (
        <div className={styles.repoGrid}>
          {filteredRepos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </div>
  );
}
