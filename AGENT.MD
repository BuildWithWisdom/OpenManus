# AGENTS.md

# AI Engineering Course Project

Welcome to this repository.

This repository is **not a typical software project**.

It is the practical component of a complete AI Engineering course.

The primary goal is **learning AI Engineering**, not shipping software as quickly as possible.

Every architectural decision should prioritize education, clarity, and maintainability over speed.

---

# Your Role

You are the software engineer responsible for implementing the concepts taught during the course.

You are **not** responsible for deciding what to build next.

The course determines the roadmap.

You implement the current module only.

---

# Development Philosophy

This project grows alongside the AI Engineering course.

Each course module introduces new concepts.

Only after the concepts are fully understood should they be implemented.

Do not add features from future modules.

Do not "improve" the architecture with concepts that have not yet been covered in the course.

The educational progression is more important than technical completeness.

---

# Course Workflow

Every module follows this sequence:

1. Learn the theory.
2. Study industry implementations.
3. Study the ecosystem and tools.
4. Design the architecture.
5. Implement the concepts in this repository.
6. Review and refactor where appropriate.

Implementation is always the final step.

---

# Engineering Standards

When writing code:

- Prefer readability over cleverness.
- Prefer maintainability over optimization.
- Keep functions focused and small.
- Keep modules cohesive.
- Avoid unnecessary abstractions.
- Explain non-obvious decisions with comments.
- Follow clean architecture where appropriate.
- Refactor instead of patching when the design changes.

---

# AI Collaboration Rules

When assisting with development:

- Respect the current module boundaries.
- Never implement concepts from future modules unless explicitly instructed.
- Suggest improvements, but explain why they are beneficial.
- If multiple approaches exist, explain the trade-offs before implementing one.
- Ask for confirmation before making major architectural changes.
- Keep commits aligned with the current course module.
- I will be the one to determine when we are done with a module project not you. 
- Your concentration should be the module's project not the whole course. 

Act like a senior engineer working with me your colleague,  rather than simply generating code.

---

# Git Branching & Commit Conventions

To maintain strict organization and prevent mixing features across branches:

- **Always Create a Dedicated Branch**: Before starting any major feature, bug fix, or refactor, a dedicated Git branch must be created.
- **Standard Branch Naming Convention**: Use the format `<type>/<module-id>-<short-description>`:
  - `feature/<module-id>-<description>`: For new module features or UI implementations (e.g., `feature/m1-chat-interface`, `feature/m1-llm-connection`).
  - `fix/<module-id>-<description>`: For bug fixes or layout repairs (e.g., `fix/m1-sidebar-width`).
  - `refactor/<module-id>-<description>`: For code cleanups and architectural updates (e.g., `refactor/m1-ipc-main-bridge`).
  - `docs/<description>`: For documentation updates (e.g., `docs/update-agent-rules`).
- **One Feature Per Branch**: Never commit unrelated module features or bug fixes onto the same branch to keep the codebase structured and history clean.

---

# Project Architecture

This project is expected to evolve.

Do not assume the initial architecture is final.

As the course progresses, components may be extracted, refactored, or redesigned.

Architecture should evolve naturally as new engineering concepts are introduced.

---

# Long-Term Vision

The long-term objective is to build an open-source desktop AI agent inspired by Manus.

This is **not** intended to be a feature-for-feature clone.

The project exists to demonstrate sound AI Engineering principles.

Every major feature should correspond to concepts learned in the course.

---

# Definition of Success

Success is **not** measured by how many features are implemented.

Success is measured by whether the implementation clearly demonstrates the engineering concepts taught in the current module.

If there is ever a conflict between educational clarity and adding more functionality, educational clarity always takes precedence.

---

# Remember

This repository is a classroom, a laboratory, and an open-source project at the same time.

Think like an engineer.

Teach through the code.

Build one module at a time.


# Course Modules

## Module 0 — Orientation

### Objective

Understand what AI Engineering is, how modern AI applications are built, and establish the foundation for the rest of the course.

### Lessons

- What is AI?
- AI vs Machine Learning
- Deep Learning
- Large Language Models (LLMs)
- AI Engineers vs ML Engineers vs Software Engineers
- The modern AI application stack
- How AI products are built
- Overview of the course project

### Tools

- OpenAI
- Anthropic
- Google AI Studio
- VS Code
- Git
- GitHub

### Project

- Create the repository.
- Plan the architecture.
- Decide the technology stack.
- Define the long-term vision.

---

## Module 1 — LLM Fundamentals

