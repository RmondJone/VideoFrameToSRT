'use client';

import React, {useCallback, useRef, useState} from 'react';
import {FileText, Film, Trash2} from 'lucide-react';
import {v4 as uuidv4} from 'uuid';
import {useAppStore} from '@/lib/store';
import {logger} from '@/lib/client-logger';
import type {SubtitleSegment, VideoProject} from '@/types';
import VideoUploader from '@/components/VideoUploader/VideoUploader';
import ModelConfigForm from '@/components/ModelConfigForm/ModelConfigForm';
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer';
import SubtitleEditor, {SubtitleEditorRef} from '@/components/SubtitleEditor/SubtitleEditor';
import AnalysisDashboard from '@/components/AnalysisDashboard/AnalysisDashboard';
import OperationLog from '@/components/OperationLog/OperationLog';
import styles from './page.module.css';

export default function Home() {
    const {
        currentProject,
        aiConfig,
        addProject,
        setCurrentProject,
        updateProjectStatus,
        updateSubtitles,
        clearCurrentProject,
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
                logger.warning('config', 'API Key 未配置', '请先在设置中配置 API Key');
                alert('请先配置 API Key');
                return;
            }

            logger.info('upload', '开始上传视频', `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
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
                logger.success('upload', '视频上传完成', `时长: ${Math.floor(video.duration)}s`);
            };
        },
        [aiConfig.apiKey, addProject, currentProject, setCurrentProject, updateProjectStatus]
    );

    // 清除视频和相关数据
    const handleClearVideo = useCallback(async () => {
        if (!currentProject) return;

        logger.info('cleanup', '开始清除视频和字幕', currentProject.fileName);

        // 释放视频 object URL
        if (videoUrl) {
            URL.revokeObjectURL(videoUrl);
        }

        // 清理服务端的 temp 目录
        if (currentProject.tempDir) {
            try {
                await fetch('/api/cleanup-frames', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        tempDir: currentProject.tempDir,
                    }),
                });
                logger.success('cleanup', '临时文件清理完成', currentProject.tempDir);
            } catch (error) {
                logger.error('cleanup', '清理临时文件失败', String(error));
            }
        }

        // 重置状态
        setVideoUrl('');
        setUploadProgress(0);
        setIsUploading(false);
        setVideoCurrentTime(0);
        setSelectedSegment(undefined);
        setEditText('');
        clearCurrentProject();
        logger.success('cleanup', '项目已清除');
    }, [currentProject, videoUrl, clearCurrentProject]);

    // 开始分析
    const handleStartAnalysis = useCallback(async () => {
        if (!videoUrl || !aiConfig.apiKey || !currentProject) return;

        logger.info('analyze', '开始分析视频', `模型: ${aiConfig.model}, 间隔: ${aiConfig.frameInterval}s`);
        updateProjectStatus('processing', 0);

        try {
            // 1. 将视频 URL 转换为 Blob 并上传抽帧
            logger.info('extract', '开始抽帧', `间隔: ${aiConfig.frameInterval}s`);
            const videoResponse = await fetch(videoUrl);
            const videoBlob = await videoResponse.blob();
            const videoFile = new File([videoBlob], currentProject.fileName, { type: videoBlob.type });

            // 2. 调用抽帧 API
            const extractFormData = new FormData();
            extractFormData.append('video', videoFile);
            extractFormData.append('interval', String(aiConfig.frameInterval));

            const extractResponse = await fetch('/api/extract-frames', {
                method: 'POST',
                body: extractFormData,
            });

            const extractData = await extractResponse.json();

            if (!extractData.success) {
                throw new Error(extractData.error || '抽帧失败');
            }

            const { frames, duration, tempDir } = extractData.data;
            logger.success('extract', '抽帧完成', `提取了 ${frames.length} 帧`);

            // 保存 tempDir 路径用于后续清理
            setCurrentProject({
                ...currentProject!,
                tempDir,
            });

            // 更新进度 - 抽帧完成
            updateProjectStatus('processing', 50);

            // 3. 分批调用 AI 分析 API（每批10张）
            logger.info('analyze', '开始 AI 分析', `共 ${frames.length} 帧, 分 ${Math.ceil(frames.length / 10)} 批处理`);
            updateProjectStatus('analyzing', 0);

            const batchSize = 10;
            const allDescriptions: Array<{ timestamp: number; description: string }> = [];
            const totalBatches = Math.ceil(frames.length / batchSize);

            for (let batch = 0; batch < totalBatches; batch++) {
                const startIdx = batch * batchSize;
                const endIdx = Math.min(startIdx + batchSize, frames.length);
                const batchFrames = frames.slice(startIdx, endIdx);

                const analyzeResponse = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        frames: batchFrames,
                        model: aiConfig.model,
                        apiKey: aiConfig.apiKey,
                        language: aiConfig.language,
                        frameInterval: aiConfig.frameInterval,
                        batchSize: 1, // 后端单帧分析
                    }),
                });

                const analyzeData = await analyzeResponse.json();

                if (!analyzeData.success) {
                    throw new Error(analyzeData.error || 'AI 分析失败');
                }

                // 显示 AI 调用日志
                if (analyzeData.data.logs && analyzeData.data.logs.length > 0) {
                    for (const log of analyzeData.data.logs) {
                        const status = log.responseStatus === 200 ? '✅' : '❌';
                        const errorInfo = log.responseError ? ` - ${log.responseError}` : '';
                        logger.info(
                            'analyze',
                            `${status} AI API 调用`,
                            `${log.apiUrl} | 模型: ${log.model} | 帧: ${log.frameCount} | 耗时: ${log.duration}ms${errorInfo}`
                        );
                        // 显示完整请求参数
                        if (log.requestBody) {
                            logger.debug('analyze', `📥 请求参数 (帧${log.frameCount})`, JSON.stringify(log.requestBody, null, 2));
                        }
                        // 显示完整响应内容
                        if (log.responseData) {
                            logger.debug('analyze', `📤 响应内容 (帧${log.frameCount})`, JSON.stringify(log.responseData, null, 2));
                        }
                    }
                }

                // 累加批次结果
                const batchDescriptions = analyzeData.data.descriptions;
                allDescriptions.push(...batchDescriptions);

                // 更新进度
                const progress = Math.round(((batch + 1) / totalBatches) * 100);
                updateProjectStatus('analyzing', progress);

                // 每批次记录日志
                logger.debug('analyze', `批次 ${batch + 1}/${totalBatches} 完成`, `已处理 ${endIdx}/${frames.length} 帧`);
            }

            logger.success('analyze', 'AI 分析完成', `共 ${allDescriptions.length} 个片段`);

            // 4. 将分析结果转换为字幕片段
            logger.info('generate', '生成字幕片段', `原始片段: ${allDescriptions.length}`);
            const subtitles: SubtitleSegment[] = [];

            for (let i = 0; i < allDescriptions.length; i++) {
                const desc = allDescriptions[i];
                const nextDesc = allDescriptions[i + 1];

                if (desc.description && desc.description !== '[分析失败]') {
                    subtitles.push({
                        id: uuidv4(),
                        startTime: desc.timestamp,
                        endTime: nextDesc ? nextDesc.timestamp : duration,
                        text: desc.description,
                        frameIndex: i,
                    });
                }
            }

            // 5. 合并相邻的相似字幕（可选优化）
            logger.info('merge', '合并相似字幕');
            const mergedSubtitles = mergeSimilarSubtitles(subtitles);
            logger.success('merge', '字幕合并完成', `合并后: ${mergedSubtitles.length} 条`);

            updateSubtitles(mergedSubtitles);
            updateProjectStatus('completed', 100);
            logger.success('analyze', '✅ 全部完成!', `生成 ${mergedSubtitles.length} 条字幕`);
        } catch (error) {
            logger.error('analyze', '分析失败', error instanceof Error ? error.message : String(error));
            console.error('Analysis error:', error);
            updateProjectStatus('error', 0, error instanceof Error ? error.message : '分析失败，请重试');
        }
    }, [videoUrl, aiConfig, currentProject, updateProjectStatus, updateSubtitles]);

    // 合并相邻相似字幕的辅助函数
    const mergeSimilarSubtitles = (subtitles: SubtitleSegment[]): SubtitleSegment[] => {
        if (subtitles.length === 0) return [];

        const merged: SubtitleSegment[] = [];
        let current = { ...subtitles[0] };

        for (let i = 1; i < subtitles.length; i++) {
            const next = subtitles[i];

            // 如果当前字幕和下一个字幕时间连续且内容相似，则合并
            if (next.startTime - current.endTime < 0.5 && areSimilarTexts(current.text, next.text)) {
                current.endTime = next.endTime;
                current.text = current.text + ' ' + next.text;
            } else {
                merged.push(current);
                current = { ...next };
            }
        }
        merged.push(current);

        return merged;
    };

    // 判断两个文本是否相似（简单实现：去除标点后比较）
    const areSimilarTexts = (text1: string, text2: string): boolean => {
        const normalize = (t: string) => t.replace(/[，。！？、]/g, '').toLowerCase();
        const n1 = normalize(text1);
        const n2 = normalize(text2);
        // 简单的包含检查
        return n1.includes(n2) || n2.includes(n1) || n1.length < 5 || n2.length < 5;
    };

    // 导出 SRT
    const handleExport = useCallback(async () => {
        if (!currentProject?.subtitles.length) return;

        logger.info('export', '开始导出 SRT 文件', `${currentProject.subtitles.length} 条字幕`);

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
                logger.success('export', 'SRT 文件导出成功', data.data.fileName);
            }
        } catch (error) {
            logger.error('export', '导出失败', String(error));
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
            <div className={styles.userArea}>
                {currentProject && (
                    <button
                        className={styles.clearButton}
                        onClick={handleClearVideo}
                        title="清除视频和字幕"
                    >
                        <Trash2 className={styles.clearButtonIcon} />
                        清除视频
                    </button>
                )}
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
                    <div className={styles.logSection}>
                        <OperationLog />
                    </div>
                </div>
            );
        }
        return <div className={styles.editContainer}>
            <div className={styles.editForm}>
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
            </div>
            <div className={styles.logSection}>
                <OperationLog />
            </div>
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
