# Architecture & Tech Stack

## Overview

Sentinel Detection Learning Platform is an AI-powered tutor for Detection Engineers. It has three independent modules built on a shared backend and database.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, SQLAlchemy (async), Pydantic v2 |
| Database | Supabase PostgreSQL + pgvector |
| AI | OpenAI gpt-4o, text-embedding-3-small |
| Agent Framework | LangGraph, LangChain |
| MCP | Microsoft Learn MCP (`https://learn.microsoft.com/api/mcp`) |
| Deployment | Vercel (frontend), AWS EC2 t2.micro (backend) |

---

## System Architecture

```
Browser (Next.js)
      ↓
FastAPI Backend
      ↓
  ┌───────────────────────────────┐
  │         AI Layer              │
  │  LangGraph Agents             │
  │  + Microsoft Learn MCP Tools  │
  │  + OpenAI gpt-4o              │
  └───────────────────────────────┘
      ↓
  ┌──────────────┬────────────────┐
  │ PostgreSQL   │   pgvector     │
  │ (use cases,  │ (learning      │
  │  sessions,   │  memory RAG)   │
  │  evals)      │                │
  └──────────────┴────────────────┘
```

---

## The Three Modules

### Module 1 — Add Use Case

User pastes a Sentinel analytics rule (alert name, description, KQL). The enrichment agent analyzes it and generates structured learning content.

**Enrichment Agent flow:**

```
User submits KQL rule
        ↓
LangGraph ReAct Agent starts
        ↓
Agent reads KQL → identifies tables and operators
        ↓
Calls microsoft_docs_search("SigninLogs Sentinel table")
Calls microsoft_docs_search("KQL summarize operator")
Calls microsoft_docs_search("brute force detection Sentinel")
        ↓ (repeats tool calls as needed)
Agent produces structured JSON enrichment grounded in real docs
        ↓
Stored in PostgreSQL
```

Output includes: detection purpose, KQL explanation, investigation steps, investigation queries, entity mapping, benign/malicious indicators, classification guidance, tuning suggestions, Microsoft Learn recommendations.

---

### Module 2 — Use Case Library

Browse, search, and filter all enriched use cases. Standard PostgreSQL queries — no AI involved at read time.

Filters: severity, category, difficulty, tags, platform, free-text search.

Detail page shows all enrichment content across 5 tabs: Overview, KQL, Investigation, Knowledge, Learning.

---

### Module 3 — Detection Lab

Users practice writing Sentinel KQL. Each session is personalized based on past performance.

**Challenge generation flow:**

```
User requests challenge (difficulty: Easy/Medium/Hard)
        ↓
RAG: retrieve user's 8 most relevant past sessions from pgvector
        ↓
Weakness analysis: LLM reads past summaries → identifies weak/strong concepts
        ↓
Challenge generator: LLM creates scenario + objectives + hints
        targeted at the student's weak areas
        ↓
Challenge presented to user
```

**Evaluation flow:**

```
User submits KQL
        ↓
LangGraph ReAct Agent starts
        ↓
Agent compares submission to reference KQL
        ↓
Identifies concepts the student missed or got wrong
        ↓
Calls microsoft_docs_search for each weak concept
        → finds real Microsoft Learn modules with real URLs
        ↓
Returns structured evaluation: scores, strengths, weaknesses,
        suggested improvements, reference solution, learn modules
        ↓
Evaluation stored in PostgreSQL
        ↓
Learning summary embedded (text-embedding-3-small) → stored in pgvector
        ↓
Used by RAG in the next challenge request ← closes the loop
```

---

## AI Concepts

### LangChain vs LangGraph

**LangChain** provides building blocks: LLM wrappers, prompt templates, output parsers. Good for fixed pipelines (`prompt → LLM → parse`).

**LangGraph** builds agents: systems where the LLM decides what to do next. Uses a ReAct loop:

```
Thought → Action (tool call) → Observation (result) → Thought → ...
```

This project uses `create_react_agent(llm, tools)` from LangGraph for the enrichment agent and evaluator — both need to decide which tools to call based on what they find. The challenge generator uses plain LangChain (no tool calling needed).

### MCP (Model Context Protocol)

Open standard from Anthropic for connecting AI agents to external data sources. Microsoft Learn publishes an MCP server at `https://learn.microsoft.com/api/mcp` with three tools:

- `microsoft_docs_search` — semantic search across all MS Learn docs
- `microsoft_docs_fetch` — fetch a specific article by URL
- `microsoft_code_sample_search` — search code samples

`langchain-mcp-adapters` translates these into LangChain `BaseTool` objects that LangGraph can call during its reasoning loop. No authentication required.

### RAG (Retrieval-Augmented Generation)

Before calling the LLM, retrieve relevant context from a vector store and include it in the prompt.

This project uses pgvector (PostgreSQL extension) only for **learning memory** — not for the use case library. After each practice session, a learning summary is embedded with `text-embedding-3-small` and stored. The next challenge request retrieves the most similar past summaries via cosine similarity, giving the LLM context about the user's history.

The use case library uses plain SQL (`WHERE severity = 'High'`) because it's structured, filterable data. Vector search would add complexity with no benefit there.

### Structured Outputs

All AI outputs are JSON. System prompts instruct agents to produce a specific schema in their final message. After the agent finishes, `_extract_json()` pulls the JSON block out of the response. That JSON is then validated by Pydantic schemas before touching the database.

---

## Database Schema

```
users
use_cases          ← enriched use cases (JSONB for flexible AI fields)
  └── tags
  └── investigation_steps
  └── investigation_queries
practice_challenges
practice_sessions
evaluations
practice_memory    ← pgvector embeddings (RAG)
```

Key design decisions:
- AI-generated fields (entity mapping, indicators, etc.) stored as `JSONB` for schema flexibility
- `pgvector` used only for `practice_memory` — not for use cases
- Async SQLAlchemy throughout for non-blocking I/O

---

## The Learning Loop (Whiteboard Summary)

```
User submits KQL
      ↓
Evaluator Agent (LangGraph + MCP)
  → scores the KQL
  → searches MS Learn for missed concepts
  → returns structured evaluation
      ↓
Evaluation stored in PostgreSQL
      ↓
Learning summary embedded → stored in pgvector
      ↓
Next challenge request
      ↓
RAG retrieves past summaries
      ↓
Weakness analysis (LLM)
      ↓
Personalized challenge generated
      ↓
User practices again  ← loop
```
