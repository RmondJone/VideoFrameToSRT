/**
 * 日志工具模块
 * 使用 emoji 标注不同类型的操作
 */

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  details?: string;
}

// Emoji 映射
const levelEmojis: Record<LogLevel, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  debug: '🔍',
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

/**
 * 格式化日志时间
 */
export function formatLogTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * 创建日志条目
 */
export function createLogEntry(
  level: LogLevel,
  category: string,
  message: string,
  details?: string
): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    level,
    category,
    message,
    details,
  };
}

/**
 * 格式化日志条目为字符串
 */
export function formatLogString(entry: LogEntry): string {
  const levelEmoji = levelEmojis[entry.level];
  const categoryEmoji = categoryEmojis[entry.category] || '📋';
  const time = formatLogTime(entry.timestamp);

  let result = `${time} ${levelEmoji} ${categoryEmoji} ${entry.message}`;
  if (entry.details) {
    result += ` | ${entry.details}`;
  }
  return result;
}

/**
 * 打印日志到控制台（服务端使用）
 */
export function log(
  level: LogLevel,
  category: string,
  message: string,
  details?: string
): void {
  const entry = createLogEntry(level, category, message, details);
  const formatted = formatLogString(entry);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warning':
      console.warn(formatted);
      break;
    case 'debug':
      console.debug(formatted);
      break;
    default:
      console.log(formatted);
  }
}

// 便捷方法
export const logger = {
  info: (category: string, message: string, details?: string) =>
    log('info', category, message, details),
  success: (category: string, message: string, details?: string) =>
    log('success', category, message, details),
  warning: (category: string, message: string, details?: string) =>
    log('warning', category, message, details),
  error: (category: string, message: string, details?: string) =>
    log('error', category, message, details),
  debug: (category: string, message: string, details?: string) =>
    log('debug', category, message, details),
};
