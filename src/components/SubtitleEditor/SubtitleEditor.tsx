'use client';

import { useState, useEffect } from 'react';
import { FileText, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { SubtitleSegment } from '@/types';
import styles from './SubtitleEditor.module.css';

interface SubtitleEditorProps {
  onTimeClick?: (time: number) => void;
}

export default function SubtitleEditor({ onTimeClick }: SubtitleEditorProps) {
  const { currentProject, updateSubtitles } = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const subtitles = currentProject?.subtitles || [];

  const selectedSegment = subtitles.find((s) => s.id === selectedId);

  useEffect(() => {
    if (selectedSegment) {
      setEditText(selectedSegment.text);
    }
  }, [selectedSegment]);

  const handleSegmentClick = (segment: SubtitleSegment) => {
    setSelectedId(segment.id);
    onTimeClick?.(segment.startTime);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value);
  };

  const handleTextBlur = () => {
    if (selectedId && editText !== selectedSegment?.text) {
      const updated = subtitles.map((s) =>
        s.id === selectedId ? { ...s, text: editText } : s
      );
      updateSubtitles(updated);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  if (subtitles.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <FileText className={styles.emptyIcon} />
          <p>暂无字幕数据</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>
            上传视频并运行 AI 分析后生成
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>字幕编辑</h3>
        <span className={styles.count}>{subtitles.length} 条</span>
      </div>

      <div className={styles.list}>
        {subtitles.map((segment) => (
          <div
            key={segment.id}
            className={`${styles.segment} ${segment.id === selectedId ? styles.active : ''}`}
            onClick={() => handleSegmentClick(segment)}
          >
            <div className={styles.timeColumn}>
              <span className={styles.time}>{formatTime(segment.startTime)}</span>
              <span className={styles.timeDivider}>→</span>
              <span className={styles.time}>{formatTime(segment.endTime)}</span>
            </div>
            <div className={styles.contentColumn}>
              <p className={segment.text ? styles.text : styles.textEmpty}>
                {segment.text || '（无文本）'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {selectedSegment && (
        <div className={styles.editArea}>
          <div className={styles.editTime}>
            <span className={styles.timeLabel}>时间范围：</span>
            <input
              type="text"
              className={styles.timeInput}
              value={formatTime(selectedSegment.startTime)}
              readOnly
            />
            <span className={styles.timeLabel}>→</span>
            <input
              type="text"
              className={styles.timeInput}
              value={formatTime(selectedSegment.endTime)}
              readOnly
            />
          </div>
          <textarea
            className={styles.textarea}
            placeholder="输入字幕文本..."
            value={editText}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
          />
        </div>
      )}
    </div>
  );
}
