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
  async handleGenerateCourse(c: Context<{ Bindings: Bindings }>) {
    try {
      const body = await c.req.json().catch(() => ({}));
      console.log('\n========================================');
      console.log('[Backend CourseController] Incoming POST /api/courses/generate');
      console.log('[Backend CourseController] Request Body:', JSON.stringify(body, null, 2));
      console.log('========================================\n');

      const validated = c.req.valid('json' as never) || body;
      const course = await courseService.generateAndSaveCourse(validated as any);

      console.log('\n[Backend CourseController] Successfully generated & saved course:', {
        id: course.id,
        title: course.title,
        modulesCount: course.modules?.length,
      });

      return c.json({ success: true, course }, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate course';
      console.error('\n[Backend CourseController ERROR]:', err);
      return c.json({ error: msg }, 500);
    }
  }

  async handleGetUserCourses(c: Context<{ Bindings: Bindings }>) {
    try {
      const userId = c.req.query('userId') || 'user-default';
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
      const userId = c.req.query('userId') || 'user-default';
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
      const modelName = c.req.query('modelName');
      const providerSlug = c.req.query('providerSlug');
      const generate = c.req.query('generate') === 'true';
      console.log('\n========================================');
      console.log('[Backend CourseController] GET /api/courses/lessons/' + lessonId, { modelName, providerSlug, generate });
      console.log('========================================\n');
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
      const userId = c.req.query('userId') || 'user-default';
      const result = await courseService.deleteCourse(courseId, userId);
      return c.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete course';
      return c.json({ error: msg }, 500);
    }
  }
}

export const courseController = new CourseController();
