import { prisma } from '../../db/client';
import { courseGenerator, GenerateCurriculumParams } from './courseGenerator';

export interface CreateCourseInput extends GenerateCurriculumParams {
  userId?: string;
}

const lessonMemoryCache = new Map<string, any>();

export class CourseService {
  private async ensureUserExists(userId: string) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@gohard.local`,
          name: 'Gohard Learner',
        },
      });
    }
  }

  async generateAndSaveCourse(input: CreateCourseInput) {
    const userId = input.userId || 'user-default';
    await this.ensureUserExists(userId);

    console.log('[Backend CourseService] Generating curriculum for topic:', input.topic);
    const curriculum = await courseGenerator.generateCurriculum(input);
    console.log('[Backend CourseService] Curriculum generated successfully:\n', JSON.stringify(curriculum, null, 2));

    const createdCourse = await prisma.course.create({
      data: {
        userId,
        title: curriculum.courseTitle,
        description: curriculum.courseDescription,
        modules: {
          create: curriculum.modules.map((mod) => ({
            title: mod.title,
            moduleOrder: mod.moduleOrder,
            lessons: {
              create: mod.lessons.map((les) => ({
                title: les.title,
                contentMarkdown: '',
                lessonOrder: les.lessonOrder,
              })),
            },
          })),
        },
        courseMemory: {
          create: {
            courseGoal: curriculum.courseGoal,
            masteredConcepts: [],
            courseWeaknesses: [],
          },
        },
      },
      include: {
        modules: {
          orderBy: { moduleOrder: 'asc' },
          include: {
            lessons: {
              orderBy: { lessonOrder: 'asc' },
            },
          },
        },
        courseMemory: true,
      },
    });

    // Persist learner knowledgeLevel and teaching strategy explanationStyle in memory models
    if (input.level) {
      await prisma.learnerMemory.upsert({
        where: { userId },
        update: { knowledgeLevel: input.level },
        create: { userId, knowledgeLevel: input.level },
      });
    }

    if (input.style) {
      await prisma.teachingStrategyMemory.upsert({
        where: { userId },
        update: { explanationStyle: input.style },
        create: { userId, explanationStyle: input.style },
      });
    }

    return createdCourse;
  }

  async getUserCourses(userId: string = 'user-default') {
    await this.ensureUserExists(userId);

    const courses = await prisma.course.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
        courseMemory: true,
      },
    });

    return courses.map((course) => {
      let totalLessons = 0;
      let completedLessons = 0;

      course.modules.forEach((mod) => {
        mod.lessons.forEach((les) => {
          totalLessons += 1;
          if (les.isCompleted) completedLessons += 1;
        });
      });

      const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        isCompleted: course.isCompleted,
        totalLessons,
        completedLessons,
        progressPercent,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        courseGoal: course.courseMemory?.courseGoal || '',
        modules: course.modules.map((mod) => ({
          id: mod.id,
          title: mod.title,
          moduleOrder: mod.moduleOrder,
          lessons: mod.lessons.map((les) => ({
            id: les.id,
            title: les.title,
            lessonOrder: les.lessonOrder,
            isCompleted: les.isCompleted,
            hasContent: Boolean(les.contentMarkdown && les.contentMarkdown.trim().length > 0),
          })),
        })),
      };
    });
  }

  async getCourseDetails(courseId: string, userId: string = 'user-default') {
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId },
      include: {
        modules: {
          orderBy: { moduleOrder: 'asc' },
          include: {
            lessons: {
              orderBy: { lessonOrder: 'asc' },
            },
          },
        },
        courseMemory: true,
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  }

  async getOrGenerateLessonContent(
    lessonId: string,
    modelName?: string,
    providerSlug?: string,
    generate: boolean = false
  ) {
    if (!generate && lessonMemoryCache.has(lessonId)) {
      const cached = lessonMemoryCache.get(lessonId);
      if (cached && cached.contentMarkdown) {
        return cached;
      }
    }

    const lesson = await prisma.moduleLesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    if (lesson.contentMarkdown && lesson.contentMarkdown.trim().length > 0) {
      const payload = {
        id: lesson.id,
        title: lesson.title,
        moduleId: lesson.moduleId,
        moduleTitle: lesson.module.title,
        courseId: lesson.module.courseId,
        courseTitle: lesson.module.course.title,
        contentMarkdown: lesson.contentMarkdown,
        isCompleted: lesson.isCompleted,
      };
      lessonMemoryCache.set(lessonId, payload);
      return payload;
    }

    if (!generate) {
      return {
        id: lesson.id,
        title: lesson.title,
        moduleId: lesson.moduleId,
        moduleTitle: lesson.module.title,
        courseId: lesson.module.courseId,
        courseTitle: lesson.module.course.title,
        contentMarkdown: '',
        isCompleted: lesson.isCompleted,
      };
    }

    const generatedMarkdown = await courseGenerator.generateLessonMarkdown({
      courseTitle: lesson.module.course.title,
      moduleTitle: lesson.module.title,
      lessonTitle: lesson.title,
      summaryObjectives: `Objectives for ${lesson.title}`,
      level: 'intermediate',
      style: 'hands_on_lab_first',
      modelName,
      providerSlug,
    });

    const updated = await prisma.moduleLesson.update({
      where: { id: lessonId },
      data: { contentMarkdown: generatedMarkdown },
    });

    const payload = {
      id: updated.id,
      title: updated.title,
      moduleId: lesson.moduleId,
      moduleTitle: lesson.module.title,
      courseId: lesson.module.courseId,
      courseTitle: lesson.module.course.title,
      contentMarkdown: updated.contentMarkdown,
      isCompleted: updated.isCompleted,
    };
    lessonMemoryCache.set(lessonId, payload);
    return payload;
  }

  async deleteCourse(courseId: string, userId: string = 'user-default') {
    const existing = await prisma.course.findFirst({
      where: { id: courseId, userId },
    });

    if (!existing) {
      throw new Error('Course not found');
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    return { success: true };
  }
}

export const courseService = new CourseService();
