export interface LearnerMemory {
  userId: string;
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  learningPace: 'thorough_and_detailed' | 'moderate' | 'fast_paced';
  confidenceScore: number; // 0.0 to 1.0
}

export interface TeachingStrategyMemory {
  userId: string;
  learningApproach: 'hands_on_lab_first' | 'architecture_first' | 'theory_first' | 'balanced';
  explanationStyle: 'analogy_driven' | 'first_principles' | 'visual_diagrams' | 'step_by_step' | 'practical_case_study';
  assessmentFrequency: 'frequent_micro_quizzes' | 'periodic_milestones' | 'project_based';
  socraticQuestioningEffectiveness: number; // 0.0 to 1.0
  preferredFormat: 'code_samples' | 'architecture_diagrams' | 'cli_walkthroughs' | 'mixed';
  observedPedagogicalSignals: string[];
}

export interface CourseMemory {
  courseId: string;
  userId: string;
  currentModuleId: string;
  currentLessonId?: string;
  completedLessonIds: string[];
  courseGoal?: string;
  masteredConcepts: string[];
  courseWeaknesses: string[];
}

export interface MessageRole {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export interface SessionMemory {
  sessionId: string;
  userId: string;
  activeCourseId?: string;
  activeLessonId?: string;
  workingMessages: MessageRole[];
  temporaryObservations: string[];
}

export type KnowledgeCategory = 'rubric' | 'pedagogical_pattern' | 'prompt_template' | 'exercise_schema';

export interface KnowledgeMemory {
  templateId: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
}
