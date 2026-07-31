export type PersonaId = 'default' | 'coding_architect' | 'concise_executive';

export interface PromptPersona {
  id: PersonaId;
  name: string;
  identity: string;
  corePrinciples: string[];
  formattingRules: string[];
  safetyBoundaries: string[];
}

export interface PromptBuildOptions {
  personaId?: PersonaId;
  additionalContext?: string;
}