### Lessons

- What is an LLM?
- Tokens
- Context Window
- Transformers (intuitive)
- Training vs Inference
- Temperature
- Top-p
- Hallucinations
- Cost of inference

### Project

- Connect the application to an LLM.
- Build a basic chat interface.

---

## Module 2 — Prompt Engineering

### Lessons

- System prompts
- User prompts
- Developer prompts
- Prompt patterns
- XML prompting
- Markdown prompting
- Prompt chaining
- Prompt debugging
- Prompt injection

### Project

- Design the agent's personality.
- Improve responses using prompt engineering.

---

## Module 3 — Structured Outputs

### Lessons

- JSON
- Schemas
- Validation
- Function calling
- Tool calling
- Structured generation
- Error handling

### Project

- Add structured outputs.
- Make responses reliable.

---

## Module 4 — AI APIs

### Lessons

- AI APIs
- Streaming
- Responses API
- Files
- Images
- Audio
- Embeddings overview
- API costs
- Rate limits

### Project

- Support AI providers.
- Add streaming.

---

## Module 5 — Embeddings & Vectorization

### Lessons

- Why computers don't understand language
- Vectors
- Embeddings
- Embedding models
- Vectorization
- Similarity search
- Cosine similarity
- Euclidean distance
- Dot product (intuition)
- Semantic search
- Vector databases
- Chunking (introduction)

### Tools

- OpenAI Embeddings
- Voyage AI
- Chroma
- Qdrant
- Pinecone
- Weaviate
- pgvector

### Project

- Generate embeddings.
- Implement semantic search.

---

## Module 6 — Memory

### Lessons

- Why AI needs memory
- Stateless vs Stateful systems
- Memory architecture
  - Working Memory
  - Short-Term Memory
  - Long-Term Memory
  - Persistent Memory
- Cognitive memory
  - Semantic Memory
  - Episodic Memory
  - Procedural Memory
- Memory retrieval
- Memory storage
- Memory lifecycle
- Memory summarization
- Memory compression
- Memory decay
- Memory evaluation
- Memory frameworks
- Industry implementations
- Trade-offs

### Tools

- Mem0
- Letta
- LangMem
- Zep
- Graphiti
- PostgreSQL
- Redis

### Project

- Design the memory architecture.
- Implement user and project memory.

---

## Module 7 — Retrieval-Augmented Generation (RAG)

### Lessons

- What is RAG?
- Why RAG exists
- Chunking
- Retrieval
- Re-ranking
- Context injection
- Hybrid search
- RAG pipelines
- Evaluation
- Common mistakes

### Tools

- LlamaIndex
- LangChain
- Chroma
- Qdrant
- Pinecone

### Project

- Chat with documents.
- Build a knowledge base.

---

## Module 8 — Tool Calling

### Lessons

- What are tools?
- Function calling
- Tool execution
- Permissions
- Error handling
- Tool orchestration

### Project

- Add filesystem and web tools.

---

## Module 9 — Model Context Protocol (MCP)

### Lessons

- Why MCP exists
- MCP architecture
- Clients
- Servers
- Tools
- Resources
- Prompts
- Authentication
- Transport
- Building an MCP server

### Project

- Connect to an MCP server.
- Extend the agent with external capabilities.

---

## Module 10 — Agent Engineering

### Lessons

- What is an AI agent?
- Agent loop
- Planning
- Reflection
- Retry
- Self-correction
- Task decomposition
- Autonomous execution

### Project

- Build the agent loop.
- Add planning and execution.

---

## Module 11 — Agent Harness

### Lessons

- What is a harness?
- Runtime
- Threads
- Turns
- Items
- Skills
- Configuration
- Context management
- Permissions
- Sandboxing
- Event systems
- Logging

### Project

- Refactor into a proper agent runtime.

---

## Module 12 — Multi-Agent Systems

### Lessons

- Planner
- Researcher
- Executor
- Reviewer
- Critic
- Delegation
- Coordination
- Communication
- Swarm architectures

### Project

- Add specialized collaborating agents.

---

## Module 13 — Desktop Application

### Lessons

- Electron vs Tauri // We are already using Electron.
- IPC
- Background processes
- Local models
- Packaging
- Updates
- Security

### Project

- Package the agent as a desktop application.

---

## Module 14 — Production AI

### Lessons

- Logging
- Monitoring
- Evaluation
- Tracing
- Cost optimization
- Reliability
- Security
- Deployment
- Prompt versioning

### Project

- Prepare the application for production.

