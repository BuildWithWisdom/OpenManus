import { prisma } from '../../db/client';
import { embeddingService } from './embeddingService';

export type MemoryCategory = 'EXPLANATION' | 'LESSON_SUMMARY' | 'STUDENT_REFLECTION' | 'QA_PAIR';

export interface SaveSemanticMemoryParams {
  userId: string;
  courseId?: string;
  conversationId?: string;
  messageId?: string;
  category?: MemoryCategory;
  concept: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface SearchSemanticMemoryParams {
  userId: string;
  courseId?: string;
  query: string;
  category?: MemoryCategory;
  limit?: number;
}

export interface SemanticSearchResult {
  id: string;
  userId: string;
  courseId?: string | null;
  conversationId?: string | null;
  messageId?: string | null;
  category: MemoryCategory;
  concept: string;
  content: string;
  similarity: number;
  createdAt: Date;
}

export class SemanticStore {
  async saveSemanticMemory(params: SaveSemanticMemoryParams): Promise<SemanticSearchResult> {
    const id = `sem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const category = params.category || 'EXPLANATION';
    const embedding = await embeddingService.generateEmbedding(params.content);
    const vectorString = `[${embedding.join(',')}]`;
    const metadataJson = params.metadata ? JSON.stringify(params.metadata) : null;

    if (process.env.DATABASE_URL) {
      await prisma.user.upsert({
        where: { id: params.userId },
        create: { id: params.userId, email: `${params.userId}@gohard.ai`, name: 'Learner' },
        update: {},
      });

      if (params.courseId) {
        await prisma.course.upsert({
          where: { id: params.courseId },
          create: { id: params.courseId, userId: params.userId, title: 'Course', description: 'Course Description' },
          update: {},
        });
      }

      await prisma.$executeRawUnsafe(
        `INSERT INTO "SemanticMemory" (id, "userId", "courseId", "conversationId", "messageId", category, concept, content, embedding, metadata, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6::"MemoryCategory", $7, $8, $9::vector, $10::jsonb, NOW(), NOW())`,
        id,
        params.userId,
        params.courseId || null,
        params.conversationId || null,
        params.messageId || null,
        category,
        params.concept,
        params.content,
        vectorString,
        metadataJson
      );
    }

    return {
      id,
      userId: params.userId,
      courseId: params.courseId || null,
      conversationId: params.conversationId || null,
      messageId: params.messageId || null,
      category,
      concept: params.concept,
      content: params.content,
      similarity: 1.0,
      createdAt: new Date(),
    };
  }

  async searchSemanticMemory(params: SearchSemanticMemoryParams): Promise<SemanticSearchResult[]> {
    const limit = params.limit || 3;
    const queryVector = await embeddingService.generateEmbedding(params.query);
    const vectorString = `[${queryVector.join(',')}]`;

    if (process.env.DATABASE_URL) {
      try {
        let sql = `
          SELECT id, "userId", "courseId", "conversationId", "messageId", category, concept, content, "createdAt",
                 1 - (embedding <=> $1::vector) AS similarity
          FROM "SemanticMemory"
          WHERE "userId" = $2
        `;
        const queryParams: unknown[] = [vectorString, params.userId];

        if (params.courseId) {
          queryParams.push(params.courseId);
          sql += ` AND "courseId" = $${queryParams.length}`;
        }

        if (params.category) {
          queryParams.push(params.category);
          sql += ` AND category = $${queryParams.length}::"MemoryCategory"`;
        }

        queryParams.push(limit);
        sql += ` ORDER BY embedding <=> $1::vector LIMIT $${queryParams.length}`;

        const rawResults = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(sql, ...queryParams);

        return rawResults.map((r) => ({
          id: String(r.id),
          userId: String(r.userId),
          courseId: r.courseId ? String(r.courseId) : null,
          conversationId: r.conversationId ? String(r.conversationId) : null,
          messageId: r.messageId ? String(r.messageId) : null,
          category: r.category as MemoryCategory,
          concept: String(r.concept),
          content: String(r.content),
          similarity: Number(r.similarity),
          createdAt: new Date(r.createdAt as string | Date),
        }));
      } catch (err) {
        console.error('[SemanticStore] Raw vector query failed:', err);
      }
    }

    return [];
  }
}

export const semanticStore = new SemanticStore();
