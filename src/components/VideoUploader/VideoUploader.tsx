'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Film } from 'lucide-react';
import styles from './VideoUploader.module.css';

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  progress?: number;
  uploadFileName?: string;
}

export default function VideoUploader({
  onFileSelect,
  isUploading = false,
  progress = 0,
  uploadFileName = '',
}: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('video/')) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleClick = () => {
    if (!isUploading) {
      inputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  // 上传中的显示
  if (isUploading) {
    const circumference = 2 * Math.PI * 34;
    const offset = circumference - (progress / 100) * circumference;

    return (
      <div className={`${styles.container} ${styles.uploading}`}>
        <div className={styles.progressContainer}>
          <div className={styles.progressCircle}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle
                className={styles.progressTrack}
                cx="40"
                cy="40"
                r="34"
              />
              <circle
                className={styles.progressFill}
                cx="40"
                cy="40"
                r="34"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <span className={styles.progressText}>{progress}%</span>
          </div>
          {uploadFileName && (
            <span className={styles.fileName}>{uploadFileName}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.container} ${isDragging ? styles.dragging : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className={styles.hidden}
      />
      <div className={styles.iconWrapper}>
        {isDragging ? (
          <Film className={styles.icon} />
        ) : (
          <Upload className={styles.icon} />
        )}
      </div>
      <h3 className={styles.title}>
        {isDragging ? '释放以上传视频' : '拖拽视频文件到此处'}
      </h3>
      <p className={styles.description}>或点击选择文件</p>
      <p className={styles.formats}>
        支持 MP4, MOV, AVI, MKV, WebM 格式
      </p>
    </div>
  );
}
