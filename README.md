# Video2SRT - AI 视频字幕生成器

基于 AI 多模态大模型的视频字幕生成工具。通过提取视频关键帧，使用 AI 视觉理解能力分析内容，自动生成 SRT 格式字幕文件。

## 功能特性

- 视频拖拽上传，支持多种格式 (MP4, MOV, AVI, MKV, WebM)
- AI 多模型支持：OpenAI GPT-4o、DeepSeek VL、Minimax、GLM-4V
- 可调节抽帧间隔（0.5s / 1s / 2s / 5s）
- 多语言字幕输出
- 双窗格界面：视频预览 + 字幕编辑
- 实时分析进度显示
- 一键导出 SRT 字幕文件

## 技术栈

- **前端**: Next.js 16 (App Router), React, TypeScript
- **样式**: CSS Modules (禁用 Tailwind)
- **状态管理**: Zustand
- **图标**: Lucide React
- **后端**: Next.js API Routes
- **视频处理**: FFmpeg
- **AI 集成**: OpenAI / DeepSeek API

## 项目架构

```
VideoFrameToSRT/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/
│   │   │   ├── extract-frames/  # 视频抽帧 API
│   │   │   │   └── route.ts
│   │   │   ├── analyze/         # AI 视觉分析 API
│   │   │   │   └── route.ts
│   │   │   └── generate-srt/    # SRT 文件生成 API
│   │   │       └── route.ts
│   │   ├── globals.css          # 全局样式 (CSS Variables)
│   │   ├── layout.tsx           # 根布局
│   │   └── page.tsx             # 主页面
│   ├── components/
│   │   ├── VideoUploader/       # 视频上传组件
│   │   │   ├── VideoUploader.tsx
│   │   │   └── VideoUploader.module.css
│   │   ├── ModelConfigForm/     # AI 模型配置表单
│   │   │   ├── ModelConfigForm.tsx
│   │   │   └── ModelConfigForm.module.css
│   │   ├── VideoPlayer/         # 视频播放器
│   │   │   ├── VideoPlayer.tsx
│   │   │   └── VideoPlayer.module.css
│   │   ├── SubtitleEditor/      # 字幕编辑组件
│   │   │   ├── SubtitleEditor.tsx
│   │   │   └── SubtitleEditor.module.css
│   │   └── AnalysisDashboard/   # 分析进度仪表盘
│   │       ├── AnalysisDashboard.tsx
│   │       └── AnalysisDashboard.module.css
│   ├── lib/
│   │   ├── store.ts             # Zustand 状态管理
│   │   └── ai-adapter.ts        # AI 模型适配器 (适配器模式)
│   └── types/
│       └── index.ts             # TypeScript 类型定义
├── DESIGN.md                    # 设计系统文档
├── next.config.ts               # Next.js 配置
├── package.json
└── tsconfig.json
```

### 核心模块说明

| 模块 | 描述 |
|------|------|
| `VideoUploader` | 拖拽/点击上传视频，显示上传进度 |
| `ModelConfigForm` | 配置 AI 模型、API Key、抽帧间隔、字幕语言 |
| `VideoPlayer` | 16:9 视频播放器，支持播放控制和进度条 |
| `SubtitleEditor` | 字幕列表展示和编辑，支持时间轴点击同步 |
| `AnalysisDashboard` | 展示分析进度状态，支持开始分析/导出操作 |

## 环境要求

- Node.js 18+
- FFmpeg (系统命令行工具)
- AI 模型 API Key (OpenAI / DeepSeek 等)

## 安装

```bash
# 克隆项目
cd VideoFrameToSRT

# 安装依赖
npm install
```

## 配置

### 1. 安装 FFmpeg

**macOS (Homebrew):**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt install ffmpeg
```

**Windows:**
下载并安装 [FFmpeg](https://ffmpeg.org/download.html)，添加到系统 PATH。

### 2. 配置 API Key

在应用中通过 UI 配置 AI 模型的 API Key：
- OpenAI: https://platform.openai.com/api-keys
- DeepSeek: https://platform.deepseek.com/

## 使用

```bash
# 启动开发服务器
npm run dev
```

打开浏览器访问 http://localhost:3000

### 使用流程

1. **上传视频**: 拖拽或点击选择视频文件
2. **配置 AI**: 选择模型、输入 API Key、设置抽帧间隔和字幕语言
3. **开始分析**: 点击"开始分析"按钮
4. **编辑字幕**: 在右侧面板编辑自动生成的字幕
5. **导出**: 点击"导出 SRT"下载字幕文件

## 设计系统

详见 [DESIGN.md](./DESIGN.md)，包含：
- 颜色规范 (#0a0a0a, #171717, #38b9fa)
- 字体 (Inter)
- 间距系统
- 组件样式规范

## 注意事项

- API Key 仅保存在客户端浏览器 (LocalStorage)，不会上传到服务器
- 视频处理在服务器端进行，请确保网络连接稳定
- 大视频文件可能需要较长的处理时间
- 当前版本为 MVP，后续将支持更多 AI 模型和高级功能

## License

MIT
