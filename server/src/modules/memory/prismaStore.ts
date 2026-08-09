import { IMemoryStore } from './store';
import {
  LearnerMemory,
  TeachingStrategyMemory,
  CourseMemory,
  SessionMemory,
  KnowledgeMemory,
  KnowledgeCategory,
} from './types';
import { prisma } from '../../db/client';

export class PrismaMemoryStore implements IMemoryStore {
  async getLearnerMemory(userId: string): Promise<LearnerMemory | null> {
    const record = await prisma.learnerMemory.findUnique({
      where: { userId },
    });
    if (!record) return null;

    return {
      userId: record.userId,
      knowledgeLevel: record.knowledgeLevel as any,
      learningPace: record.learningPace as any,
      confidenceScore: record.confidenceScore,
    };
  }

  async setLearnerMemory(memory: LearnerMemory): Promise<LearnerMemory> {
    await prisma.user.upsert({
      where: { id: memory.userId },
      create: { id: memory.userId, email: `${memory.userId}@gohard.ai`, name: 'Learner' },
      update: {},
    });

    const record = await prisma.learnerMemory.upsert({
      where: { userId: memory.userId },
      create: {
        userId: memory.userId,
        knowledgeLevel: memory.knowledgeLevel,
        learningPace: memory.learningPace,
        confidenceScore: memory.confidenceScore,
      },
      update: {
        knowledgeLevel: memory.knowledgeLevel,
        learningPace: memory.learningPace,
        confidenceScore: memory.confidenceScore,
      },
    });

    return {
      userId: record.userId,
      knowledgeLevel: record.knowledgeLevel as any,
      learningPace: record.learningPace as any,
      confidenceScore: record.confidenceScore,
    };
  }

  async getTeachingStrategy(userId: string): Promise<TeachingStrategyMemory | null> {
    const record = await prisma.teachingStrategyMemory.findUnique({
      where: { userId },
    });
    if (!record) return null;

    return {
      userId: record.userId,
      learningApproach: record.learningApproach as any,
      explanationStyle: record.explanationStyle as any,
      assessmentFrequency: record.assessmentFrequency as any,
      socraticQuestioningEffectiveness: record.socraticQuestioningEffectiveness,
      preferredFormat: record.preferredFormat as any,
      observedPedagogicalSignals: record.observedPedagogicalSignals,
    };
  }

  async setTeachingStrategy(strategy: TeachingStrategyMemory): Promise<TeachingStrategyMemory> {
    await prisma.user.upsert({
      where: { id: strategy.userId },
      create: { id: strategy.userId, email: `${strategy.userId}@gohard.ai`, name: 'Learner' },
      update: {},
    });

    const record = await prisma.teachingStrategyMemory.upsert({
      where: { userId: strategy.userId },
      create: {
        userId: strategy.userId,
        learningApproach: strategy.learningApproach,
        explanationStyle: strategy.explanationStyle,
        assessmentFrequency: strategy.assessmentFrequency,
        socraticQuestioningEffectiveness: strategy.socraticQuestioningEffectiveness,
        preferredFormat: strategy.preferredFormat,
        observedPedagogicalSignals: strategy.observedPedagogicalSignals,
      },
      update: {
        learningApproach: strategy.learningApproach,
        explanationStyle: strategy.explanationStyle,
        assessmentFrequency: strategy.assessmentFrequency,
        socraticQuestioningEffectiveness: strategy.socraticQuestioningEffectiveness,
        preferredFormat: strategy.preferredFormat,
        observedPedagogicalSignals: strategy.observedPedagogicalSignals,
      },
    });

    return {
      userId: record.userId,
      learningApproach: record.learningApproach as any,
      explanationStyle: record.explanationStyle as any,
      assessmentFrequency: record.assessmentFrequency as any,
      socraticQuestioningEffectiveness: record.socraticQuestioningEffectiveness,
      preferredFormat: record.preferredFormat as any,
      observedPedagogicalSignals: record.observedPedagogicalSignals,
    };
  }

