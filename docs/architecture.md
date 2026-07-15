# Sentinel Detection Learning Platform — Architecture

## 1. What this app does

Give it a Sentinel analytics rule (KQL) and optional investigation notes. It:

1. **Enriches the detection with AI** — an LLM analyzes the rule and produces structured learning content: detection purpose, KQL explanation, tables and columns used, entity mapping, investigation steps, classification guidance, rule tuning suggestions, and Microsoft Learn recommendations.
2. **Preserves analyst-provided investigation steps** — if you supply your own investigation workflow, the AI formats and enhances those steps with KQL queries rather than generating generic ones from scratch.
3. **Fetches real Microsoft Learn documentation** — a background MCP task searches the official Microsoft Learn API for learning modules relevant to the detection topic, merging them with the LLM's own suggestions.
4. **Stores enriched use cases in a personal library** — each use case is persisted with its full enrichment output and can be edited, re-enriched, or deleted.
5. **Generates personalized KQL practice challenges** — a challenge generator builds Sentinel detection scenarios targeting your known weak areas; a ReAct evaluator scores your submitted KQL against a rubric and recommends what to study next.
6. **Remembers your learning history** — practice session outcomes are embedded and stored in pgvector so future challenge generation can target your specific weaknesses (RAG over your own history — dormant until auth is wired up).

---

## 2. Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Backend framework | **FastAPI** + **uvicorn** | Async-first, clean OpenAPI docs out of the box |
| ORM / DB driver | **SQLAlchemy 2 async** + `asyncpg` | Non-blocking DB access that composes naturally with FastAPI's event loop |
| Database | **PostgreSQL** + **pgvector** | One database for relational use-case data, JSONB enrichment blobs, and vector search for learning memory |
| LLM orchestration | **LangChain** (`langchain-openai`) | Plain `llm.ainvoke()` for enrichment; `create_react_agent` (LangGraph) for the KQL evaluator only |
| LLMs | **OpenAI** — `gpt-4o-mini` (enrichment) · `gpt-4o` (challenge + evaluation) | Enrichment favors speed/cost; evaluation favors quality |
| Embeddings | **OpenAI** `text-embedding-3-small` (1536-dim) | Reuses the same `OPENAI_API_KEY`; no separate provider |
| MCP (docs search) | **Microsoft Learn MCP** via `langchain-mcp-adapters` | Official `learn.microsoft.com/api/mcp` endpoint for real documentation URLs |
| Task dispatch | `asyncio.create_task` | MCP fetch runs as a background task after enrichment completes; avoids blocking the response |
| Cache | **Redis** (configured, not yet used in routes) | Reserved for rate limiting and future session caching |
| Frontend framework | **Next.js** (App Router, TypeScript, Tailwind CSS) | Server components for data fetching, client components for interactive editors |
| UI components | **shadcn/ui** + **Radix UI** | Accessible, unstyled-base components themed to dark mode |
| Code editor | **Monaco Editor** (`@monaco-editor/react`) | VS Code-grade KQL editing with custom Sentinel autocomplete |
| Notifications | **Sonner** | Toast layer for async operation feedback |
| Settings | **pydantic-settings** | `.env` file → typed `Settings` object, cached with `@lru_cache` |

---

## 3. System architecture

