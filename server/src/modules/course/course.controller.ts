import { Context } from 'hono';
import { z } from 'zod';
import { courseService } from './course.service';
import { Bindings } from '../../types';

export const createCourseSchema = z.object({
  topic: z.string().min(2, 'Topic must be at least 2 characters'),
  level: z.string().default('intermediate'),
  goal: z.string().default('Master practical skills'),
  style: z.string().default('hands_on_lab_first'),
  userId: z.string().optional(),
  modelName: z.string().optional(),
  providerSlug: z.string().optional(),
});

export class CourseController {
  private getUserId(c: Context): string {
    const authUser = c.get('user') as any;
    if (authUser && authUser.id) {
      return authUser.id;
    }
    throw new Error('Unauthorized: Missing authenticated user token');
  }

  async handleGenerateCourse(c: Context<{ Bindings: Bindings }>) {
    try {
      const body = await c.req.json().catch(() => ({}));
      const userId = this.getUserId(c);
      const validated = (c.req as any).valid?.('json') || body;
      const payload = { ...validated, userId: validated.userId || userId };
      const course = await courseService.generateAndSaveCourse(payload as any);
      return c.json({ success: true, course }, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate course';
      console.error('\n[Backend CourseController ERROR]:', err);
      return c.json({ error: msg }, 500);
    }
  }

  async handleGetUserCourses(c: Context<{ Bindings: Bindings }>) {
    try {
      const userId = this.getUserId(c);
      const courses = await courseService.getUserCourses(userId);
      return c.json({ courses });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch courses';
      return c.json({ error: msg }, 500);
    }
  }

  async handleGetCourseDetails(c: Context<{ Bindings: Bindings }>) {
    try {
      const courseId = c.req.param('id');
      if (!courseId) {
        return c.json({ error: 'Missing course ID' }, 400);
      }
      const userId = this.getUserId(c);
      const course = await courseService.getCourseDetails(courseId, userId);
      return c.json({ course });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Course not found';
      return c.json({ error: msg }, 404);
    }
  }

  async handleGetLessonContent(c: Context<{ Bindings: Bindings }>) {
    try {
      const lessonId = c.req.param('lessonId');
      if (!lessonId) {
        return c.json({ error: 'Missing lesson ID' }, 400);
      }
      const modelName = c.req.query('modelName');
      const providerSlug = c.req.query('providerSlug');
      const generate = c.req.query('generate') === 'true';
      const lesson = await courseService.getOrGenerateLessonContent(lessonId, modelName, providerSlug, generate);
      return c.json({ lesson });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load lesson';
      console.error('\n[Backend CourseController ERROR in handleGetLessonContent]:', err);
      return c.json({ error: msg }, 500);
    }
  }

  async handleDeleteCourse(c: Context<{ Bindings: Bindings }>) {
    try {
      const courseId = c.req.param('id');
      if (!courseId) {
        return c.json({ error: 'Missing course ID' }, 400);
      }
      const userId = this.getUserId(c);
      const result = await courseService.deleteCourse(courseId, userId);
      return c.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete course';
      return c.json({ error: msg }, 500);
    }
  }
}

export const courseController = new CourseController();
