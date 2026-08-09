import {
  LearnerMemory,
  TeachingStrategyMemory,
  CourseMemory,
  SessionMemory,
  KnowledgeMemory,
  KnowledgeCategory,
  MessageRole,
} from './types';

export interface IMemoryStore {
  getLearnerMemory(userId: string): Promise<LearnerMemory | null>;
  setLearnerMemory(memory: LearnerMemory): Promise<LearnerMemory>;

  getTeachingStrategy(userId: string): Promise<TeachingStrategyMemory | null>;
  setTeachingStrategy(strategy: TeachingStrategyMemory): Promise<TeachingStrategyMemory>;

  getCourseMemory(userId: string, courseId: string): Promise<CourseMemory | null>;
  setCourseMemory(memory: CourseMemory): Promise<CourseMemory>;

  getSessionMemory(sessionId: string): Promise<SessionMemory | null>;
  setSessionMemory(memory: SessionMemory): Promise<SessionMemory>;

  getKnowledgeMemories(category?: KnowledgeCategory): Promise<KnowledgeMemory[]>;
  setKnowledgeMemory(memory: KnowledgeMemory): Promise<KnowledgeMemory>;
}

export class InMemoryStore implements IMemoryStore {
  private learnerStore = new Map<string, LearnerMemory>();
  private strategyStore = new Map<string, TeachingStrategyMemory>();
  private courseStore = new Map<string, CourseMemory>();
  private sessionStore = new Map<string, SessionMemory>();
  private knowledgeStore = new Map<string, KnowledgeMemory>();

  async getLearnerMemory(userId: string): Promise<LearnerMemory | null> {
    return this.learnerStore.get(userId) || null;
  }

  async setLearnerMemory(memory: LearnerMemory): Promise<LearnerMemory> {
    this.learnerStore.set(memory.userId, memory);
    return memory;
  }

  async getTeachingStrategy(userId: string): Promise<TeachingStrategyMemory | null> {
    return this.strategyStore.get(userId) || null;
  }

  async setTeachingStrategy(strategy: TeachingStrategyMemory): Promise<TeachingStrategyMemory> {
    this.strategyStore.set(strategy.userId, strategy);
    return strategy;
  }

  async getCourseMemory(userId: string, courseId: string): Promise<CourseMemory | null> {
    const key = `${userId}:${courseId}`;
    return this.courseStore.get(key) || null;
  }

  async setCourseMemory(memory: CourseMemory): Promise<CourseMemory> {
    const key = `${memory.userId}:${memory.courseId}`;
    this.courseStore.set(key, memory);
    return memory;
  }

  async getSessionMemory(sessionId: string): Promise<SessionMemory | null> {
    return this.sessionStore.get(sessionId) || null;
  }

  async setSessionMemory(memory: SessionMemory): Promise<SessionMemory> {
    this.sessionStore.set(memory.sessionId, memory);
    return memory;
  }

  async getKnowledgeMemories(category?: KnowledgeCategory): Promise<KnowledgeMemory[]> {
    const all = Array.from(this.knowledgeStore.values());
    if (!category) return all;
    return all.filter((k) => k.category === category);
  }

  async setKnowledgeMemory(memory: KnowledgeMemory): Promise<KnowledgeMemory> {
    this.knowledgeStore.set(memory.templateId, memory);
    return memory;
  }
}
