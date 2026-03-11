'use client';

import React, {forwardRef, useImperativeHandle, useState} from 'react';
import {FileText} from 'lucide-react';
import {useAppStore} from '@/lib/store';
import type {SubtitleSegment} from '@/types';
import styles from './SubtitleEditor.module.css';

interface SubtitleEditorProps {
    onSubtitleClick?: (subtitle: SubtitleSegment) => void;
}


/**
 *  字幕编辑器
 * @param onTimeClick
 * @returns {Element}
 * @constructor
 * @param ref
 */
function SubtitleEditor({onSubtitleClick}: SubtitleEditorProps, ref: React.Ref<SubtitleEditorRef>) {
    const {currentProject, updateSubtitles} = useAppStore();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const subtitles = currentProject?.subtitles || [];

    const handleSegmentClick = (segment: SubtitleSegment) => {
        setSelectedId(segment.id);
        onSubtitleClick?.(segment);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    const handleSubtitleChange = (changeText: string) => {
        if (selectedId && changeText) {
            const updated = subtitles.map((s) =>
                s.id === selectedId ? {...s, text: changeText} : s
            );
            updateSubtitles(updated);
        }
    };

    useImperativeHandle(ref, () => ({handleSubtitleChange}))

    if (subtitles.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.empty}>
                    <FileText className={styles.emptyIcon}/>
                    <p>暂无字幕数据</p>
                    <p style={{fontSize: '12px', marginTop: '8px'}}>
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
        </div>
    );
}

export interface SubtitleEditorRef {
    handleSubtitleChange: (changeText: string) => void
}

export default forwardRef<SubtitleEditorRef, SubtitleEditorProps>(SubtitleEditor)
