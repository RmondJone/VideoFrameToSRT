// AI 模型类型
export type AIModel = 'openai' | 'deepseek' | 'minimax' | 'glm';

// 支持的语言
export type Language = 'zh' | 'en' | 'ja' | 'ko' | 'es' | 'fr' | 'de';

// 字幕片段
export interface SubtitleSegment {
  id: string;
  startTime: number; // 秒
  endTime: number;   // 秒
  text: string;
  frameIndex?: number;
}

// 项目状态
export type ProjectStatus = 'idle' | 'uploading' | 'processing' | 'analyzing' | 'completed' | 'error';

// 项目信息
export interface VideoProject {
  id: string;
  fileName: string;
  fileSize: number;
  duration: number; // 秒
  status: ProjectStatus;
  progress: number; // 0-100
  subtitles: SubtitleSegment[];
  createdAt: Date;
  errorMessage?: string;
  tempDir?: string; // 抽帧生成的临时目录路径
}

// AI 配置
export interface AIConfig {
  model: AIModel;
  apiKey: string;
  language: Language;
  frameInterval: number; // 抽帧间隔（秒）
}

// 抽帧结果
export interface FrameExtractionResult {
  frames: string[]; // base64 编码的图片数组
  frameCount: number;
  interval: number;
}

// AI 分析请求
export interface AnalyzeRequest {
  frames: string[];
  config: AIConfig;
  timestamp: number; // 帧对应的时间戳
}

// AI 分析响应
export interface AnalyzeResponse {
  descriptions: Array<{
    timestamp: number;
    description: string;
  }>;
}

// SRT 生成请求
export interface GenerateSRTRequest {
  subtitles: SubtitleSegment[];
  language: Language;
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
