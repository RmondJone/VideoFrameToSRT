import { NextRequest, NextResponse } from 'next/server';
import type { SubtitleSegment } from '@/types';
import { logger } from '@/lib/logger';

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
  const requestId = Date.now();
  logger.info('api', `💾 [${requestId}] 开始生成 SRT 文件`);

  try {
    const body = await request.json();
    const { subtitles, language } = body as {
      subtitles: SubtitleSegment[];
      language: string;
    };

    if (!subtitles || subtitles.length === 0) {
      logger.warning('api', `⚠️ [${requestId}] 未提供字幕数据`);
      return NextResponse.json(
        { success: false, error: 'No subtitles provided' },
        { status: 400 }
      );
    }

    logger.info('generate', `🔗 [${requestId}] 合并相邻字幕`, `原始: ${subtitles.length} 条`);

    // 合并相邻片段
    const mergedSubtitles = mergeSubtitles(subtitles);

    logger.debug('generate', `🔗 [${requestId}] 合并完成`, `合并后: ${mergedSubtitles.length} 条`);

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

    logger.success('api', `✅ [${requestId}] SRT 生成完成`, `${mergedSubtitles.length} 条字幕`);

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
    logger.error('api', `❌ [${requestId}] 生成 SRT 失败`, error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: 'Failed to generate SRT' },
      { status: 500 }
    );
  }
}
