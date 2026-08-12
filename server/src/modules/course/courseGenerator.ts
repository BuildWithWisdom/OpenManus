import { z } from 'zod';

export const CourseCurriculumSchema = z.object({
  courseTitle: z.string().describe('Engaging and clear title for the generated course'),
  courseDescription: z.string().describe('Comprehensive overview of what the learner will master'),
  courseGoal: z.string().describe('Primary actionable learning outcome'),
  modules: z.array(
    z.object({
      title: z.string().describe('Module title'),
      moduleOrder: z.number().describe('Sequential order of module (starting at 1)'),
      lessons: z.array(
        z.object({
          title: z.string().describe('Lesson title'),
          lessonOrder: z.number().describe('Sequential order of lesson within module (starting at 1)'),
          summaryObjectives: z.string().describe('Brief 1-2 sentence overview of key learning objectives'),
        })
      ),
    })
  ),
});

export type GeneratedCurriculum = z.infer<typeof CourseCurriculumSchema>;

export interface GenerateCurriculumParams {
  topic: string;
  level: string;
  goal: string;
  style: string;
  modelName?: string;
  providerSlug?: string;
}

export interface GenerateLessonContentParams {
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  summaryObjectives: string;
  level: string;
  style: string;
  modelName?: string;
  providerSlug?: string;
}

export class CourseGenerator {
  async generateCurriculum(params: GenerateCurriculumParams): Promise<GeneratedCurriculum> {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const gatewayId = process.env.CLOUDFLARE_GATEWAY_ID || 'ai-engineer';
    const providerSlug = params.providerSlug || 'custom-nvidia';
    const selectedModel = params.modelName || 'nvidia/nemotron-3-nano-30b-a3b';

    if (!accountId || !apiToken) {
      throw new Error('Cloudflare API credentials missing in environment.');
    }

    const systemPrompt =
      'You are Gohard AI, an elite adaptive curriculum architect. Your task is to design a structured learning course tailored specifically to the learner preferences.\n\n' +
      'CURRICULUM INSTRUCTIONS:\n' +
      '1. Analyze the learner Current Knowledge Level and Primary Target Goal.\n' +
      '2. Decompose the topic into logical Modules tailored strictly to the learner knowledge level and target goal.\n' +
      '3. Decompose each Module into clear Lessons containing titles and concise summary objectives.\n' +
      '4. Do NOT leave the modules array or lessons arrays empty.\n\n' +
      'OUTPUT FORMAT RULES:\n' +
      '1. Return ONLY a valid JSON object. Do NOT wrap in markdown code blocks (` ```json `). Do NOT include conversational text or introductions.\n' +
      '2. Your JSON output MUST match this exact top-level schema:\n' +
      '{\n' +
      '  "courseTitle": "Title of the course",\n' +
      '  "courseDescription": "Comprehensive overview of the course",\n' +
      '  "courseGoal": "Primary learning goal",\n' +
      '  "modules": [\n' +
      '    {\n' +
      '      "title": "Module Title",\n' +
      '      "moduleOrder": 1,\n' +
      '      "lessons": [\n' +
      '        {\n' +
      '          "title": "Lesson Title",\n' +
      '          "lessonOrder": 1,\n' +
      '          "summaryObjectives": "Concise summary objective for this lesson"\n' +
      '        }\n' +
      '      ]\n' +
      '    }\n' +
      '  ]\n' +
      '}\n';

    const userPrompt =
      `[Learner Preferences]:\n` +
      `- Topic / Subject: ${params.topic}\n` +
      `- Current Knowledge Level: ${params.level}\n` +
      `- Primary Target Goal: ${params.goal}\n` +
      `- Preferred Explanation Style: ${params.style}\n\n` +
      `Generate the full structured course curriculum JSON matching the exact schema specified above.`;

    const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/${providerSlug}/v1/chat/completions`;

    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-aig-authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      throw new Error(`AI Gateway Error [${response.status}]: ${errText}`);
    }

    const payload = (await response.json()) as any;
    let rawContent = payload.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('Empty response received from AI model');
    }

    // Clean any residual markdown code block wrappers
    rawContent = rawContent.trim();
    if (rawContent.startsWith('```')) {
      rawContent = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch (parseErr) {
      throw new Error(`Failed to parse AI JSON response: ${rawContent.slice(0, 100)}...`);
    }

    // If model wrapped response inside a nested object (e.g. { "curriculum": { ... } })
    const targetObj = parsedJson.curriculum || parsedJson.course || parsedJson.data || parsedJson;

    const validated = CourseCurriculumSchema.parse(targetObj);
    return validated;
  }

  async generateLessonMarkdown(params: GenerateLessonContentParams): Promise<string> {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const gatewayId = process.env.CLOUDFLARE_GATEWAY_ID || 'ai-engineer';
    const providerSlug = params.providerSlug || 'custom-nvidia';
    const selectedModel = params.modelName || 'nvidia/nemotron-3-nano-30b-a3b';

    if (!accountId || !apiToken) {
      throw new Error('Cloudflare API credentials missing in environment.');
    }

    const systemPrompt =
      'You are Gohard AI, a world-class technical educator. Write a rich, thorough, beautifully formatted Markdown lesson guide.\n\n' +
      'Formatting Guidelines:\n' +
      '- Start directly with a brief high-level overview (no H1 tag).\n' +
      '- Use `##` for key sections and `###` for sub-sections.\n' +
      '- Provide clear code snippets with appropriate syntax highlighting (e.g. ```typescript, ```python).\n' +
      '- Include Mermaid diagrams (```mermaid) if visual process flows enhance understanding.\n' +
      '- Include a "### Key Takeaways" section at the end.\n' +
      '- Never mention prompt instructions or system rules.';

    const userPrompt =
      `[Course]: ${params.courseTitle}\n` +
      `[Module]: ${params.moduleTitle}\n` +
      `[Lesson Title]: ${params.lessonTitle}\n` +
      `[Lesson Objectives]: ${params.summaryObjectives}\n` +
      `[Learner Level]: ${params.level}\n` +
      `[Preferred Style]: ${params.style}\n\n` +
      `Write the complete interactive lesson markdown guide now.`;

    const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/${providerSlug}/v1/chat/completions`;

    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-aig-authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      throw new Error(`AI Gateway Error [${response.status}]: ${errText}`);
    }

    const payload = (await response.json()) as any;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response received for lesson generation');
    }

    return content;
  }
}

export const courseGenerator = new CourseGenerator();
