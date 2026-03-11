'use client';

import React, {useCallback, useRef, useState} from 'react';
import {FileText, Film} from 'lucide-react';
import {v4 as uuidv4} from 'uuid';
import {useAppStore} from '@/lib/store';
import type {SubtitleSegment, VideoProject} from '@/types';
import VideoUploader from '@/components/VideoUploader/VideoUploader';
import ModelConfigForm from '@/components/ModelConfigForm/ModelConfigForm';
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer';
import SubtitleEditor, {SubtitleEditorRef} from '@/components/SubtitleEditor/SubtitleEditor';
import AnalysisDashboard from '@/components/AnalysisDashboard/AnalysisDashboard';
import styles from './page.module.css';

export default function Home() {
    const {
        currentProject,
        aiConfig,
        addProject,
        setCurrentProject,
        updateProjectStatus,
        updateSubtitles,
    } = useAppStore();

    const subtitleEditRef = useRef<SubtitleEditorRef>(null);

    const [videoUrl, setVideoUrl] = useState<string>('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [videoCurrentTime, setVideoCurrentTime] = useState(0);
    const [selectedSegment, setSelectedSegment] = useState<SubtitleSegment>();
    const [editText, setEditText] = useState<string>('')

    // 处理文件选择
    const handleFileSelect = useCallback(
        async (file: File) => {
            if (!aiConfig.apiKey) {
                alert('请先配置 API Key');
                return;
            }

            setIsUploading(true);
            setUploadProgress(0);

            // 创建项目
            const project: VideoProject = {
                id: uuidv4(),
                fileName: file.name,
                fileSize: file.size,
                duration: 0,
                status: 'uploading',
                progress: 0,
                subtitles: [],
                createdAt: new Date(),
            };

            addProject(project);
            updateProjectStatus('uploading', 0);

            // 创建视频 URL
            const url = URL.createObjectURL(file);
            setVideoUrl(url);

            // 模拟上传进度
            const uploadInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    const newProgress = Math.min(prev + 10, 90);
                    setUploadProgress(newProgress);
                    updateProjectStatus('uploading', newProgress);
                    return newProgress;
                });
            }, 200);

            // 获取视频时长
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = url;
            video.onloadedmetadata = () => {
                clearInterval(uploadInterval);
                setUploadProgress(100);
                updateProjectStatus('uploading', 100);

                // 更新项目信息
                setCurrentProject({
                    ...currentProject!,
                    duration: video.duration,
                    status: 'idle',
                });

                setIsUploading(false);
            };
        },
        [aiConfig.apiKey, addProject, currentProject, setCurrentProject, updateProjectStatus]
    );

    // 开始分析
    const handleStartAnalysis = useCallback(async () => {
        if (!videoUrl || !aiConfig.apiKey) return;

        updateProjectStatus('processing', 0);

        try {
            // 1. 抽帧
            const extractResponse = await fetch('/api/extract-frames', {
                method: 'POST',
                body: new FormData(),
            });

            // 注意：这里需要上传实际文件，下面是简化版本
            // 实际实现需要将视频文件上传到服务器

            // 模拟抽帧完成
            setTimeout(() => {
                updateProjectStatus('processing', 100);
                updateProjectStatus('analyzing', 0);

                // 模拟分析完成
                setTimeout(() => {
                    // 生成示例字幕数据
                    const subtitles: SubtitleSegment[] = [
                        {
                            id: uuidv4(),
                            startTime: 0,
                            endTime: 3,
                            text: '欢迎使用 AI 字幕生成器',
                        },
                        {
                            id: uuidv4(),
                            startTime: 3,
                            endTime: 6,
                            text: '这是一个测试字幕',
                        },
                        {
                            id: uuidv4(),
                            startTime: 6,
                            endTime: 10,
                            text: '视频内容分析中...',
                        },
                    ];

                    updateSubtitles(subtitles);
                    updateProjectStatus('completed', 100);
                }, 2000);
            }, 1000);
        } catch (error) {
            console.error('Analysis error:', error);
            updateProjectStatus('error', 0, '分析失败，请重试');
        }
    }, [videoUrl, aiConfig.apiKey, updateProjectStatus, updateSubtitles]);

    // 导出 SRT
    const handleExport = useCallback(async () => {
        if (!currentProject?.subtitles.length) return;

        try {
            const response = await fetch('/api/generate-srt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subtitles: currentProject.subtitles,
                    language: aiConfig.language,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // 下载文件
                const blob = new Blob([data.data.srtContent], {type: 'text/plain'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = data.data.fileName;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Export error:', error);
        }
    }, [currentProject, aiConfig.language]);

    // 字幕时间点击
    const handleSubtitleTimeClick = useCallback((time: number) => {
        setVideoCurrentTime(time);
    }, []);

    const status = currentProject?.status || 'idle';
    const progress = currentProject?.progress || 0;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    /**
     * 绘制视频播放区域
     */
    function renderVideoPlayer() {
        return <div className={styles.leftPane}>
            <div className={styles.videoSection}>
                <VideoPlayer
                    src={videoUrl}
                    currentTime={videoCurrentTime}
                />
            </div>
            <div className={styles.editorSection}>
                <SubtitleEditor ref={subtitleEditRef} onSubtitleClick={(subtitle) => {
                    handleSubtitleTimeClick(subtitle.startTime)
                    setSelectedSegment(subtitle)
                    setEditText(subtitle.text)
                }}/>
            </div>
        </div>;
    }

    /**
     * 绘制视频上传区域
     */
    function renderUploaderView() {
        return <div className={styles.rightPane}>
            <div className={styles.uploadSection}>
                <VideoUploader
                    onFileSelect={handleFileSelect}
                    isUploading={isUploading}
                    progress={uploadProgress}
                    uploadFileName={currentProject?.fileName}
                />
            </div>
            <div className={styles.configSection}>
                <ModelConfigForm/>
            </div>
            <div className={styles.statusSection}>
                <AnalysisDashboard
                    status={status}
                    progress={progress}
                    onStartAnalysis={handleStartAnalysis}
                    onExport={handleExport}
                />
            </div>
        </div>;
    }

    /**
     * 绘制头部区域
     */
    function renderHeaderView() {
        return <header className={styles.header}>
            <div className={styles.logo}>
                <Film className={styles.logoIcon}/>
                <span className={styles.logoText}>
            Video<span className={styles.logoAccent}>2</span>SRT
          </span>
            </div>
        </header>;
    }


    /**
     *  编辑字幕区域
     */
    function renderEditInputArea() {
        if (!selectedSegment) {
            return (
                <div className={styles.container}>
                    <div className={styles.empty}>
                        <FileText className={styles.emptyIcon}/>
                        <p>暂未选中字幕数据</p>
                        <p style={{fontSize: '12px', marginTop: '8px'}}>
                            选中字幕数据之后开始编辑
                        </p>
                    </div>
                </div>
            );
        }
        return <div>
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
                onChange={(e) => setEditText(e.target.value)}
            />
            <button className={`${styles.button} ${styles.success}`} onClick={() => {
                subtitleEditRef.current?.handleSubtitleChange(editText)
            }}>
                保存字幕
            </button>
        </div>;
    }

    return (
        <div className={styles.main}>
            {/* 头部 */}
            {renderHeaderView()}
            {/* 主内容区 */}
            <main className={styles.content}>
                {renderEditInputArea()}
                {renderVideoPlayer()}
                {renderUploaderView()}
            </main>
        </div>
    );
}
