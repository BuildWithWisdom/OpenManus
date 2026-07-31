import { PERSONAS } from './personas';
import { PromptBuildOptions } from './types';

export function buildSystemPrompt(options?: PromptBuildOptions): string {
  const selectedPersonaId = options?.personaId || 'default';
  const persona = PERSONAS[selectedPersonaId] || PERSONAS.default;

  const corePrinciplesBlock = persona.corePrinciples
    .map((principle) => `- ${principle}`)
    .join('\n');

  const formattingRulesBlock = persona.formattingRules
    .map((rule) => `- ${rule}`)
    .join('\n');

  const safetyBoundariesBlock = persona.safetyBoundaries
    .map((boundary) => `- ${boundary}`)
    .join('\n');

  let prompt = `<agent_identity>
${persona.identity}
</agent_identity>

<core_principles>
${corePrinciplesBlock}
</core_principles>

<formatting_rules>
${formattingRulesBlock}
</formatting_rules>

<safety_boundaries>
${safetyBoundariesBlock}
</safety_boundaries>`;

  if (options?.additionalContext && options.additionalContext.trim().length > 0) {
    prompt += `\n\n<additional_context>\n${options.additionalContext.trim()}\n</additional_context>`;
  }

  return prompt;
}
