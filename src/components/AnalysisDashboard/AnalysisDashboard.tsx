'use client';

import { Sparkles, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { ProjectStatus } from '@/types';
import styles from './AnalysisDashboard.module.css';

interface AnalysisDashboardProps {
  status: ProjectStatus;
  progress?: number;
  onStartAnalysis?: () => void;
  onExport?: () => void;
}

export default function AnalysisDashboard({
  status,
  progress = 0,
  onStartAnalysis,
  onExport,
}: AnalysisDashboardProps) {
  const getStatusContent = () => {
    switch (status) {
      case 'idle':
        return (
          <>
            <div className={styles.iconWrapper}>
              <Sparkles className={styles.icon} />
            </div>
            <h3 className={styles.title}>开始 AI 分析</h3>
            <p className={styles.description}>
              点击开始使用 AI 分析视频内容<br />
              生成字幕文件
            </p>
            <button className={styles.button} onClick={onStartAnalysis}>
              开始分析
            </button>
          </>
        );

      case 'uploading':
        return (
          <>
            <div className={styles.iconWrapper}>
              <Loader2 className={`${styles.icon} ${styles.spinning}`} />
            </div>
            <h3 className={styles.title}>上传视频中</h3>
            <p className={styles.description}>正在处理视频文件...</p>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={styles.progressText}>{progress}%</span>
          </>
        );

      case 'processing':
        return (
          <>
            <div className={styles.iconWrapper}>
              <Loader2 className={`${styles.icon} ${styles.spinning}`} />
            </div>
            <h3 className={styles.title}>提取视频帧</h3>
            <p className={styles.description}>正在从视频中提取关键帧...</p>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={styles.progressText}>{progress}%</span>
          </>
        );

      case 'analyzing':
        return (
          <>
            <div className={styles.iconWrapper}>
              <Sparkles className={`${styles.icon} ${styles.spinning}`} />
            </div>
            <h3 className={styles.title}>AI 智能分析中</h3>
            <p className={styles.description}>
              正在使用 AI 分析每一帧内容<br />
              这可能需要几分钟时间
            </p>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={styles.progressText}>{progress}%</span>
          </>
        );

      case 'completed':
        return (
          <>
            <div className={styles.iconWrapper}>
              <CheckCircle className={styles.icon} />
            </div>
            <h3 className={styles.title}>分析完成</h3>
            <p className={styles.description}>
              AI 分析已完成<br />
              你可以编辑字幕或导出 SRT 文件
            </p>
            <button className={`${styles.button} ${styles.success}`} onClick={onExport}>
              导出 SRT
            </button>
          </>
        );

      case 'error':
        return (
          <>
            <div className={styles.iconWrapper}>
              <XCircle className={`${styles.icon} ${styles.error}`} />
            </div>
            <h3 className={styles.title}>分析失败</h3>
            <p className={styles.description}>
              抱歉，分析过程中遇到错误<br />
              请检查 API Key 或网络连接
            </p>
            <button className={`${styles.button} ${styles.error}`} onClick={onStartAnalysis}>
              重试
            </button>
          </>
        );

      default:
        return null;
    }
  };

  return <div className={styles.container}>{getStatusContent()}</div>;
}
