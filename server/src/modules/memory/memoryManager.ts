import {
  LearnerMemory,
  TeachingStrategyMemory,
  CourseMemory,
  SessionMemory,
  KnowledgeMemory,
  KnowledgeCategory,
  MessageRole,
} from './types';
import { IMemoryStore, InMemoryStore } from './store';
import { PrismaMemoryStore } from './prismaStore';
import { semanticStore, SaveSemanticMemoryParams, SearchSemanticMemoryParams, SemanticSearchResult } from './semanticStore';

export interface BuildMemoryContextParams {
  userId: string;
  courseId?: string;
  sessionId?: string;
  query?: string;
}

export class MemoryManager {
  private store: IMemoryStore;

  constructor(store?: IMemoryStore) {
    if (store) {
      this.store = store;
    } else if (process.env.DATABASE_URL) {
      this.store = new PrismaMemoryStore();
    } else {
      this.store = new InMemoryStore();
    }
  }

  async getLearnerMemory(userId: string): Promise<LearnerMemory> {
    const existing = await this.store.getLearnerMemory(userId);
    if (existing) return existing;

    const defaultLearner: LearnerMemory = {
      userId,
      knowledgeLevel: 'beginner',
      learningPace: 'moderate',
      confidenceScore: 0.5,
    };
    return this.store.setLearnerMemory(defaultLearner);
  }

  async updateLearnerMemory(userId: string, updates: Partial<LearnerMemory>): Promise<LearnerMemory> {
    const current = await this.getLearnerMemory(userId);
    const updated: LearnerMemory = {
      ...current,
      ...updates,
      userId,
    };
    return this.store.setLearnerMemory(updated);
  }

  async getTeachingStrategy(userId: string): Promise<TeachingStrategyMemory> {
    const existing = await this.store.getTeachingStrategy(userId);
    if (existing) return existing;

    const defaultStrategy: TeachingStrategyMemory = {
      userId,
      learningApproach: 'balanced',
      explanationStyle: 'analogy_driven',
      assessmentFrequency: 'periodic_milestones',
      socraticQuestioningEffectiveness: 0.5,
      preferredFormat: 'mixed',
      observedPedagogicalSignals: [],
    };
    return this.store.setTeachingStrategy(defaultStrategy);
  }

  async updateTeachingStrategy(
    userId: string,
    updates: Partial<TeachingStrategyMemory>
  ): Promise<TeachingStrategyMemory> {
    const current = await this.getTeachingStrategy(userId);
    const updated: TeachingStrategyMemory = {
      ...current,
      ...updates,
      userId,
    };
    return this.store.setTeachingStrategy(updated);
  }

  async getCourseMemory(userId: string, courseId: string): Promise<CourseMemory> {
    const existing = await this.store.getCourseMemory(userId, courseId);
    if (existing) return existing;

    const defaultCourse: CourseMemory = {
      courseId,
      userId,
      currentModuleId: '',
      completedLessonIds: [],
      masteredConcepts: [],
      courseWeaknesses: [],
    };
    return this.store.setCourseMemory(defaultCourse);
  }

  async updateCourseMemory(
    userId: string,
    courseId: string,
    updates: Partial<CourseMemory>
  ): Promise<CourseMemory> {
    const current = await this.getCourseMemory(userId, courseId);
    const updated: CourseMemory = {
      ...current,
      ...updates,
      userId,
      courseId,
    };
    return this.store.setCourseMemory(updated);
  }

  async getSessionMemory(sessionId: string, userId: string = 'anonymous'): Promise<SessionMemory> {
    const existing = await this.store.getSessionMemory(sessionId);
    if (existing) return existing;

    const defaultSession: SessionMemory = {
      sessionId,
      userId,
      workingMessages: [],
      temporaryObservations: [],
    };
    return this.store.setSessionMemory(defaultSession);
  }

  async addMessageToSession(sessionId: string, message: MessageRole, userId: string = 'anonymous'): Promise<SessionMemory> {
    const current = await this.getSessionMemory(sessionId, userId);
    const updated: SessionMemory = {
      ...current,
      workingMessages: [...current.workingMessages, message],
    };
    return this.store.setSessionMemory(updated);
  }

  async getKnowledgeMemories(category?: KnowledgeCategory): Promise<KnowledgeMemory[]> {
    return this.store.getKnowledgeMemories(category);
  }

  async saveKnowledgeMemory(memory: KnowledgeMemory): Promise<KnowledgeMemory> {
    return this.store.setKnowledgeMemory(memory);
  }

  async saveSemanticMemory(params: SaveSemanticMemoryParams): Promise<SemanticSearchResult> {
    return semanticStore.saveSemanticMemory(params);
  }

  async searchSemanticMemory(params: SearchSemanticMemoryParams): Promise<SemanticSearchResult[]> {
    return semanticStore.searchSemanticMemory(params);
  }

  async buildMemoryContext(params: BuildMemoryContextParams): Promise<string> {
    const learner = await this.getLearnerMemory(params.userId);
    const strategy = await this.getTeachingStrategy(params.userId);

    const sections: string[] = [];

    // Learner Profile Context
    sections.push(
      `<learner_profile>\n` +
        `- Knowledge Level: ${learner.knowledgeLevel}\n` +
        `- Learning Pace: ${learner.learningPace}\n` +
        `- Confidence Score: ${learner.confidenceScore}\n` +
        `</learner_profile>`
    );

    // Teaching Strategy Context
    sections.push(
      `<teaching_strategy>\n` +
        `- Learning Approach: ${strategy.learningApproach}\n` +
        `- Preferred Explanation Style: ${strategy.explanationStyle}\n` +
        `- Preferred Content Format: ${strategy.preferredFormat}\n` +
        `- Assessment Frequency: ${strategy.assessmentFrequency}\n` +
        `- Observed Signals: ${strategy.observedPedagogicalSignals.length > 0 ? strategy.observedPedagogicalSignals.join('; ') : 'Observing interaction patterns'}\n` +
        `</teaching_strategy>`
    );

    // Course Context (if provided)
    if (params.courseId) {
      const course = await this.getCourseMemory(params.userId, params.courseId);

      sections.push(
        `<course_context>\n` +
          `- Course ID: ${course.courseId}\n` +
          `- Course Goal: ${course.courseGoal || 'General mastery'}\n` +
          `- Mastered Concepts: ${course.masteredConcepts.length > 0 ? course.masteredConcepts.join(', ') : 'Starting course'}\n` +
          `- Areas Needing Review: ${course.courseWeaknesses.length > 0 ? course.courseWeaknesses.join(', ') : 'None'}\n` +
          `</course_context>`
      );
    }

    // Semantic Vector Context (if query is provided)
    if (params.query) {
      const pastMemories = await this.searchSemanticMemory({
        userId: params.userId,
        courseId: params.courseId,
        query: params.query,
        limit: 3,
      });

      if (pastMemories.length > 0) {
        const formattedMemories = pastMemories
          .map((m) => `- [${m.category}] ${m.concept}: ${m.content} (similarity: ${m.similarity.toFixed(2)})`)
          .join('\n');

        sections.push(`<semantic_past_explanations>\n${formattedMemories}\n</semantic_past_explanations>`);
      }
    }

    return sections.join('\n\n');
  }
}

export const memoryManager = new MemoryManager();

