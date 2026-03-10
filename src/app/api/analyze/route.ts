import { NextRequest, NextResponse } from 'next/server';
import { createAIAdapter } from '@/lib/ai-adapter';
import type { AIModel, Language } from '@/types';

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { success: false, error: 'No frames provided' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key is required' },
        { status: 400 }
      );
    }

    const adapter = createAIAdapter(model, apiKey, language);

    // 分析每一帧
    const descriptions: Array<{ timestamp: number; description: string }> = [];

    for (let i = 0; i < frames.length; i++) {
      const timestamp = i * frameInterval;

      try {
        const description = await adapter.analyzeFrame(frames[i]);
        descriptions.push({ timestamp, description });
      } catch (error) {
        console.error(`Error analyzing frame ${i}:`, error);
        descriptions.push({
          timestamp,
          description: '[分析失败]',
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { descriptions },
    });
  } catch (error) {
    console.error('Error in analyze API:', error);
    return NextResponse.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
