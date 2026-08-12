import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { courseController, createCourseSchema } from './course.controller';
import { Bindings } from '../../types';
import { authMiddleware } from '../auth/auth.middleware';

export const courseRouter = new Hono<{ Bindings: Bindings }>();

courseRouter.use('*', authMiddleware);

courseRouter.post('/generate', zValidator('json', createCourseSchema), (c) =>
  courseController.handleGenerateCourse(c)
);

courseRouter.get('/', (c) => courseController.handleGetUserCourses(c));

courseRouter.get('/lessons/:lessonId', (c) => courseController.handleGetLessonContent(c));

courseRouter.get('/:id', (c) => courseController.handleGetCourseDetails(c));

courseRouter.delete('/:id', (c) => courseController.handleDeleteCourse(c));
