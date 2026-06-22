-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id    TEXT UNIQUE NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    display_name TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USE CASES
-- ============================================================
CREATE TABLE IF NOT EXISTS use_cases (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by              UUID REFERENCES users(id) ON DELETE SET NULL,

    -- User-supplied fields
    title                   TEXT NOT NULL,
    alert_name              TEXT NOT NULL,
    alert_description       TEXT,
    analytics_rule_name     TEXT,
    analytics_rule_kql      TEXT NOT NULL,
    investigation_notes     TEXT,
    response_notes          TEXT,

    -- Metadata
    category                TEXT,
    severity                TEXT CHECK (severity IN ('Informational', 'Low', 'Medium', 'High')),
    platform                TEXT DEFAULT 'Microsoft Sentinel',
    difficulty              TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),

    -- AI-generated overview
    detection_purpose       TEXT,
    detection_logic         TEXT,
    typical_attack_scenarios TEXT,

    -- AI-generated KQL explanation
    kql_explanation         TEXT,

    -- AI-generated structured fields (JSONB for flexibility)
    entity_mapping          JSONB DEFAULT '[]',
    tables_used             JSONB DEFAULT '[]',
    important_columns       JSONB DEFAULT '[]',
    benign_indicators       JSONB DEFAULT '[]',
    malicious_indicators    JSONB DEFAULT '[]',
    classification_guidance TEXT,
    rule_tuning_suggestions JSONB DEFAULT '[]',
    mitre_mapping           JSONB DEFAULT '[]',

    -- AI-generated learning content
    learn_recommendations   JSONB DEFAULT '[]',
    related_concepts        JSONB DEFAULT '[]',
    kql_operators_to_study  JSONB DEFAULT '[]',

    -- Enrichment state
    enrichment_status       TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'processing', 'completed', 'failed')),
    enrichment_error        TEXT,
    enriched_at             TIMESTAMPTZ,

    is_public               BOOLEAN DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
    id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name    TEXT UNIQUE NOT NULL,
    color   TEXT DEFAULT '#6366f1'
);

CREATE TABLE IF NOT EXISTS use_case_tags (
    use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
    tag_id      UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (use_case_id, tag_id)
);

-- ============================================================
-- INVESTIGATION STEPS
-- ============================================================
CREATE TABLE IF NOT EXISTS investigation_steps (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    use_case_id UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
    step_order  INT NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    pivot_type  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVESTIGATION QUERIES
-- ============================================================
CREATE TABLE IF NOT EXISTS investigation_queries (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    use_case_id UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    kql         TEXT NOT NULL,
    query_order INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRACTICE CHALLENGES
-- ============================================================
CREATE TABLE IF NOT EXISTS practice_challenges (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_use_case_id  UUID REFERENCES use_cases(id) ON DELETE SET NULL,
    source_type         TEXT NOT NULL CHECK (source_type IN ('use_case', 'synthetic')),

    difficulty          TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    scenario            TEXT NOT NULL,
    objectives          JSONB NOT NULL DEFAULT '[]',
    available_tables    JSONB NOT NULL DEFAULT '[]',
    expected_entities   JSONB NOT NULL DEFAULT '[]',
    hints               JSONB DEFAULT '[]',
    reference_kql       TEXT NOT NULL,
    tags                JSONB DEFAULT '[]',

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRACTICE SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS practice_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    challenge_id    UUID REFERENCES practice_challenges(id) ON DELETE SET NULL,

    difficulty      TEXT NOT NULL,
    submitted_kql   TEXT NOT NULL,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EVALUATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS evaluations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Scores (0-100)
    overall_score           INT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    detection_logic_score   INT CHECK (detection_logic_score BETWEEN 0 AND 100),
    query_structure_score   INT CHECK (query_structure_score BETWEEN 0 AND 100),
    entity_mapping_score    INT CHECK (entity_mapping_score BETWEEN 0 AND 100),
    time_window_score       INT CHECK (time_window_score BETWEEN 0 AND 100),
    performance_score       INT CHECK (performance_score BETWEEN 0 AND 100),

    -- AI feedback (structured)
    strengths               JSONB DEFAULT '[]',
    weaknesses              JSONB DEFAULT '[]',
    missing_logic           JSONB DEFAULT '[]',
    suggested_improvements  JSONB DEFAULT '[]',
    reference_solution      TEXT,
    recommended_concepts    JSONB DEFAULT '[]',
    learn_modules           JSONB DEFAULT '[]',
    learning_summary        TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LEARNING MEMORY (pgvector RAG)
-- ============================================================
CREATE TABLE IF NOT EXISTS practice_memory (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id      UUID REFERENCES practice_sessions(id) ON DELETE SET NULL,
    evaluation_id   UUID REFERENCES evaluations(id) ON DELETE SET NULL,

    learning_summary TEXT NOT NULL,
    weak_concepts    JSONB DEFAULT '[]',
    strong_concepts  JSONB DEFAULT '[]',
    overall_score    INT,
    difficulty       TEXT,

    embedding        vector(1536),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_use_cases_severity   ON use_cases(severity);
CREATE INDEX IF NOT EXISTS idx_use_cases_category   ON use_cases(category);
CREATE INDEX IF NOT EXISTS idx_use_cases_difficulty ON use_cases(difficulty);
CREATE INDEX IF NOT EXISTS idx_use_cases_status     ON use_cases(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_use_cases_created_by ON use_cases(created_by);
CREATE INDEX IF NOT EXISTS idx_use_cases_public     ON use_cases(is_public);

CREATE INDEX IF NOT EXISTS idx_inv_steps_use_case   ON investigation_steps(use_case_id);
CREATE INDEX IF NOT EXISTS idx_inv_queries_use_case ON investigation_queries(use_case_id);

CREATE INDEX IF NOT EXISTS idx_sessions_user        ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_user     ON evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_session  ON evaluations(session_id);

CREATE INDEX IF NOT EXISTS idx_memory_user          ON practice_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_embedding     ON practice_memory USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_use_cases_updated_at
    BEFORE UPDATE ON use_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