```
┌─────────────────────┐        HTTP (REST)        ┌──────────────────────────────┐
│  Next.js (3000)      │ ────────────────────────▶ │  FastAPI (8000)              │
│  App Router          │ ◀──────────────────────── │  app/main.py                 │
│  server components   │       JSON responses       │  routers/use_cases.py        │
│  + client components │                            │  routers/practice.py         │
└─────────────────────┘                            └──────────┬───────────────────┘
                                                               │
                              ┌────────────────────────────────┼────────────────────────┐
                              │                                │                        │
                              ▼                                ▼                        ▼
                   ┌──────────────────┐           ┌───────────────────┐    ┌───────────────────┐
                   │  ai_enrichment   │           │ challenge_generator│    │  kql_evaluator    │
                   │  services/       │           │ services/          │    │  services/        │
                   │                  │           │                    │    │                   │
                   │  LLM call        │           │  LLM call          │    │  ReAct agent      │
                   │  (gpt-4o-mini)   │           │  (gpt-4o)          │    │  (gpt-4o)         │
                   │       │          │           └─────────┬──────────┘    └────────┬──────────┘
                   │       ▼          │                     │                        │
                   │  asyncio.        │                     ▼                        ▼
                   │  create_task ────┼──▶ _fetch_and_store_learn_modules   learning_memory.py
                   │                  │        │                              (pgvector store)
                   └──────────────────┘        ▼
                                        MCP: learn.microsoft.com/api/mcp
                                        (microsoft_docs_search tool)
                                               │
                                               ▼
                                        PostgreSQL + pgvector
                                        (use_cases, investigation_steps,
                                         practice_sessions, evaluations,
                                         practice_memory)
```

### Repository layout

```
backend/
  app/
    config.py                 # pydantic-settings: Settings, get_settings()
    database.py               # async engine + AsyncSessionLocal + Base
    main.py                   # FastAPI app, CORS, router registration
    models/
      use_case.py             # UseCase, InvestigationStep, Tag, UseCaseTag
      practice.py             # PracticeSession, Evaluation
      memory.py               # PracticeMemory (pgvector Vector(1536) column)
      user.py                 # User (placeholder — Clerk auth not yet wired)
    schemas/
      use_case.py             # UseCaseCreate/Update/Out, InvestigationStepOut, UseCaseDetail
      practice.py             # ChallengeOut, KQLSubmission, EvaluationOut
    routers/
      use_cases.py            # CRUD + POST /enrich
      practice.py             # POST /challenge, /submit, /hint
      health.py               # GET /health
    services/
      ai_enrichment.py        # enrich_use_case(), _run_enrichment(), _apply_enrichment()
      mcp_client.py           # MultiServerMCPClient → get_ms_learn_tools()
      challenge_generator.py  # generate_challenge() — weakness-aware LLM call
      kql_evaluator.py        # evaluate_kql() — ReAct agent, stores learning memory
      learning_memory.py      # store_learning_memory(), retrieve_similar_memories()
    core/
      prompts.py              # all system + human prompt templates

frontend/
  src/
    app/
      page.tsx                # landing / dashboard
      add-use-case/page.tsx   # use case creation form
      library/page.tsx        # use case grid with search + filter
      library/[id]/page.tsx   # use case detail (4 tabs: Overview, KQL, Investigation, Learning)
      library/[id]/edit/      # edit use case form
      lab/page.tsx            # KQL practice lab
    components/
      add-use-case/
        AddUseCaseForm.tsx    # title + KQL editor + investigation notes textarea
      library/
        UseCaseCard.tsx       # grid card with hover edit/delete actions
        EnrichmentPoller.tsx  # polls router.refresh() every 3s while status=processing
        DeleteButton.tsx      # confirm-before-delete client component
        EditUseCaseForm.tsx   # pre-populated edit form, triggers re-enrichment on save
      lab/
        DetectionLab.tsx      # full practice lab: setup → challenge → results
        ScoreRing.tsx         # circular score display
        DifficultySelector.tsx
    lib/
      api.ts                  # typed API client (request(), api.useCases.*, api.practice.*)
      kql-completions.ts      # Monaco KQL autocomplete for Sentinel tables/functions
    types/
      index.ts                # TypeScript mirrors of all backend response shapes

docs/
  architecture.md             # this file
  how-to-run.md
```

---

## 4. Enrichment pipeline

