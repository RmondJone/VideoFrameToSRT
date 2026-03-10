'use client';

import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Settings, Film } from 'lucide-react';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  src?: string;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
}

export default function VideoPlayer({
  src,
  currentTime = 0,
  onTimeUpdate,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setProgress(current);
      onTimeUpdate?.(current);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * duration;
      videoRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!src) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>
          <Film className={styles.placeholderIcon} />
          <span>暂无视频</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.videoWrapper}>
        <video
          ref={videoRef}
          src={src}
          className={styles.video}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        <div className={styles.controls}>
          <button className={styles.playButton} onClick={togglePlay}>
            {isPlaying ? (
              <Pause className={styles.playIcon} />
            ) : (
              <Play className={styles.playIcon} />
            )}
          </button>
          <div className={styles.progressContainer} onClick={handleProgressClick}>
            <div
              className={styles.progressFill}
              style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
            />
          </div>
          <span className={styles.time}>
            {formatTime(progress)} / {formatTime(duration)}
          </span>
          <button className={styles.settingsButton}>
            <Settings className={styles.settingsIcon} />
          </button>
        </div>
      </div>
    </div>
  );
}
