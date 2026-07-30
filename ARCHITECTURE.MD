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
