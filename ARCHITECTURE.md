# AI Architecture — Sentinel Detection Learning Platform

Three AI workflows · Two LangGraph StateGraphs · One ReAct agent · pgvector memory

---

## Workflow 1 — AI Enrichment

**Triggered by:** `POST /api/use-cases/`

When a detection use case is saved, enrichment runs as a FastAPI background task so the HTTP response returns immediately.

```
UseCase saved to DB
    ↓
gpt-4o-mini · ainvoke()          temp=0.2, json_object mode
    ↓
microsoft_docs_search (MCP)      direct tool call, asyncio.create_task() fire-and-forget
```

**Produces:** `detection_purpose`, `investigation_steps`, `kql_explanation`, `tables_used`, `entity_mapping`, tuning notes, Microsoft Learn module URLs.

**Why these choices:**

- **gpt-4o-mini, not gpt-4o** — enrichment is structured extraction, not complex reasoning. Significantly cheaper; runs on every use-case creation.
- **FastAPI BackgroundTasks** — enrichment takes 10–30 s. Blocking the HTTP request would make the UI feel broken.
- **MCP called directly, not through an agent** — there is no decision about whether to search. It always runs after enrichment, using the extracted `kql_operators_to_study` terms. A ReAct loop adds latency for no benefit.
- **Not in LangGraph** — single LLM call followed by a single tool call. No shared intermediate state, no routing needed. StateGraph would add complexity with zero return here.

---

## Workflow 2 — Challenge Generation

**Triggered by:** `POST /api/practice/challenge`

**Framework:** LangGraph `StateGraph` — two nodes sharing `ChallengeState` TypedDict.

```
ChallengeState: { difficulty, user_id, use_case_context, weakness_profile, challenge_data }

[rag_retriever_node]
    pgvector cosine search              direct retrieve_relevant_memories() call, top_k=8
    gpt-4o · ainvoke(), temp=0.1        synthesises weakness profile from past sessions
    → writes weakness_profile into shared state
    ↓
[challenge_generator_node]
    reads weakness_profile from state
    gpt-4o · ainvoke(), temp=0.7        generates KQL practice scenario
    → persists PracticeChallenge to DB
    ↓
   END
```

Falls back to a default profile if `user_id` is absent or no prior sessions exist.

**Why these choices:**

- **LangGraph StateGraph** — node 1 produces a `weakness_profile` that node 2 consumes. Typed state makes the handoff explicit and compile-time validated. Pure Python function chains have no equivalent mechanism for shared intermediate state.
- **pgvector direct call, not an agent** — retrieval always follows the same query template. Wrapping it in a ReAct loop forces the LLM to "decide" to do something it always does — wasted tokens and an extra reasoning step.
- **Two separate LLM calls** — weakness analysis (temp=0.1, analytical) and challenge generation (temp=0.7, creative) are different tasks with opposite temperature needs. Splitting lets each be tuned independently.
- **gpt-4o for both** — challenge generation requires reasoning about KQL concepts and producing valid, educational scenarios.

---

## Workflow 3 — KQL Evaluation

**Triggered by:** `POST /api/practice/submit`

**Framework:** LangGraph `StateGraph` — two nodes sharing `EvaluationState` TypedDict.

```
EvaluationState: { challenge, submitted_kql, user_id, session_id, evaluation_id, evaluation_data }

[kql_evaluator_node]   ← the only ReAct agent in the system
    create_react_agent(gpt-4o, [microsoft_docs_search], recursion_limit=12)
    ReAct loop:
        Reason:   what is wrong with this specific KQL?
        Act:      search("KQL summarize operator Sentinel")   ← query derived from mistakes
        Observe:  read doc content and real Learn module URLs
        Repeat until confident
    → scores across 5 dimensions (detection logic, query structure, entity mapping,
                                   time window, performance)
    → persists PracticeSession + Evaluation records to DB
    ↓
[memory_writer_node]
    text-embedding-3-small              embeds learning_summary (1536-dim)
    pgvector insert                     stores for future RAG retrieval
    skipped entirely if no user_id
    ↓
   END
```

**Why these choices:**

- **ReAct agent — here and only here** — the MCP search query cannot be predetermined. A student who misses time-windowing needs different docs than one who uses the wrong table. The agent must reason about the specific KQL mistakes first, then decide what to search. That step-dependency is exactly what the ReAct loop exists for.
- **recursion_limit=12** — typically uses 3–5 steps (one evaluation pass + 1–3 doc searches). The cap prevents runaway loops on adversarial or malformed input.
- **memory_writer as a separate node** — single responsibility. Also creates a clean hook for future conditional routing; the `user_id` guard is already written as a conditional, not dead code.
- **gpt-4o, not gpt-4o-mini** — KQL evaluation requires deep reasoning about query correctness and dynamic tool-use decisions. The stronger model is justified here.

---

## Framework & Tool Choices

| Choice | Reason |
|---|---|
| **LangGraph StateGraph** | Typed shared state between nodes, graph validation at compile time, conditional edges when needed. Pure Python sequential calls have no mechanism for shared intermediate state without mutable globals. |
| **LangChain** | `create_react_agent`, tool binding, `SystemMessage`/`HumanMessage`, and the MCP adapter are built in. Avoids reimplementing the tool-calling protocol and ReAct loop over the raw OpenAI SDK. |
| **langchain-mcp-adapters** | Microsoft's public MCP server at `learn.microsoft.com/api/mcp` exposes a tool schema server-side. The adapter fetches it at runtime — no hardcoded URL construction, no custom parser. |
| **pgvector** | Already using PostgreSQL for all relational data. One database, one connection pool, one ORM. For a learning platform (hundreds to thousands of vectors) cosine similarity via `<->` is adequate. No external service dependency. |
| **FastAPI + SQLAlchemy 2 async** | All LLM calls are `await ainvoke()`. A synchronous ORM in an async route handler would block the event loop during DB reads while the LLM responds. |
| **text-embedding-3-small** | 1536-dim, cost-effective, strong semantic quality for English technical text. Cosine similarity retrieves semantically similar past sessions without exact keyword matches. |
| **gpt-4o-mini for enrichment** | Structured extraction task, lower creativity required, runs on every use-case creation — cost matters here. |
| **gpt-4o for evaluation/challenge** | Complex reasoning about KQL correctness, concept relationships, and dynamic tool-use decisions. |

---

## Constraints & Deferred Work

**No supervisor agent** — challenge generation and KQL evaluation are independent HTTP requests at different points in time. A supervisor routing between them would add latency for a decision that HTTP routes already handle. Supervisors justify themselves only when multiple real agents operate in parallel on the same task.

**No conditional edges** — both graphs are currently linear. The StateGraph structure makes adding them straightforward. The `user_id` guard in `memory_writer_node` is already written as a conditional and will become a proper edge when routing logic warrants it.

**pgvector RAG dormant** — `user_id` is always `None` until Clerk auth is wired up. The memory pipeline is correctly designed — it runs and stores. It is dormant, not broken.

**Graph compiled per-request** — graphs are rebuilt on every HTTP request to close over `db` and `user_id`. The idiomatic fix is `RunnableConfig` with configurable fields. Compilation is fast enough that this is not a production concern yet.

**`_result` side channel has no error guard** — if a node fails before writing to `_result`, the outer function raises `KeyError`. Fix is a `try/except` around `graph.ainvoke()` with a meaningful error message — not yet implemented.
