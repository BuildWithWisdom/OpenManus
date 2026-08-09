# ARCHITECTURE.md

Living architecture document for the AI Engineering course project.

---

## Completed Project Milestones


### Module 0 — Orientation

- Created the project repository.
- Selected the technology stack.
- Chose Electron + React + TypeScript.
- Defined the long-term vision.
- Created the initial folder structure.

---

### Module 1 — Desktop Chat Interface & LLM Connection

- Integrated StepFun AI LLM connection (`step-3.7-flash`, `step-3.5-flash`, `step-1.5v`) via IPC bridge (`chat:sendMessage`).
- Redesigned chat interface with two-layer floating workspace cards and obsidian dark theme (`#06080b`).
- Implemented global top app header and inner card header bar with conversation title dropdown.
- Created standalone right sidebar card featuring dynamic Table of Contents (TOC), Thought Process accordion, and Related resource links.
- Added custom Markdown response formatting (headings, lists, bold labels, paragraph spacing) and Prism syntax highlighting with line numbers and 1-click copy buttons.

---

### Module 2 — Prompt Engineering

- Implemented Modular Prompt System in dedicated `src/main/prompts/` engine.
- Designed OpenManus persona as an autonomous AI Agent with structured analytical thinking, Markdown formatting, and explicit prompt injection safety boundaries.
- Built XML system prompt structure using `<agent_identity>`, `<core_principles>`, `<formatting_rules>`, and `<safety_boundaries>` blocks.
- Integrated `buildSystemPrompt()` into `src/main/main.ts` IPC handler for dynamic system message assembly.

---

### Module 3 — Structured Outputs & Diagram Rendering Engine

- Integrated Mermaid.js diagram engine with custom normalizer supporting 4 syntax formats (`subgraph ID ["Title"]`, quoted/unquoted IDs).
- Implemented `subGraphTitleMargin: { top: 12, bottom: 20 }` layout engine configuration for clean subgraph header spacing.
- Built automatic global emoji scrubber stripping unicode symbols from titles, nodes, and labels across all diagram types.
- Created interactive Lightbox Modal component featuring drag-to-pan (`translate3d`), wheel zoom controls (40%–300%), reset button, and proportional scaling.
- Updated application typography (15px message bubbles and paragraphs) and code block rendering with line numbers removed.

---

### Module 4 — AI APIs & Real-Time Token Streaming Engine

- Built zero-dependency Cloudflare AI Gateway REST Provider (`providerFactory.ts`) supporting NVIDIA NIM (`custom-nvidia`) and Cloudflare Workers AI (`workers-ai`) models.
- Implemented real-time SSE chunk decoder in Node.js main process delivering token streams over Electron IPC (`chat:onTokenChunk`).
- Built reasoning chunk stream parser (`delta.reasoning_content`) auto-wrapped in `<think>` tags and collapsible `ThoughtCard` accordion UI in `MessageList.tsx`.
- Integrated active stream cancellation (`chat:abortStream`) with dynamic stop generation button in `ChatInput.tsx`.
- Created provider-grouped model dropdown UI (`NVIDIA NIM`, `Cloudflare Workers AI`) with vertical scrolling (`max-height: 280px`) and click-outside dismissal.
- Polish status card footer in `Sidebar.tsx` with clean model titles and vertically centered green connection indicator dot.

---

### Module 6 — Gohard Memory Engine (Phases 1–6 Completed & Verified)

- **Phase 1 & 2**: Created core memory layers (`LearnerMemory`, `TeachingStrategyMemory`, `CourseMemory`, `SessionMemory`, `KnowledgeMemory`) in [types.ts](file:///home/aguowisdom/Projects/OpenManus/server/src/modules/memory/types.ts).
- **Phase 3**: Configured Prisma schema and connected to NeonDB PostgreSQL database with active `pgvector` extension.
- **Phase 4**: Built `AnalystEngine` ([analystEngine.ts](file:///home/aguowisdom/Projects/OpenManus/server/src/modules/memory/analystEngine.ts)) implementing background structured memory extraction via Zod schema (`MemoryExtractionSchema`).
- **Phase 5**: Implemented native `pgvector` vector store ([semanticStore.ts](file:///home/aguowisdom/Projects/OpenManus/server/src/modules/memory/semanticStore.ts)) generating 384-dimensional embeddings via Cloudflare AI Gateway (`@cf/baai/bge-small-en-v1.5`) with native PostgreSQL `<=>` cosine distance similarity search.
- **Architecture Streamlining**: Streamlined memory models — removed global strengths/weaknesses and redundant `courseMisconceptions` array; isolated `courseGoal` per course ID; tracked active practice topics cleanly in `courseWeaknesses` and mastered topics in `masteredConcepts`.
- **Phase 6**: Integrated adaptive teaching loop into [chat.service.ts](file:///home/aguowisdom/Projects/OpenManus/server/src/modules/chat/chat.service.ts) and [promptBuilder.ts](file:///home/aguowisdom/Projects/OpenManus/server/src/prompts/promptBuilder.ts). Automated system prompt injection of `<learner_memory_context>` tags containing `<learner_profile>`, `<teaching_strategy>`, `<course_context>`, and vector-matched `<semantic_past_explanations>`. Tested and verified 100% passing in [testAdaptiveLoop.ts](file:///home/aguowisdom/Projects/OpenManus/server/src/modules/memory/testAdaptiveLoop.ts).


