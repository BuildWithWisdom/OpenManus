import { z } from 'zod';
import { memoryManager } from './memoryManager';

export const MemoryExtractionSchema = z.object({
  hasObservation: z
    .boolean()
    .describe('Set to false if this turn contains no new learning evidence (e.g. casual greeting, simple thanks)'),
  reasoning: z.string().optional().describe('Brief rationale explaining extracted evidence'),
  learnerMemoryUpdates: z
    .object({
      knowledgeLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
      learningPace: z.enum(['thorough_and_detailed', 'moderate', 'fast_paced']).optional(),
      confidenceScore: z.number().min(0).max(1).optional(),
    })
    .optional(),
  teachingStrategyUpdates: z
    .object({
      learningApproach: z.enum(['hands_on_lab_first', 'architecture_first', 'theory_first', 'balanced']).optional(),
      explanationStyle: z
        .enum(['analogy_driven', 'first_principles', 'visual_diagrams', 'step_by_step', 'practical_case_study'])
        .optional(),
      assessmentFrequency: z.enum(['frequent_micro_quizzes', 'periodic_milestones', 'project_based']).optional(),
      socraticQuestioningEffectiveness: z.number().min(0).max(1).optional(),
      preferredFormat: z.enum(['code_samples', 'architecture_diagrams', 'cli_walkthroughs', 'mixed']).optional(),
      observedPedagogicalSignals: z.array(z.string()).optional(),
    })
    .optional(),
  courseMemoryUpdates: z
    .object({
      courseGoal: z.string().optional(),
      masteredConcepts: z.array(z.string()).optional(),
      courseWeaknesses: z.array(z.string()).optional(),
    })
    .optional(),
});

export type MemoryExtractionResult = z.infer<typeof MemoryExtractionSchema>;

export interface AnalyzeTurnParams {
  userId: string;
  courseId?: string;
  userMessage: string;
  assistantResponse: string;
  modelName?: string;
  providerSlug?: string;
}

export class AnalystEngine {
  async extractAndApplyMemory(params: AnalyzeTurnParams): Promise<void> {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const gatewayId = process.env.CLOUDFLARE_GATEWAY_ID || 'ai-engineer';
    const providerSlug = params.providerSlug || 'custom-stepfun';
    const selectedModel = params.modelName || 'step-3.7-flash';

    if (!accountId || !apiToken) {
      console.warn('[AnalystEngine] Missing Cloudflare credentials. Memory extraction skipped.');
      return;
    }

    const currentContext = await memoryManager.buildMemoryContext({
      userId: params.userId,
      courseId: params.courseId,
    });

    const analystSystemPrompt =
      `You are Gohard's Learning Analyst AI. Your sole job is to evaluate lesson interaction turns and extract pedagogical signals about the learner.\n\n` +
      `Current Learner Context:\n${currentContext}\n\n` +
      `Instructions:\n` +
      `1. Analyze the User Message and Assistant Response for evidence of knowledge level, pace, mastered concepts, course weaknesses, or preferred explanation styles.\n` +
      `2. If there is NO new evidence (e.g. greetings, simple thanks, trivial confirmation), set "hasObservation": false.\n` +
      `3. Return ONLY a valid JSON object strictly matching the JSON schema provided.`;

    const promptMessages = [
      { role: 'system', content: analystSystemPrompt },
      { role: 'user', content: `[User Message]: ${params.userMessage}\n[Assistant Response]: ${params.assistantResponse}` },
    ];

    const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/${providerSlug}/v1/chat/completions`;

    try {
      const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-aig-authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: promptMessages,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        console.error(`[AnalystEngine] Gateway error [${response.status}]`);
        return;
      }

      const jsonPayload = (await response.json()) as any;
      const rawText = jsonPayload.choices?.[0]?.message?.content;
      if (!rawText) return;

      const parsedJson = JSON.parse(rawText);
      const validationResult = MemoryExtractionSchema.safeParse(parsedJson);

      if (!validationResult.success) {
        console.error('[AnalystEngine] Schema validation failed:', validationResult.error.format());
        return;
      }

      const extraction = validationResult.data;

      if (!extraction.hasObservation) {
        console.log(`[AnalystEngine] No new evidence detected (${extraction.reasoning || 'No rationale provided'}).`);
        return;
      }

      console.log(`[AnalystEngine] Evidence detected: ${extraction.reasoning || 'No rationale provided'}`);

      if (extraction.learnerMemoryUpdates) {
        await memoryManager.updateLearnerMemory(params.userId, extraction.learnerMemoryUpdates);
      }

      if (extraction.teachingStrategyUpdates) {
        await memoryManager.updateTeachingStrategy(params.userId, extraction.teachingStrategyUpdates);
      }

      if (extraction.courseMemoryUpdates && params.courseId) {
        const currentCourse = await memoryManager.getCourseMemory(params.userId, params.courseId);

        await memoryManager.updateCourseMemory(params.userId, params.courseId, {
          courseGoal: extraction.courseMemoryUpdates.courseGoal || currentCourse.courseGoal,
          masteredConcepts: extraction.courseMemoryUpdates.masteredConcepts
            ? Array.from(new Set([...currentCourse.masteredConcepts, ...extraction.courseMemoryUpdates.masteredConcepts]))
            : currentCourse.masteredConcepts,
          courseWeaknesses: extraction.courseMemoryUpdates.courseWeaknesses
            ? Array.from(new Set([...currentCourse.courseWeaknesses, ...extraction.courseMemoryUpdates.courseWeaknesses]))
            : currentCourse.courseWeaknesses,
        });
      }
    } catch (error) {
      console.error('[AnalystEngine] Exception during turn analysis:', error);
    }
  }
}

export const analystEngine = new AnalystEngine();
