import { PERSONAS } from './personas';
import { PromptBuildOptions } from './types';

export function buildSystemPrompt(options: PromptBuildOptions = {}): string {
  const selectedPersonaId = options.personaId && PERSONAS[options.personaId] ? options.personaId : 'default';
  const persona = PERSONAS[selectedPersonaId];

  const sections: string[] = [];

  sections.push(`<agent_identity>\n${persona.identity}\n</agent_identity>`);

  sections.push(
    `<core_principles>\n${persona.corePrinciples.map((rule) => `- ${rule}`).join('\n')}\n</core_principles>`
  );

  sections.push(
    `<formatting_rules>\n${persona.formattingRules.map((rule) => `- ${rule}`).join('\n')}\n</formatting_rules>`
  );

  sections.push(
    `<safety_boundaries>\n${persona.safetyBoundaries.map((rule) => `- ${rule}`).join('\n')}\n</safety_boundaries>`
  );

  if (options.additionalContext) {
    sections.push(`<additional_context>\n${options.additionalContext}\n</additional_context>`);
  }

  return sections.join('\n\n');
}
