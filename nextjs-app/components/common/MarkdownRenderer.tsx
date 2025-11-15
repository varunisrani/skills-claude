'use client';

import styles from './MarkdownRenderer.module.css';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Simple markdown-like rendering for now
  // For full markdown support, install and use react-markdown
  // npm install react-markdown

  const renderContent = () => {
    if (!content) return null;

    // Split by lines for processing
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let currentCodeBlock: string[] = [];
    let inCodeBlock = false;

    lines.forEach((line, index) => {
      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          elements.push(
            <pre key={`code-${index}`} className={styles.codeBlock}>
              <code>{currentCodeBlock.join('\n')}</code>
            </pre>
          );
          currentCodeBlock = [];
        }
        inCodeBlock = !inCodeBlock;
        return;
      }

      if (inCodeBlock) {
        currentCodeBlock.push(line);
        return;
      }

      // Flush any current list
      if (!line.startsWith('- ') && !line.startsWith('* ') && currentList.length > 0) {
        elements.push(
          <ul key={`list-${index}`} className={styles.list}>
            {currentList.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );
        currentList = [];
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(<h1 key={index} className={styles.h1}>{line.substring(2)}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={index} className={styles.h2}>{line.substring(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={index} className={styles.h3}>{line.substring(4)}</h3>);
      }
      // Lists
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        currentList.push(line.substring(2));
      }
      // Inline code
      else if (line.includes('`')) {
        const parts = line.split('`');
        const rendered = parts.map((part, i) =>
          i % 2 === 0 ? part : <code key={i} className={styles.inlineCode}>{part}</code>
        );
        elements.push(<p key={index} className={styles.paragraph}>{rendered}</p>);
      }
      // Regular paragraphs
      else if (line.trim()) {
        elements.push(<p key={index} className={styles.paragraph}>{line}</p>);
      }
      // Empty lines
      else {
        elements.push(<br key={index} />);
      }
    });

    // Flush any remaining list
    if (currentList.length > 0) {
      elements.push(
        <ul key="list-final" className={styles.list}>
          {currentList.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }

    return elements;
  };

  return (
    <div className={styles.container}>
      {renderContent()}
    </div>
  );
}
