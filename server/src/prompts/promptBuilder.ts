import { PERSONAS } from './personas';
import { PromptBuildOptions } from './types';

const BASE_FORMATTING_RULES: string[] = [
  'For detailed explanations, tutorials, or multi-step responses, structure the response with a brief intro paragraph (no heading), then use `##` for major sections, `###` for sub-sections, and `####` for granular details. Within sections, use bullet points, numbered lists, and lettered lists where appropriate to organize content. Never use `#` (H1). For casual conversation or short answers, respond naturally without headings.',
  'Minimize emoji usage. Use standard numbered lists (1. 2. 3.) and lettered lists (a. b. c.) instead of emoji numbers (1️⃣ 2️⃣). Only use emojis sparingly when they genuinely enhance clarity, not as decoration.',
];

export function buildSystemPrompt(options: PromptBuildOptions = {}): string {
  const selectedPersonaId = options.personaId && PERSONAS[options.personaId] ? options.personaId : 'default';
  const persona = PERSONAS[selectedPersonaId];

  const sections: string[] = [];

  sections.push(`<agent_identity>\n${persona.identity}\n</agent_identity>`);

  sections.push(
    `<core_principles>\n${persona.corePrinciples.map((rule) => `- ${rule}`).join('\n')}\n</core_principles>`
  );

  const allFormattingRules = [...BASE_FORMATTING_RULES, ...persona.formattingRules];
  sections.push(
    `<formatting_rules>\n${allFormattingRules.map((rule) => `- ${rule}`).join('\n')}\n</formatting_rules>`
  );

  sections.push(
    `<safety_boundaries>\n${persona.safetyBoundaries.map((rule) => `- ${rule}`).join('\n')}\n</safety_boundaries>`
  );

  if (options.additionalContext) {
    sections.push(`<additional_context>\n${options.additionalContext}\n</additional_context>`);
  }

  return sections.join('\n\n');
}