  async getCourseMemory(userId: string, courseId: string): Promise<CourseMemory | null> {
    const record = await prisma.courseMemory.findUnique({
      where: { courseId },
    });
    if (!record) return null;

    return {
      courseId: record.courseId,
      userId,
      currentModuleId: '',
      completedLessonIds: [],
      courseGoal: record.courseGoal || undefined,
      masteredConcepts: record.masteredConcepts,
      courseWeaknesses: record.courseWeaknesses,
    };
  }

  async setCourseMemory(memory: CourseMemory): Promise<CourseMemory> {
    await prisma.user.upsert({
      where: { id: memory.userId },
      create: { id: memory.userId, email: `${memory.userId}@gohard.ai`, name: 'Learner' },
      update: {},
    });

    await prisma.course.upsert({
      where: { id: memory.courseId },
      create: { id: memory.courseId, userId: memory.userId, title: 'Course', description: 'Course Description' },
      update: {},
    });

    const record = await prisma.courseMemory.upsert({
      where: { courseId: memory.courseId },
      create: {
        courseId: memory.courseId,
        courseGoal: memory.courseGoal,
        masteredConcepts: memory.masteredConcepts,
        courseWeaknesses: memory.courseWeaknesses,
      },
      update: {
        courseGoal: memory.courseGoal,
        masteredConcepts: memory.masteredConcepts,
        courseWeaknesses: memory.courseWeaknesses,
      },
    });

    return {
      courseId: record.courseId,
      userId: memory.userId,
      currentModuleId: memory.currentModuleId,
      completedLessonIds: memory.completedLessonIds,
      courseGoal: record.courseGoal || undefined,
      masteredConcepts: record.masteredConcepts,
      courseWeaknesses: record.courseWeaknesses,
    };
  }

  async getSessionMemory(sessionId: string): Promise<SessionMemory | null> {
    const record = await prisma.sessionState.findUnique({
      where: { sessionId },
    });
    if (!record) return null;

    return {
      sessionId: record.sessionId,
      userId: record.userId,
      activeCourseId: record.activeCourseId || undefined,
      activeLessonId: record.activeLessonId || undefined,
      workingMessages: [],
      temporaryObservations: record.temporaryObservations,
    };
  }

  async setSessionMemory(memory: SessionMemory): Promise<SessionMemory> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const record = await prisma.sessionState.upsert({
      where: { sessionId: memory.sessionId },
      create: {
        sessionId: memory.sessionId,
        userId: memory.userId,
        activeCourseId: memory.activeCourseId,
        activeLessonId: memory.activeLessonId,
        temporaryObservations: memory.temporaryObservations,
        expiresAt,
      },
      update: {
        activeCourseId: memory.activeCourseId,
        activeLessonId: memory.activeLessonId,
        temporaryObservations: memory.temporaryObservations,
        expiresAt,
      },
    });

    return {
      sessionId: record.sessionId,
      userId: record.userId,
      activeCourseId: record.activeCourseId || undefined,
      activeLessonId: record.activeLessonId || undefined,
      workingMessages: memory.workingMessages,
      temporaryObservations: record.temporaryObservations,
    };
  }

  async getKnowledgeMemories(category?: KnowledgeCategory): Promise<KnowledgeMemory[]> {
    const records = await prisma.knowledgeMemory.findMany({
      where: category ? { category } : undefined,
    });

    return records.map((r: { id: string; category: string; title: string; contentMarkdown: string }) => ({
      templateId: r.id,
      category: r.category as any,
      title: r.title,
      content: r.contentMarkdown,
    }));
  }

  async setKnowledgeMemory(memory: KnowledgeMemory): Promise<KnowledgeMemory> {
    const record = await prisma.knowledgeMemory.create({
      data: {
        category: memory.category,
        title: memory.title,
        contentMarkdown: memory.content,
      },
    });

    return {
      templateId: record.id,
      category: record.category as any,
      title: record.title,
      content: record.contentMarkdown,
    };
  }
}
