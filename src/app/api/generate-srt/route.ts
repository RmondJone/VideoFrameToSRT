import { NextRequest, NextResponse } from 'next/server';
import type { SubtitleSegment } from '@/types';

// 格式化时间为 SRT 格式 (HH:MM:SS,mmm)
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

// 合并相邻的短字幕片段
function mergeSubtitles(subtitles: SubtitleSegment[]): SubtitleSegment[] {
  if (subtitles.length === 0) return [];

  const merged: SubtitleSegment[] = [];
  let current = { ...subtitles[0] };

  for (let i = 1; i < subtitles.length; i++) {
    const next = subtitles[i];

    // 如果当前片段和下一个片段间隔小于 0.5 秒，且内容相似，则合并
    if (next.startTime - current.endTime < 0.5 && current.text === next.text) {
      current.endTime = next.endTime;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }

  merged.push(current);
  return merged;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subtitles, language } = body as {
      subtitles: SubtitleSegment[];
      language: string;
    };

    if (!subtitles || subtitles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No subtitles provided' },
        { status: 400 }
      );
    }

    // 合并相邻片段
    const mergedSubtitles = mergeSubtitles(subtitles);

    // 生成 SRT 内容
    let srtContent = '';

    mergedSubtitles.forEach((segment, index) => {
      // 序号
      srtContent += `${index + 1}\n`;

      // 时间范围
      srtContent += `${formatSRTTime(segment.startTime)} --> ${formatSRTTime(segment.endTime)}\n`;

      // 文本内容
      srtContent += `${segment.text}\n`;

      // 空行
      srtContent += '\n';
    });

    // 返回 SRT 文件内容
    return NextResponse.json({
      success: true,
      data: {
        srtContent,
        fileName: `subtitles_${Date.now()}.srt`,
        segmentCount: mergedSubtitles.length,
      },
    });
  } catch (error) {
    console.error('Error generating SRT:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate SRT' },
      { status: 500 }
    );
  }
}
