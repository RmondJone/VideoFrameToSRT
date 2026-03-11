import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VideoProject, AIConfig, SubtitleSegment, ProjectStatus, AIModel, Language } from '@/types';

interface AppState {
  // 当前项目
  currentProject: VideoProject | null;
  projects: VideoProject[];

  // AI 配置
  aiConfig: AIConfig;

  // Actions
  setCurrentProject: (project: VideoProject | null) => void;
  updateProjectStatus: (status: ProjectStatus, progress?: number, error?: string) => void;
  updateSubtitles: (subtitles: SubtitleSegment[]) => void;
  addProject: (project: VideoProject) => void;
  removeProject: (projectId: string) => void;
  clearCurrentProject: () => void;

  // AI 配置 Actions
  setAiModel: (model: AIModel) => void;
  setApiKey: (apiKey: string) => void;
  setLanguage: (language: Language) => void;
  setFrameInterval: (interval: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // 初始状态
      currentProject: null,
      projects: [],

      aiConfig: {
        model: 'openai',
        apiKey: '',
        language: 'zh',
        frameInterval: 10,
      },

      // Actions
      setCurrentProject: (project) => set({ currentProject: project }),

      updateProjectStatus: (status, progress, error) => set((state) => {
        if (!state.currentProject) return state;
        return {
          currentProject: {
            ...state.currentProject,
            status,
            progress: progress ?? state.currentProject.progress,
            errorMessage: error,
          },
        };
      }),

      updateSubtitles: (subtitles) => set((state) => {
        if (!state.currentProject) return state;
        return {
          currentProject: {
            ...state.currentProject,
            subtitles,
          },
        };
      }),

      addProject: (project) => set((state) => ({
        projects: [project, ...state.projects],
        currentProject: project,
      })),

      removeProject: (projectId) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
      })),

      clearCurrentProject: () => set({ currentProject: null }),

      // AI 配置 Actions
      setAiModel: (model) => set((state) => ({
        aiConfig: { ...state.aiConfig, model },
      })),

      setApiKey: (apiKey) => set((state) => ({
        aiConfig: { ...state.aiConfig, apiKey },
      })),

      setLanguage: (language) => set((state) => ({
        aiConfig: { ...state.aiConfig, language },
      })),

      setFrameInterval: (frameInterval) => set((state) => ({
        aiConfig: { ...state.aiConfig, frameInterval },
      })),
    }),
    {
      name: 'video-to-srt-storage',
      partialize: (state) => ({
        aiConfig: state.aiConfig,
        projects: state.projects,
      }),
    }
  )
);
