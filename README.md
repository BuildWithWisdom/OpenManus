# OpenManus

> A production-quality desktop AI agent built from first principles as part of an AI Engineering learning journey.

---

## Vision

OpenManus is a long-term educational project that grows alongside an AI Engineering course.

Rather than building many disconnected demos, this project evolves module by module into a capable desktop AI agent inspired by systems such as Manus, ChatGPT Desktop, Claude Desktop, and Cursor.

Every feature added to the project directly corresponds to concepts learned in the course.

The goal is not simply to build an AI application—it is to understand the engineering decisions behind modern AI systems.

---

# Goals

By the end of the project, OpenManus will be able to:

- Understand natural language
- Support multiple LLM providers
- Maintain long-term memory
- Search documents using Retrieval-Augmented Generation (RAG)
- Use external tools
- Browse the web
- Execute code safely
- Plan and perform multi-step tasks
- Operate as an autonomous AI agent
- Run as a cross-platform desktop application

---

# Technology Stack

Current stack:

- TypeScript
- React
- Electron
- Node.js
- Git
- GitHub

Additional technologies will be introduced throughout the course only when they solve a specific engineering problem.

Examples include:

- OpenAI SDK
- Anthropic SDK
- Google Gemini SDK
- Vector databases
- MCP (Model Context Protocol)
- Local models
- SQLite
- Langfuse
- Playwright

---

# Project Philosophy

This project follows several engineering principles.

## Learn Before Building

Every feature is implemented only after understanding the underlying theory.

Architecture comes before implementation.

---

## First Principles

Every engineering decision should answer:

- Why does this exist?
- What problem does it solve?
- What alternatives exist?
- Why was this solution chosen?

---

## Modular Design

The project will be built as a collection of independent components.

Examples include:

- UI
- Agent Core
- Memory
- Tool System
- RAG
- Planning
- LLM Providers

Each component should be replaceable without affecting the rest of the system.

---

# Planned Architecture

```text
                User
                  │
                  ▼
          React Desktop UI
                  │
                  ▼
            Electron Shell
                  │
                  ▼
             Agent Core
        ┌─────────┼─────────┐
        ▼         ▼         ▼
   LLM Providers Memory     Tools
                  │
                  ▼
            Knowledge Base
```

This architecture will evolve throughout the course.

---

# Roadmap

## Module 0

- Project setup
- Repository creation
- Architecture
- Technology decisions

Status: ✅

---

## Future Modules

- LLM Fundamentals
- Prompt Engineering
- Structured Outputs
- AI APIs
- Embeddings
- Memory
- Retrieval-Augmented Generation (RAG)
- Tool Calling
- Model Context Protocol (MCP)
- Agent Engineering
- Agent Harness
- Production Deployment

---

# Version History

| Version | Description |
|----------|-------------|
| v0.1 | Initial architecture and project setup |

---

# Repository Structure

This structure will expand as the course progresses.

```
openmanus/
│
├── docs/
├── src/
├── assets/
├── README.md
├── package.json
└── .gitignore
```

---

# Course Integration

This repository is the practical component of a complete AI Engineering course.

Each completed module introduces new concepts and extends this project with production-quality implementations.

Theory always comes before implementation.

---

# Long-Term Goal

By the end of this journey, OpenManus should demonstrate the core architectural patterns used by modern AI applications, including:

- ChatGPT
- Claude Desktop
- Cursor
- Manus
- OpenHands

The emphasis is on understanding *why* these systems are designed the way they are and applying those principles to build a maintainable, extensible, real-world AI agent.

---

## License

This project is licensed under the MIT License.