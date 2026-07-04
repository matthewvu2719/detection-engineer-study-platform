// ── Use Cases ──────────────────────────────────────────────────────────────

export interface Tag {
  id: string
  name: string
  color: string
}

export interface InvestigationStep {
  id: string
  step_order: number
  title: string
  description: string | null
  pivot_type: string | null
}

export interface InvestigationQuery {
  id: string
  title: string
  description: string | null
  kql: string
  query_order: number
}

export interface UseCaseListItem {
  id: string
  title: string
  alert_name: string
  category: string | null
  severity: 'Informational' | 'Low' | 'Medium' | 'High' | null
  platform: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | null
  enrichment_status: 'pending' | 'processing' | 'completed' | 'failed'
  is_public: boolean
  created_at: string
  tags: Tag[]
}

export interface UseCaseDetail extends UseCaseListItem {
  alert_description: string | null
  analytics_rule_name: string | null
  analytics_rule_kql: string | null
  investigation_notes: string | null
  response_notes: string | null

  detection_purpose: string | null
  detection_logic: string | null
  typical_attack_scenarios: string | null
  kql_explanation: string | null

  entity_mapping: EntityMapping[]
  tables_used: string[]
  important_columns: ImportantColumn[]
  benign_indicators: Indicator[]
  malicious_indicators: Indicator[]
  classification_guidance: string | null
  rule_tuning_suggestions: TuningSuggestion[]
  mitre_mapping: MitreEntry[]

  learn_recommendations: LearnModule[]
  related_concepts: string[]
  kql_operators_to_study: string[]

  enriched_at: string | null
  updated_at: string

  investigation_steps: InvestigationStep[]
  investigation_queries: InvestigationQuery[]
}

export interface EntityMapping {
  entity_type: string
  field: string
  column: string
}

export interface ImportantColumn {
  table: string
  column: string
  reason: string
}

export interface Indicator {
  indicator: string
  reasoning: string
}

export interface TuningSuggestion {
  suggestion: string
  type: 'reduce_fp' | 'improve_coverage' | 'performance'
}

export interface MitreEntry {
  tactic: string
  technique: string
  sub_technique?: string
}

export interface LearnModule {
  title: string
  url: string
  reason: string
}

export interface UseCaseListResponse {
  items: UseCaseListItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface UseCaseCreatePayload {
  title: string
  analytics_rule_kql?: string
  raw_info?: string
  alert_name?: string
  alert_description?: string
  analytics_rule_name?: string
  investigation_notes?: string
  response_notes?: string
  category?: string
  severity?: string
  platform?: string
  difficulty?: string
  mitre_mapping?: MitreEntry[]
  tags?: string[]
}

// ── Practice Lab ───────────────────────────────────────────────────────────

export interface Challenge {
  id: string
  source_type: 'use_case' | 'synthetic'
  difficulty: 'Easy' | 'Medium' | 'Hard'
  scenario: string
  objectives: string[]
  available_tables: string[]
  expected_entities: string[]
  hints: string[]
  tags: string[]
  created_at: string
}

export interface Evaluation {
  id: string
  session_id: string
  overall_score: number
  detection_logic_score: number | null
  query_structure_score: number | null
  entity_mapping_score: number | null
  time_window_score: number | null
  performance_score: number | null
  strengths: string[]
  weaknesses: string[]
  missing_logic: string[]
  suggested_improvements: string[]
  reference_solution: string | null
  recommended_concepts: string[]
  learn_modules: LearnModule[]
  learning_summary: string
  created_at: string
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type Severity = 'Informational' | 'Low' | 'Medium' | 'High'
