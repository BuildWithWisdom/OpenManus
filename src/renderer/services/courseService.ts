const HONO_API_URL = import.meta.env.VITE_HONO_API_URL || 'http://localhost:8787';

export interface LessonSummary {
  id: string;
  title: string;
  lessonOrder: number;
  isCompleted: boolean;
  hasContent: boolean;
}

export interface ModuleSummary {
  id: string;
  title: string;
  moduleOrder: number;
  lessons: LessonSummary[];
}

export interface UserCourseSummary {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
  courseGoal: string;
  modules: ModuleSummary[];
}

export interface DetailedLessonContent {
  id: string;
  title: string;
  moduleId: string;
  moduleTitle: string;
  courseId: string;
  courseTitle: string;
  contentMarkdown: string;
  isCompleted: boolean;
}

export async function fetchUserCourses(userId: string = 'user-default'): Promise<UserCourseSummary[]> {
  const response = await fetch(`${HONO_API_URL}/api/courses?userId=${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch courses [${response.status}]`);
  }
  const data = await response.json();
  return data.courses || [];
}

export async function fetchCourseDetails(courseId: string, userId: string = 'user-default') {
  const response = await fetch(`${HONO_API_URL}/api/courses/${courseId}?userId=${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch course details [${response.status}]`);
  }
  const data = await response.json();
  return data.course;
}

export async function generateCourse(params: {
  topic: string;
  level?: string;
  goal?: string;
  style?: string;
  userId?: string;
  modelName?: string;
  providerSlug?: string;
}) {
  const targetUrl = `${HONO_API_URL}/api/courses/generate`;
  console.log('[courseService] Requesting course generation:', targetUrl, params);

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  console.log('[courseService] Response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    console.error('[courseService] Error response payload:', errorData);
    throw new Error(errorData.error || `Course generation failed [${response.status}]`);
  }

  const data = await response.json();
  console.log('[courseService] Successfully generated course:', data);
  return data.course;
}

export async function fetchLessonContent(
  lessonId: string,
  modelName?: string,
  providerSlug?: string,
  generate: boolean = false
): Promise<DetailedLessonContent> {
  const params = new URLSearchParams();
  if (modelName) params.append('modelName', modelName);
  if (providerSlug) params.append('providerSlug', providerSlug);
  if (generate) params.append('generate', 'true');

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const url = `${HONO_API_URL}/api/courses/lessons/${lessonId}${queryString}`;
  console.log('[courseService] Requesting lesson content:', url);

  const response = await fetch(url);
  console.log('[courseService] Response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    console.error('[courseService] Error fetching lesson content:', errorData);
    throw new Error(errorData.error || `Failed to fetch lesson content [${response.status}]`);
  }

  const data = await response.json();
  return data.lesson;
}

export async function deleteCourse(courseId: string, userId: string = 'user-default') {
  const response = await fetch(`${HONO_API_URL}/api/courses/${courseId}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete course [${response.status}]`);
  }
  return response.json();
}
