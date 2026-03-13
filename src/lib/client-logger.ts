import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LogEntry, LogLevel } from './logger';

interface LogState {
  logs: LogEntry[];
  addLog: (level: LogLevel, category: string, message: string, details?: string) => void;
  clearLogs: () => void;
  getLogs: () => LogEntry[];
}

export const useLogStore = create<LogState>()(
  persist(
    (set, get) => ({
      logs: [],

      addLog: (level, category, message, details) => {
        const entry: LogEntry = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          level,
          category,
          message,
          details,
        };

        set((state) => ({
          logs: [entry, ...state.logs].slice(0, 100), // 保留最近100条
        }));
      },

      clearLogs: () => set({ logs: [] }),

      getLogs: () => get().logs,
    }),
    {
      name: 'app-logs-storage',
      partialize: () => ({}), // 不持久化日志
    }
  )
);

// 便捷方法
export const log = (
  level: LogLevel,
  category: string,
  message: string,
  details?: string
) => {
  useLogStore.getState().addLog(level, category, message, details);
};

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
