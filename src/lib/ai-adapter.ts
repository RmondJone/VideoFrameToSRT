import type { AIModel, Language } from '@/types';
import { logger } from './logger';

// AI 适配器接口
export interface AIAdapter {
  analyzeFrame(imageBase64: string): Promise<{
    description: string;
    requestBody: object;
    responseData: object;
  }>;
}

// OpenAI GPT-4o 适配器
class OpenAIAdapter implements AIAdapter {
  private apiKey: string;
  private language: Language;

  constructor(apiKey: string, language: Language) {
    this.apiKey = apiKey;
    this.language = language;
  }

  async analyzeFrame(imageBase64: string): Promise<{
    description: string;
    requestBody: object;
    responseData: object;
  }> {
    const languagePrompt = this.getLanguagePrompt();

    const requestBody = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `分析这张图片中的内容，用${languagePrompt}描述画面中的人物对话或旁白内容。只返回描述性文本，不要返回时间戳。`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${imageBase64.substring(0, 50)}...[base64数据]`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    };

    // 完整请求体（带真实 base64 数据）
    const fullRequestBody = {
      ...requestBody,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: requestBody.messages[0].content[0].text,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
    };

    logger.debug('ai-adapter', '📥 OpenAI 请求参数', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(fullRequestBody),
    });

    const data = await response.json();
    logger.debug('ai-adapter', '📤 OpenAI 响应', JSON.stringify(data, null, 2));

    return {
      description: data.choices?.[0]?.message?.content || '',
      requestBody: fullRequestBody,
      responseData: data,
    };
  }

  private getLanguagePrompt(): string {
    const prompts: Record<Language, string> = {
      zh: '中文',
      en: 'English',
      ja: '日本語',
      ko: '한국어',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
    };
    return prompts[this.language];
  }
}

// DeepSeek VL 适配器
class DeepSeekAdapter implements AIAdapter {
  private apiKey: string;
  private language: Language;

  constructor(apiKey: string, language: Language) {
    this.apiKey = apiKey;
    this.language = language;
  }

  async analyzeFrame(imageBase64: string): Promise<{
    description: string;
    requestBody: object;
    responseData: object;
  }> {
    const languagePrompt = this.getLanguagePrompt();

    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `分析这张图片中的内容，用${languagePrompt}描述画面中的人物对话或旁白内容。只返回描述性文本。`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${imageBase64.substring(0, 50)}...[base64数据]`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    };

    // 完整请求体（带真实 base64 数据）
    const fullRequestBody = {
      ...requestBody,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: requestBody.messages[0].content[0].text,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
    };

    logger.debug('ai-adapter', '📥 DeepSeek 请求参数', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(fullRequestBody),
    });

    const data = await response.json();
    logger.debug('ai-adapter', '📤 DeepSeek 响应', JSON.stringify(data, null, 2));

    return {
      description: data.choices?.[0]?.message?.content || '',
      requestBody: fullRequestBody,
      responseData: data,
    };
  }

  private getLanguagePrompt(): string {
    const prompts: Record<Language, string> = {
      zh: '中文',
      en: 'English',
      ja: '日本語',
      ko: '한국어',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
    };
    return prompts[this.language];
  }
}

// AI 适配器工厂
export function createAIAdapter(model: AIModel, apiKey: string, language: Language): AIAdapter {
  switch (model) {
    case 'openai':
      return new OpenAIAdapter(apiKey, language);
    case 'deepseek':
      return new DeepSeekAdapter(apiKey, language);
    // 其他模型可以后续添加
    default:
      return new OpenAIAdapter(apiKey, language);
  }
}