```
POST /api/use-cases/          (create)  ──▶  use case saved (status=pending)
  or
PATCH /api/use-cases/{id}     (edit, content changed)
  or
POST  /api/use-cases/{id}/enrich        (manual trigger)
          │
          ▼
  asyncio.create_task(enrich_use_case(id))       ← non-blocking, returns immediately
          │
          ▼  [background]
  status = "processing"

  ┌─ Phase 1: LLM enrichment (~10s) ─────────────────────────────┐
  │                                                               │
  │  ENRICHMENT_AGENT_SYSTEM + ENRICHMENT_AGENT_HUMAN            │
  │  → gpt-4o-mini.ainvoke([system, human])                      │
  │                                                               │
  │  Input:  title, KQL rule, investigation_notes                 │
  │  Output: detection_purpose, detection_logic, kql_explanation, │
  │          tables_used, important_columns, entity_mapping,      │
  │          benign/malicious indicators, classification_guidance, │
  │          rule_tuning_suggestions, investigation_steps,        │
  │          kql_functions, investigation_functions,              │
  │          related_concepts, learn_modules, difficulty, category│
  └───────────────────────────────────────────────────────────────┘
          │
          ▼
  _apply_enrichment() — writes all fields to DB
  status = "completed"
          │
          ▼  [second background task]
  ┌─ Phase 2: MCP docs fetch (~15–60s, best-effort) ─────────────┐
  │                                                               │
  │  asyncio.wait_for(get_ms_learn_tools(), timeout=10)          │
  │  → microsoft_docs_search.ainvoke({query})  × up to 3 terms   │
  │  → _parse_mcp_result() filters navigation/release-note URLs  │
  │  → MERGE with LLM learn_modules (deduplicate by URL)         │
  │  → update uc.learn_recommendations                           │
  │  Fails silently — enrichment is already complete             │
  └───────────────────────────────────────────────────────────────┘
```

**Investigation steps — two-path rule:**
- Notes provided → LLM structures the analyst's notes into steps (format + add KQL, preserve wording and order)
- No notes → LLM generates steps from the detection scenario

**Re-enrichment on edit:** the PATCH route sets `content_changed=True` only when `analytics_rule_kql` or `raw_info` actually changed. Title-only edits do not trigger re-enrichment.

---

## 5. AI enrichment — prompt design

All prompts live in `core/prompts.py`. The enrichment is a single plain LLM call (no tools, no agent loop) — fast and cheap.

**`ENRICHMENT_AGENT_SYSTEM`** instructs the model to act as a Senior Detection Engineer and return a single JSON object with the full enrichment schema. Key constraint: the `investigation_steps` field follows the two-path rule (§4) — explicitly stated as a `CRITICAL` block before the schema.

**`ENRICHMENT_AGENT_HUMAN`** provides: `alert_name`, `kql` (or "Not provided"), `investigation_notes` (labeled as "analyst-provided — use ONLY these as investigation_steps if present"), `response_notes`.

**`tables_used` and `important_columns`** each carry a `context` field (`"detection"` | `"investigation"` | `"both"`) that the frontend uses to filter them into the correct sections of the Learning tab.

**MCP tool:** `microsoft_docs_search` from `learn.microsoft.com/api/mcp` via `langchain-mcp-adapters` `MultiServerMCPClient`. Results go through `_parse_mcp_result()` which filters out navigation pages, release notes, copilot plugins, and other unrelated pages via `_MCP_SKIP_PATTERNS` regex before adding them to the library.

---

## 6. Practice lab

```
POST /api/practice/challenge
          │
          ▼
  challenge_generator.py
  → WEAKNESS_ANALYSIS: LLM summarises past session history into weak/strong concepts
  → CHALLENGE_AGENT: LLM generates scenario + objectives + available_tables
                     + expected_entities + hints + reference_kql
  → saved to PracticeSession

POST /api/practice/submit
          │
          ▼
  kql_evaluator.py
  → create_react_agent (gpt-4o) + microsoft_docs_search MCP tool
  → agent evaluates student KQL vs. reference, calls MCP for relevant docs
  → structured JSON: scores (overall, detection_logic, query_structure,
                     entity_mapping, time_window, performance),
                     strengths, weaknesses, suggested_improvements,
                     reference_solution, recommended_concepts, learn_modules,
                     learning_summary
  → saved to Evaluation
  → if user_id set: store_learning_memory() embeds learning_summary → pgvector

POST /api/practice/hint
  → returns next hint from the challenge's hints array (index-gated)
```

