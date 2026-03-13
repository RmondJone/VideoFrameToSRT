import { NextRequest, NextResponse } from 'next/server';
import { createAIAdapter, type AIAdapter } from '@/lib/ai-adapter';
import type { AIModel, Language } from '@/types';
import { logger } from '@/lib/logger';

// 日志记录类型
interface CallLog {
  apiUrl: string;
  model: string;
  language: string;
  frameCount: number;
  requestTimestamp: number;
  responseStatus: number;
  responseError?: string;
  duration: number;
  requestBody?: object;
  responseData?: object;
}

export async function POST(request: NextRequest) {
  const requestId = Date.now();
  logger.info('api', `🤖 [${requestId}] 开始 AI 分析请求`);

  const callLogs: CallLog[] = [];

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

    const adapter: AIAdapter = createAIAdapter(model, apiKey, language);

    // 分析每一帧
    const descriptions: Array<{ timestamp: number; description: string }> = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < frames.length; i++) {
      const timestamp = i * frameInterval;
      const requestTimestamp = Date.now();

      // 记录调用信息（不含 base64 图片数据）
      const apiUrl = model === 'openai'
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://api.deepseek.com/v1/chat/completions';

      logger.info('analyze', `📤 [${requestId}] 调用 AI API`, `第 ${i + 1}/${frames.length} 帧`);
      logger.debug('analyze', `🔧 [${requestId}] 请求参数`, `模型: ${model}, 语言: ${language}`);

      try {
        const startTime = Date.now();
        const result = await adapter.analyzeFrame(frames[i]);
        const duration = Date.now() - startTime;

        // 记录完整日志
        callLogs.push({
          apiUrl,
          model,
          language,
          frameCount: i + 1,
          requestTimestamp,
          responseStatus: 200,
          duration,
          requestBody: result.requestBody,
          responseData: result.responseData,
        });

        logger.success('analyze', `✅ [${requestId}] AI 响应`, `耗时: ${duration}ms`);
        logger.debug('analyze', `📥 [${requestId}] 请求参数`, JSON.stringify(result.requestBody, null, 2));
        logger.debug('analyze', `📤 [${requestId}] 响应内容`, JSON.stringify(result.responseData, null, 2));

        descriptions.push({ timestamp, description: result.description });
        successCount++;
      } catch (error) {
        const duration = Date.now() - requestTimestamp;
        const errorMsg = error instanceof Error ? error.message : String(error);

        // 记录错误日志
        callLogs.push({
          apiUrl,
          model,
          language,
          frameCount: i + 1,
          requestTimestamp,
          responseStatus: 500,
          responseError: errorMsg,
          duration,
        });

        logger.error('analyze', `❌ [${requestId}] 分析第 ${i} 帧失败`, errorMsg);
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
      data: {
        descriptions,
        logs: callLogs,
      },
    });
  } catch (error) {
    logger.error('api', `❌ [${requestId}] 分析失败`, error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
