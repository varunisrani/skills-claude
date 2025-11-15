import styles from './ErrorMessage.module.css';

interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, title, onRetry }: ErrorMessageProps) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>⚠</div>
        {title && <h3 className={styles.title}>{title}</h3>}
        <p className={styles.message}>{message}</p>
        {onRetry && (
          <button onClick={onRetry} className={styles.retryBtn}>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
