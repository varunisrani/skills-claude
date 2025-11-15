import styles from './PRDiff.module.css';

interface PRDiffProps {
  files: any[];
}

export default function PRDiff({ files }: PRDiffProps) {
  const getFileStatus = (status: string) => {
    switch (status) {
      case 'added':
        return { label: 'Added', class: styles.statusAdded };
      case 'removed':
        return { label: 'Deleted', class: styles.statusRemoved };
      case 'modified':
        return { label: 'Modified', class: styles.statusModified };
      case 'renamed':
        return { label: 'Renamed', class: styles.statusRenamed };
      default:
        return { label: status, class: '' };
    }
  };

  const totalAdditions = files.reduce((sum, file) => sum + (file.additions || 0), 0);
  const totalDeletions = files.reduce((sum, file) => sum + (file.deletions || 0), 0);
  const totalChanges = files.reduce((sum, file) => sum + (file.changes || 0), 0);

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        <h2 className={styles.title}>Files changed ({files.length})</h2>
        <div className={styles.stats}>
          <span className={styles.additions}>+{totalAdditions}</span>
          <span className={styles.deletions}>-{totalDeletions}</span>
          <span className={styles.changes}>{totalChanges} changes</span>
        </div>
      </div>

      <div className={styles.fileList}>
        {files.map((file, index) => {
          const status = getFileStatus(file.status);
          return (
            <div key={index} className={styles.file}>
              <div className={styles.fileHeader}>
                <div className={styles.fileName}>
                  <span className={`${styles.fileStatus} ${status.class}`}>
                    {status.label}
                  </span>
                  <span className={styles.filePath}>{file.filename}</span>
                </div>
                <div className={styles.fileStats}>
                  {file.additions > 0 && (
                    <span className={styles.fileAdditions}>+{file.additions}</span>
                  )}
                  {file.deletions > 0 && (
                    <span className={styles.fileDeletions}>-{file.deletions}</span>
                  )}
                </div>
              </div>

              {file.patch && (
                <div className={styles.patch}>
                  <pre className={styles.patchContent}>
                    {file.patch.split('\n').map((line: string, lineIndex: number) => {
                      let lineClass = styles.patchLine;
                      if (line.startsWith('+')) {
                        lineClass += ` ${styles.patchLineAdded}`;
                      } else if (line.startsWith('-')) {
                        lineClass += ` ${styles.patchLineRemoved}`;
                      } else if (line.startsWith('@@')) {
                        lineClass += ` ${styles.patchLineHeader}`;
                      }
                      return (
                        <div key={lineIndex} className={lineClass}>
                          {line}
                        </div>
                      );
                    })}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {files.length === 0 && (
        <div className={styles.empty}>
          <p>No files changed</p>
        </div>
      )}
    </div>
  );
}
