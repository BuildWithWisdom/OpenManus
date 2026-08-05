export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  providerSlug: string;
}

export interface ModelGroup {
  provider: string;
  providerSlug: string;
  models: ModelOption[];
}

export const MODEL_GROUPS: ModelGroup[] = [
  {
    provider: 'NVIDIA NIM',
    providerSlug: 'custom-nvidia',
    models: [
      { id: 'nvidia/nemotron-3-ultra-550b-a55b', name: 'Nemotron 3 Ultra 550B', provider: 'NVIDIA NIM', providerSlug: 'custom-nvidia' },
      { id: 'nvidia/nemotron-3-super-120b-a12b', name: 'Nemotron 3 Super 120B', provider: 'NVIDIA NIM', providerSlug: 'custom-nvidia' },
      { id: 'nvidia/nemotron-3-nano-30b-a3b', name: 'Nemotron 3 Nano 30B', provider: 'NVIDIA NIM', providerSlug: 'custom-nvidia' },
      { id: 'thinkingmachines/inkling', name: 'Inkling Reasoning', provider: 'NVIDIA NIM', providerSlug: 'custom-nvidia' },
      { id: 'stepfun-ai/step-3.7-flash', name: 'StepFun 3.7 Flash', provider: 'NVIDIA NIM', providerSlug: 'custom-nvidia' },
    ],
  },
  {
    provider: 'Qwen',
    providerSlug: 'custom-qwen',
    models: [
      { id: 'qwen3.8-max', name: 'Qwen 3.8 Max', provider: 'Qwen', providerSlug: 'custom-qwen' },
      { id: 'qwen3.7-max', name: 'Qwen 3.7 Max', provider: 'Qwen', providerSlug: 'custom-qwen' },
      { id: 'qwen3.7-plus', name: 'Qwen 3.7 Plus', provider: 'Qwen', providerSlug: 'custom-qwen' },
      { id: 'qwen3.6-max', name: 'Qwen 3.6 Max', provider: 'Qwen', providerSlug: 'custom-qwen' },
      { id: 'qwen3.6-plus', name: 'Qwen 3.6 Plus', provider: 'Qwen', providerSlug: 'custom-qwen' },
      { id: 'qwen3.6-flash', name: 'Qwen 3.6 Flash', provider: 'Qwen', providerSlug: 'custom-qwen' },
      { id: 'kimi-k2.7-code', name: 'Kimi K2.7 Code', provider: 'Qwen', providerSlug: 'custom-qwen' },
      { id: 'glm-5.2', name: 'GLM 5.2', provider: 'Qwen', providerSlug: 'custom-qwen' },
      { id: 'deepseek-v4-flash-0731', name: 'DeepSeek V4 Flash (0731)', provider: 'Qwen', providerSlug: 'custom-qwen' },
    ],
  },
  {
    provider: 'StepFun',
    providerSlug: 'custom-stepfun',
    models: [
      { id: 'step-3.7-flash', name: 'StepFun 3.7 Flash', provider: 'StepFun', providerSlug: 'custom-stepfun' },
      { id: 'step-3.5-flash', name: 'StepFun 3.5 Flash', provider: 'StepFun', providerSlug: 'custom-stepfun' },
    ],
  },
  {
    provider: 'Groq',
    providerSlug: 'groq',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', provider: 'Groq', providerSlug: 'groq' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'Groq', providerSlug: 'groq' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', provider: 'Groq', providerSlug: 'groq' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'Groq', providerSlug: 'groq' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', provider: 'Groq', providerSlug: 'groq' },
    ],
  },
];

export const getAllModels = (): ModelOption[] => {
  return MODEL_GROUPS.flatMap((group) => group.models);
};

export const getModelById = (id: string): ModelOption | undefined => {
  return getAllModels().find((m) => m.id === id);
};
