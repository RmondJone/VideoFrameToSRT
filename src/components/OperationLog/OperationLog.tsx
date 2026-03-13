'use client';

import React from 'react';
import { useLogStore, logger } from '@/lib/client-logger';
import type { LogEntry, LogLevel } from '@/lib/logger';
import styles from './OperationLog.module.css';

const levelColors: Record<LogLevel, string> = {
  info: '#38b9fa',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  debug: '#8b5cf6',
};

const categoryEmojis: Record<string, string> = {
  upload: '📤',
  extract: '🎬',
  analyze: '🤖',
  generate: '💾',
  export: '📥',
  api: '🔌',
  config: '⚙️',
  cleanup: '🧹',
  merge: '🔗',
  save: '💿',
};

function formatLogTime(date: Date): string {
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

interface LogItemProps {
  entry: LogEntry;
}

function LogItem({ entry }: LogItemProps) {
  const emoji = categoryEmojis[entry.category] || '📋';
  const color = levelColors[entry.level];
  const levelEmoji = entry.level === 'success' ? '✅' :
    entry.level === 'error' ? '❌' :
    entry.level === 'warning' ? '⚠️' :
    entry.level === 'debug' ? '🔍' : 'ℹ️';

  return (
    <div className={styles.logItem} style={{ borderLeftColor: color }}>
      <span className={styles.time}>{formatLogTime(entry.timestamp)}</span>
      <span className={styles.level}>{levelEmoji}</span>
      <span className={styles.emoji}>{emoji}</span>
      <span className={styles.message}>{entry.message}</span>
      {entry.details && <span className={styles.details}>{entry.details}</span>}
    </div>
  );
}

export default function OperationLog() {
  const { logs, clearLogs } = useLogStore();

  // 初始提示
  React.useEffect(() => {
    if (logs.length === 0) {
      logger.info('system', '日志系统已就绪', '等待操作...');
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>📋 操作日志</span>
        {logs.length > 0 && (
          <button className={styles.clearBtn} onClick={clearLogs}>
            清空
          </button>
        )}
      </div>
      <div className={styles.logList}>
        {logs.length === 0 ? (
          <div className={styles.empty}>暂无日志</div>
        ) : (
          logs.map((entry) => <LogItem key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
