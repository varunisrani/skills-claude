'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Github, LogOut, Home, FolderGit2 } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <Link href="/dashboard" className={styles.logo}>
            <Github size={24} />
            <span className={styles.logoText}>GitHub Manager</span>
          </Link>

          <div className={styles.navLinks}>
            <Link href="/dashboard" className={styles.navLink}>
              <Home size={18} />
              <span>Dashboard</span>
            </Link>
            <Link href="/repositories" className={styles.navLink}>
              <FolderGit2 size={18} />
              <span>Repositories</span>
            </Link>
          </div>
        </div>

        <div className={styles.rightSection}>
          {user && (
            <>
              <div className={styles.userInfo}>
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className={styles.avatar}
                />
                <span className={styles.username}>{user.login}</span>
              </div>
              <button onClick={handleLogout} className={styles.logoutButton}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