**Challenge generation:** the generator first runs a weakness analysis — it reads past `Evaluation.learning_summary` rows for the user, asks an LLM to identify weak/strong concepts, then passes those into the challenge prompt so the generated scenario deliberately targets weak areas. With no history, it generates a generic scenario at the requested difficulty.

**Evaluator scoring** uses five sub-scores. The `suggested_improvements` and other list fields from the LLM go through a `coerce_to_list` Pydantic field validator in `EvaluationOut` — the LLM occasionally returns a plain string, and the validator normalizes it to a single-element list rather than crashing.

---

## 7. Learning memory (pgvector RAG)

After each practice evaluation, if a `user_id` is set, `store_learning_memory()` embeds `evaluation.learning_summary` using `text-embedding-3-small` (1536-dim) and inserts it into `PracticeMemory` with the associated weak/strong concepts and score.

`retrieve_similar_memories(db, user_id, query, top_k=5)` converts the query to a vector and finds nearest neighbors using pgvector's `<->` (L2 distance) operator:

```sql
ORDER BY embedding <-> '[0.021, -0.003, ...]'::vector
LIMIT 5
```

The retrieved summaries are fed into the challenge generator's weakness analysis so future challenges remain personalized across sessions.

**Current state:** `user_id` is always `None` (Clerk auth not yet wired), so neither `store` nor `retrieve` are called. The vector column exists in the schema and the functions are implemented — the RAG layer is fully built but dormant.

---

## 8. Backend API

`app/main.py`, run with `uvicorn app.main:app --reload` (port 8000). CORS locked to `http://localhost:3000`.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Liveness check |
| `/api/use-cases/` | GET | List use cases (pagination, search, filter by category/difficulty/status/tag) |
| `/api/use-cases/` | POST | Create use case — triggers enrichment background task |
| `/api/use-cases/{id}` | GET | Get full use case detail with investigation steps |
| `/api/use-cases/{id}` | PATCH | Edit title/KQL/notes — re-enriches only on content change |
| `/api/use-cases/{id}` | DELETE | Delete use case (returns 204 No Content) |
| `/api/use-cases/{id}/enrich` | POST | Manual re-enrichment trigger |
| `/api/practice/challenge` | POST | Generate a KQL challenge |
| `/api/practice/challenge/{id}` | GET | Fetch an existing challenge |
| `/api/practice/submit` | POST | Submit KQL for evaluation |
| `/api/practice/hint` | POST | Get next hint for a challenge |

**204 handling:** the frontend's `request()` helper checks `res.status === 204` before calling `res.json()` — DELETE returns no body and `JSON.parse("")` would otherwise throw.

**Cache busting:** Next.js server components cache `fetch()` calls aggressively. After any mutation (create, edit, delete), client components call `router.refresh()` before navigating to force a fresh server-side fetch.

---

## 9. Frontend

Four pages, all under the App Router:

- **`/`** — Dashboard / landing.
- **`/add-use-case`** — `AddUseCaseForm`: title + Monaco KQL editor + investigation notes textarea. On submit, POSTs to `/api/use-cases/` and navigates to the new use case's detail page.
- **`/library`** — `UseCaseCard` grid. Each card has hover-revealed edit (pencil) and delete (trash) icon buttons. Delete shows an in-card confirmation UI. Cards use `flex flex-col` + `mt-auto` on the footer to keep all cards the same height regardless of title length.
- **`/library/[id]`** — Detail page, four tabs:
  - **Overview** — detection purpose, attack scenarios, entity mapping, severity/category badges.
  - **KQL** — syntax-highlighted rule, line-by-line explanation, rule tuning suggestions (only shown when a KQL rule exists).
  - **Investigation** — vertical timeline of steps, each with title, description, embedded KQL query, and pivot type. Final step is "Classify the Alert" with benign (green) and malicious (red) indicator panels.
  - **Learning** — split into Detection Rule section (tables/columns with `context=detection|both`, kql_functions) and Investigation section (tables/columns with `context=investigation|both`, investigation_functions), plus entity mapping, MS Learn modules, related concepts, and practice CTA.
