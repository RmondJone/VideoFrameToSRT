import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const interval = parseFloat(formData.get('interval') as string) || 1;

    if (!videoFile) {
      return NextResponse.json(
        { success: false, error: 'No video file provided' },
        { status: 400 }
      );
    }

    // 创建临时目录
    const tempDir = path.join(process.cwd(), 'temp', uuidv4());
    const framesDir = path.join(tempDir, 'frames');
    fs.mkdirSync(framesDir, { recursive: true });

    // 保存上传的视频
    const videoPath = path.join(tempDir, 'input.mp4');
    const buffer = Buffer.from(await videoFile.arrayBuffer());
    fs.writeFileSync(videoPath, buffer);

    // 获取视频时长
    let duration = 0;
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of csv=p=0 "${videoPath}"`
      );
      duration = parseFloat(stdout.trim()) || 0;
    } catch (e) {
      console.error('Error getting duration:', e);
    }

    // 提取帧
    const outputPattern = path.join(framesDir, 'frame_%04d.png');

    try {
      await execAsync(
        `ffmpeg -i "${videoPath}" -vf "fps=1/${interval}" "${outputPattern}" -y`
      );
    } catch (e) {
      console.error('Error extracting frames:', e);
    }

    // 读取提取的帧
    const frames: string[] = [];
    const files = fs.readdirSync(framesDir).sort();

    for (const file of files) {
      const filePath = path.join(framesDir, file);
      const fileBuffer = fs.readFileSync(filePath);
      frames.push(fileBuffer.toString('base64'));
    }

    return NextResponse.json({
      success: true,
      data: {
        duration,
        frameCount: frames.length,
        frames,
      },
    });
  } catch (error) {
    console.error('Error extracting frames:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to extract frames' },
      { status: 500 }
    );
  }
}
