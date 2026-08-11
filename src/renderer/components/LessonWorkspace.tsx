import React, { useEffect, useState } from 'react';
import { BookOpen, Sparkles, AlertCircle, RefreshCw, Play } from 'lucide-react';
import { DetailedLessonContent, fetchLessonContent } from '../services/courseService';
import { FormattedResponse } from './FormattedResponse';
import { getModelById } from '../models';

interface LessonWorkspaceProps {
  lessonId: string;
  selectedModel: string;
  initialHasContent?: boolean;
  lessonTitle?: string;
  cachedMarkdown?: string;
  onLessonContentLoaded?: (contentMarkdown: string) => void;
  onLessonGenerated?: (lessonId: string, contentMarkdown: string) => void;
}

export const LessonWorkspace: React.FC<LessonWorkspaceProps> = React.memo(({
  lessonId,
  selectedModel,
  initialHasContent,
  lessonTitle,
  cachedMarkdown,
  onLessonContentLoaded,
  onLessonGenerated,
}) => {
  const [lessonData, setLessonData] = useState<DetailedLessonContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedMarkdown && initialHasContent !== false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadLessonMeta = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const modelObj = getModelById(selectedModel);
      const data = await fetchLessonContent(lessonId, selectedModel, modelObj?.providerSlug, false);
      setLessonData(data);
      if (data.contentMarkdown) {
        onLessonContentLoaded?.(data.contentMarkdown);
      } else {
        onLessonContentLoaded?.('');
      }
      setIsLoading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load lesson metadata';
      setErrorMsg(msg);
      setIsLoading(false);
    }
  };

  const handleStartLessonGeneration = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const modelObj = getModelById(selectedModel);
      const data = await fetchLessonContent(lessonId, selectedModel, modelObj?.providerSlug, true);
      setLessonData(data);
      onLessonContentLoaded?.(data.contentMarkdown || '');
      onLessonGenerated?.(lessonId, data.contentMarkdown || '');
      setIsGenerating(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate lesson content';
      setErrorMsg(msg);
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!lessonId) return;

    setErrorMsg(null);

    if (cachedMarkdown !== undefined) {
      setLessonData({
        id: lessonId,
        title: lessonTitle || 'Lesson',
        moduleId: '',
        moduleTitle: '',
        courseId: '',
        courseTitle: '',
        contentMarkdown: cachedMarkdown,
        isCompleted: false,
      });
      setIsLoading(false);
      onLessonContentLoaded?.(cachedMarkdown);
      return;
    }

    if (initialHasContent === false) {
      setLessonData({
        id: lessonId,
        title: lessonTitle || 'Lesson',
        moduleId: '',
        moduleTitle: '',
        courseId: '',
        courseTitle: '',
        contentMarkdown: '',
        isCompleted: false,
      });
      setIsLoading(false);
      onLessonContentLoaded?.('');
      return;
    }

    loadLessonMeta();
  }, [lessonId, initialHasContent, cachedMarkdown, selectedModel]);

  const hasContent = Boolean(lessonData?.contentMarkdown && lessonData.contentMarkdown.trim().length > 0);

  return (
    <div className="messages-container">
      {isLoading ? (
        <div className="lesson-loading-state">
          <h3 className="loading-title">Loading lesson...</h3>
        </div>
      ) : isGenerating ? (
        <div className="lesson-loading-state">
          <h3 className="loading-title">Gohard AI is writing your lesson...</h3>
          <p className="loading-subtitle">Generating interactive guide, code snippets, and architectural concepts</p>
        </div>
      ) : errorMsg || !lessonData ? (
        <div className="lesson-error-state">
          <AlertCircle size={36} className="error-icon" />
          <h3 className="error-title">Unable to load lesson</h3>
          <p className="error-desc">{errorMsg || 'An unknown error occurred'}</p>
          <button className="retry-btn" onClick={loadLessonMeta}>
            <RefreshCw size={16} />
            <span>Retry Loading</span>
          </button>
        </div>
      ) : !hasContent ? (
        <div className="start-lesson-container">
          <div className="start-lesson-card">
            <div className="start-lesson-icon-box">
              <BookOpen size={28} className="start-icon" />
            </div>
            <h2 className="start-card-title">{lessonData.title}</h2>
            <p className="start-card-desc">
              Ready to master this concept? Click the button below to have Gohard AI generate your interactive guide, code labs, and visual architecture diagrams.
            </p>
            <button className="start-lesson-action-btn" onClick={handleStartLessonGeneration}>
              <Play size={16} fill="currentColor" />
              <span>Start Lesson</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="lesson-title">{lessonData.title}</h1>
          <div className="lesson-markdown-body">
            <FormattedResponse content={lessonData.contentMarkdown} />
          </div>
        </>
      )}
    </div>
  );
});

export default LessonWorkspace;