- **`/library/[id]/edit`** — `EditUseCaseForm`: pre-populated from the existing use case, including investigation notes. Saving with changed KQL or notes triggers re-enrichment.
- **`/lab`** — `DetectionLab`: three-phase state machine (`setup → challenge → results`). Results show score rings, strengths/weaknesses, then "Your Attempt" and "Reference Solution" stacked panels for direct comparison.

**`EnrichmentPoller`** is a client component that calls `router.refresh()` every 3 seconds while `enrichment_status === "processing"`, keeping the detail page live without a websocket.

**Monaco KQL autocomplete** (`lib/kql-completions.ts`) registers a custom completion provider for the `kusto` language — Sentinel table names and KQL functions — so the editor has domain-aware suggestions in both the add/edit forms and the practice lab.

---

## 10. What's real vs. pending

| Component | Status |
|-----------|--------|
| Use case CRUD (create, read, update, delete) | Real |
| AI enrichment — LLM call (gpt-4o-mini) | Real |
| Two-path investigation steps (notes → structure; no notes → generate) | Real |
| MCP docs fetch (Microsoft Learn) | Real — runs in background, fails silently if MCP unavailable |
| KQL practice challenge generation | Real |
| KQL evaluation (ReAct agent) | Real |
| Learning memory — pgvector schema + store/retrieve functions | Built, dormant (`user_id` always `None`) |
| Clerk authentication | **Not implemented** — `user_id` is always `None`; RAG, personal challenge history, and public/private use case visibility are all gated on this |
| Seed data / pre-loaded use cases | **Not implemented** — library starts empty |
| Tag management UI | Tags exist in the schema and are returned by the API; no create/assign UI yet |
| MITRE ATT&CK mapping | Schema exists, API accepts it on create; not populated by enrichment |
| Redis (rate limiting, caching) | Configured, not used in any route yet |

---

## 11. Open design questions / known gaps

- **Auth is the unlock for most personalization.** Clerk is the planned provider. Once `user_id` is set, learning memory starts accumulating, challenge generation becomes weakness-targeted across sessions, and the public/private use case flag becomes meaningful.

- **No seed data.** The library starts empty. Pre-loading a set of representative Sentinel detections (brute force, lateral movement, credential dumping, etc.) would make the learning experience immediately useful on first run.

- **MCP reliability.** The Microsoft Learn MCP endpoint is external and occasionally slow. The current approach (60s timeout, silent failure) is correct — enrichment is already complete before the MCP task starts. If MCP becomes unavailable long-term, the LLM's own `learn_modules` suggestions remain as fallback.

- **Re-enrichment on edit always regenerates everything.** There is no field-level diff — changing the title re-enriches the same as changing the KQL rule. A smarter approach would re-run only the parts that depend on what changed.

- **`InvestigationQuery` model is a dead table.** The `investigation_queries` table and relationship still exist in `models/use_case.py` from an earlier design. Investigation KQL is now embedded directly in `InvestigationStep.kql`. The old table can be dropped in a future migration.

- **`_load_use_case` in `routers/use_cases.py`** still has a stale `selectinload(UseCase.investigation_queries)` that loads from the dead table. Harmless but should be cleaned up with the migration.

- **No migration tool configured.** Schema is created via `Base.metadata.create_all()` on startup. As the schema evolves, this needs Alembic to handle production upgrades without dropping tables.
