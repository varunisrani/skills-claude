'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Github } from 'lucide-react';
import styles from './page.module.css';

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(token);
      router.push('/dashboard');
    } catch (err) {
      setError('Invalid token. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Github className={styles.icon} size={48} />
          <h1 className={styles.title}>GitHub Repository Manager</h1>
          <p className={styles.subtitle}>Login with your GitHub Personal Access Token</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="token" className={styles.label}>
              GitHub Personal Access Token
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className={styles.input}
              required
            />
            <p className={styles.hint}>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,user,read:org"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                Generate a new token
              </a>
              {' '}with <code>repo</code>, <code>user</code>, and <code>read:org</code> scopes
            </p>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className={styles.button}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>Your token is stored securely in your browser and never sent to any server.</p>
        </div>
      </div>
    </div>
  );
}
