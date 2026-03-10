'use client';

import { useAppStore } from '@/lib/store';
import type { AIModel, Language } from '@/types';
import styles from './ModelConfigForm.module.css';

const MODEL_OPTIONS: { value: AIModel; label: string }[] = [
  { value: 'openai', label: 'OpenAI GPT-4o' },
  { value: 'deepseek', label: 'DeepSeek VL' },
  { value: 'minimax', label: 'Minimax Video' },
  { value: 'glm', label: 'GLM-4V' },
];

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

const FRAME_INTERVALS = [
  { value: 0.5, label: '每 0.5 秒' },
  { value: 1, label: '每 1 秒' },
  { value: 2, label: '每 2 秒' },
  { value: 5, label: '每 5 秒' },
];

export default function ModelConfigForm() {
  const { aiConfig, setAiModel, setApiKey, setLanguage, setFrameInterval } = useAppStore();

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>AI 模型配置</h3>

      <div className={styles.field}>
        <label className={styles.label}>AI 模型</label>
        <select
          className={styles.select}
          value={aiConfig.model}
          onChange={(e) => setAiModel(e.target.value as AIModel)}
        >
          {MODEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>API Key</label>
        <input
          type="password"
          className={`${styles.input} ${styles.inputPassword}`}
          placeholder="输入 API Key"
          value={aiConfig.apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <span className={styles.hint}>API Key 仅保存在本地，不会上传到服务器</span>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>字幕语言</label>
          <select
            className={styles.select}
            value={aiConfig.language}
            onChange={(e) => setLanguage(e.target.value as Language)}
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>抽帧间隔</label>
          <select
            className={styles.select}
            value={aiConfig.frameInterval}
            onChange={(e) => setFrameInterval(Number(e.target.value))}
          >
            {FRAME_INTERVALS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
