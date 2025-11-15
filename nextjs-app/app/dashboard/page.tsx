'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useRepos } from '@/hooks/useRepos';
import Link from 'next/link';
import { FolderGit2, Star, GitFork } from 'lucide-react';
import styles from './page.module.css';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { repos, loading: reposLoading } = useRepos();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.welcome}>
          <h1 className={styles.title}>Welcome back, {user.name || user.login}!</h1>
          <p className={styles.subtitle}>Manage your GitHub repositories, issues, and pull requests</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FolderGit2 size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>{repos.length}</h3>
            <p className={styles.statLabel}>Repositories</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Star size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>{totalStars}</h3>
            <p className={styles.statLabel}>Total Stars</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <GitFork size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>{totalForks}</h3>
            <p className={styles.statLabel}>Total Forks</p>
          </div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <Link href="/repositories" className={styles.actionCard}>
            <FolderGit2 size={32} />
            <h3>View Repositories</h3>
            <p>Browse and manage all your repositories</p>
          </Link>
        </div>
      </div>

      {reposLoading && (
        <div className={styles.loadingSection}>
          <div className={styles.spinner}></div>
          <p>Loading repositories...</p>
        </div>
      )}
    </div>
  );
}
