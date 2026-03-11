import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tempDir } = body;

    if (!tempDir) {
      return NextResponse.json(
        { success: false, error: 'No tempDir provided' },
        { status: 400 }
      );
    }

    // 安全检查：确保路径在项目的 temp 目录内
    const projectRoot = process.cwd();
    const normalizedTempDir = path.normalize(tempDir);
    const allowedTempRoot = path.join(projectRoot, 'temp');

    if (!normalizedTempDir.startsWith(allowedTempRoot)) {
      return NextResponse.json(
        { success: false, error: 'Invalid temp directory path' },
        { status: 400 }
      );
    }

    // 检查目录是否存在
    if (!fs.existsSync(normalizedTempDir)) {
      return NextResponse.json({
        success: true,
        message: 'Temp directory does not exist, nothing to clean',
      });
    }

    // 递归删除目录
    fs.rmSync(normalizedTempDir, { recursive: true, force: true });

    return NextResponse.json({
      success: true,
      message: 'Temp directory cleaned successfully',
    });
  } catch (error) {
    console.error('Error cleaning up temp directory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup temp directory' },
      { status: 500 }
    );
  }
}
