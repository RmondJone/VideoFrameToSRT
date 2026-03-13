import { NextRequest, NextResponse } from 'next/server';
import { createAIAdapter } from '@/lib/ai-adapter';
import type { AIModel, Language } from '@/types';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const requestId = Date.now();
  logger.info('api', `🤖 [${requestId}] 开始 AI 分析请求`);

  try {
    const body = await request.json();
    const { frames, model, apiKey, language, frameInterval } = body as {
      frames: string[];
      model: AIModel;
      apiKey: string;
      language: Language;
      frameInterval: number;
    };

    if (!frames || frames.length === 0) {
      logger.warning('api', `⚠️ [${requestId}] 未提供帧数据`);
      return NextResponse.json(
        { success: false, error: 'No frames provided' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      logger.warning('api', `⚠️ [${requestId}] 缺少 API Key`);
      return NextResponse.json(
        { success: false, error: 'API key is required' },
        { status: 400 }
      );
    }

    logger.info('analyze', `🤖 [${requestId}] 使用模型: ${model}, 语言: ${language}, 帧数: ${frames.length}`);

    const adapter = createAIAdapter(model, apiKey, language);

    // 分析每一帧
    const descriptions: Array<{ timestamp: number; description: string }> = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < frames.length; i++) {
      const timestamp = i * frameInterval;

      try {
        const description = await adapter.analyzeFrame(frames[i]);
        descriptions.push({ timestamp, description });
        successCount++;
      } catch (error) {
        logger.error('analyze', `❌ [${requestId}] 分析第 ${i} 帧失败`, String(error));
        descriptions.push({
          timestamp,
          description: '[分析失败]',
        });
        failCount++;
      }
    }

    logger.success('api', `✅ [${requestId}] AI 分析完成`, `成功: ${successCount}, 失败: ${failCount}`);

    return NextResponse.json({
      success: true,
      data: { descriptions },
    });
  } catch (error) {
    logger.error('api', `❌ [${requestId}] 分析失败`, error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
