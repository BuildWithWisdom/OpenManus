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
