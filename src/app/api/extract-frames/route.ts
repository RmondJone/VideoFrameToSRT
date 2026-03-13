import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '@/lib/logger';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  const requestId = Date.now();
  logger.info('api', `📥 [${requestId}] 开始抽帧请求`);

  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const interval = parseFloat(formData.get('interval') as string) || 1;

    if (!videoFile) {
      logger.warning('api', `⚠️ [${requestId}] 未提供视频文件`);
      return NextResponse.json(
        { success: false, error: 'No video file provided' },
        { status: 400 }
      );
    }

    logger.info('extract', `🎬 [${requestId}] 创建临时目录`);
    // 创建临时目录
    const tempDir = path.join(process.cwd(), 'temp', uuidv4());
    const framesDir = path.join(tempDir, 'frames');
    fs.mkdirSync(framesDir, { recursive: true });

    // 保存上传的视频
    const videoPath = path.join(tempDir, 'input.mp4');
    const buffer = Buffer.from(await videoFile.arrayBuffer());
    fs.writeFileSync(videoPath, buffer);
    logger.info('extract', `💾 [${requestId}] 视频保存至: ${videoPath}`);

    // 获取视频时长
    let duration = 0;
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of csv=p=0 "${videoPath}"`
      );
      duration = parseFloat(stdout.trim()) || 0;
      logger.debug('extract', `⏱️ [${requestId}] 视频时长: ${duration}s`);
    } catch (e) {
      logger.error('extract', `❌ [${requestId}] 获取视频时长失败`, String(e));
    }

    // 提取帧
    const outputPattern = path.join(framesDir, 'frame_%04d.png');
    logger.info('extract', `🎬 [${requestId}] 开始提取帧, 间隔: ${interval}s`);

    try {
      await execAsync(
        `ffmpeg -i "${videoPath}" -vf "fps=1/${interval}" "${outputPattern}" -y`
      );
      logger.success('extract', `✅ [${requestId}] FFmpeg 抽帧完成`);
    } catch (e) {
      logger.error('extract', `❌ [${requestId}] FFmpeg 执行失败`, String(e));
    }

    // 读取提取的帧
    const frames: string[] = [];
    const files = fs.readdirSync(framesDir).sort();

    for (const file of files) {
      const filePath = path.join(framesDir, file);
      const fileBuffer = fs.readFileSync(filePath);
      frames.push(fileBuffer.toString('base64'));
    }

    logger.success('api', `✅ [${requestId}] 抽帧完成`, `${frames.length} 帧, ${duration}s`);

    return NextResponse.json({
      success: true,
      data: {
        duration,
        frameCount: frames.length,
        frames,
        tempDir, // 返回临时目录路径用于后续清理
      },
    });
  } catch (error) {
    logger.error('api', `❌ [${requestId}] 抽帧失败`, error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: 'Failed to extract frames' },
      { status: 500 }
    );
  }
}
