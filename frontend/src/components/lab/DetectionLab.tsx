'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Lightbulb, Send, RotateCcw, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Editor from '@monaco-editor/react'
import { registerKqlCompletions } from '@/lib/kql-completions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DifficultySelector } from './DifficultySelector'
import { ScoreRing } from './ScoreRing'
import { api } from '@/lib/api'
import type { Challenge, Evaluation, Difficulty } from '@/types'

type Phase = 'setup' | 'challenge' | 'results'

export function DetectionLab({ initialUseCaseId }: { initialUseCaseId?: string }) {
  const [phase, setPhase] = useState<Phase>('setup')
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy')
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [kql, setKql] = useState('')
  const [startedAt, setStartedAt] = useState(new Date().toISOString())

  const [hintIndex, setHintIndex] = useState(0)
  const [revealedHints, setRevealedHints] = useState<string[]>([])
  const [loadingHint, setLoadingHint] = useState(false)

  const [showReference, setShowReference] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const c = await api.practice.generateChallenge({
        difficulty,
        source_use_case_id: initialUseCaseId,
      })
      setChallenge(c)
      setPhase('challenge')
      setKql('')
      setRevealedHints([])
      setHintIndex(0)
      setStartedAt(new Date().toISOString())
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate challenge.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSubmit() {
    if (!challenge || !kql.trim()) {
      toast.error('Write your KQL query before submitting.')
      return
    }
    setSubmitting(true)
    try {
      const ev = await api.practice.submitKql({
        challenge_id: challenge.id,
        submitted_kql: kql,
        started_at: startedAt,
      })
      setEvaluation(ev)
      setPhase('results')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Evaluation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleHint() {
    if (!challenge) return
    setLoadingHint(true)
    try {
      const res = await api.practice.getHint(challenge.id, hintIndex)
      setRevealedHints((prev) => [...prev, res.hint])
      setHintIndex((i) => i + 1)
    } catch {
      toast.error('No more hints available.')
    } finally {
      setLoadingHint(false)
    }
  }

  function reset() {
    setPhase('setup')
    setChallenge(null)
    setEvaluation(null)
    setKql('')
    setRevealedHints([])
    setHintIndex(0)
    setShowReference(false)
  }

  // ── SETUP ─────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Select Difficulty</h2>
          <DifficultySelector value={difficulty} onChange={setDifficulty} />
        </div>
        <Button onClick={handleGenerate} disabled={generating} size="lg" className="w-full gap-2">
          {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating challenge...</> : 'Start Practice'}
        </Button>
      </div>
    )
  }

  // ── CHALLENGE ─────────────────────────────────────────────────────────────
  if (phase === 'challenge' && challenge) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{challenge.difficulty}</Badge>
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1">
            <RotateCcw className="h-3 w-3" /> New challenge
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Scenario</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{challenge.scenario}</p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Objectives</CardTitle></CardHeader>
            <CardContent>
              <ol className="space-y-1">
                {challenge.objectives.map((o, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary font-medium">{i + 1}.</span> {o}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Available Tables</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {challenge.available_tables.map((t) => (
                  <Badge key={t} variant="secondary" className="font-mono text-xs">{t}</Badge>
                ))}
              </div>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground font-medium mb-1">Expected entities:</p>
                <div className="flex flex-wrap gap-1">
                  {challenge.expected_entities.map((e, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{e}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {revealedHints.length > 0 && (
          <div className="space-y-2">
            {revealedHints.map((hint, i) => (
              <div key={i} className="flex gap-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                <Lightbulb className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-sm">{hint}</p>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Your KQL Query</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHint}
              disabled={loadingHint || hintIndex >= challenge.hints.length}
              className="gap-1 text-yellow-400 hover:text-yellow-300"
            >
              {loadingHint ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
              Get hint ({challenge.hints.length - hintIndex} left)
            </Button>
          </div>
          <div className="border border-border rounded-md overflow-hidden">
            <Editor
              height="280px"
              language="kusto"
              theme="vs-dark"
              value={kql}
              onChange={(value) => setKql(value ?? '')}
              onMount={(_, monaco) => registerKqlCompletions(monaco)}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 4,
                padding: { top: 12, bottom: 12 },
                quickSuggestions: { other: true, comments: false, strings: false },
                suggestOnTriggerCharacters: true,
                wordBasedSuggestions: 'off',
                suggest: { showWords: false },
              }}
            />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={submitting || !kql.trim()} size="lg" className="w-full gap-2">
          {submitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Evaluating...</>
            : <><Send className="h-4 w-4" /> Submit for Evaluation</>
          }
        </Button>
      </div>
    )
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  if (phase === 'results' && evaluation) {
    const scores = [
      { label: 'Detection Logic', value: evaluation.detection_logic_score },
      { label: 'Query Structure', value: evaluation.query_structure_score },
      { label: 'Entity Mapping', value: evaluation.entity_mapping_score },
      { label: 'Time Window', value: evaluation.time_window_score },
      { label: 'Performance', value: evaluation.performance_score },
    ].filter((s) => s.value !== null) as { label: string; value: number }[]

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Evaluation Results</h2>
          <Button variant="outline" size="sm" onClick={reset} className="gap-1">
            <RotateCcw className="h-3 w-3" /> New challenge
          </Button>
        </div>

        {/* Score summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-6 justify-center">
              <ScoreRing score={evaluation.overall_score} label="Overall" />
              {scores.map((s) => (
                <ScoreRing key={s.label} score={s.value} label={s.label} />
              ))}
            </div>
            <Separator className="my-4" />
            <p className="text-sm text-muted-foreground text-center">{evaluation.learning_summary}</p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          {evaluation.strengths.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-green-400">Strengths</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} className="text-sm flex gap-2"><span className="text-green-400">✓</span>{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {evaluation.weaknesses.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-red-400">Weaknesses</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {evaluation.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm flex gap-2"><span className="text-red-400">✗</span>{w}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {evaluation.missing_logic.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Missing Logic</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {evaluation.missing_logic.map((m, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span>→</span>{m}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {evaluation.suggested_improvements.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Suggested Improvements</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {evaluation.suggested_improvements.map((s, i) => (
                  <li key={i} className="text-sm leading-relaxed">{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Reference solution */}
        {evaluation.reference_solution && (
          <div className="space-y-2">
            <Button variant="outline" size="sm" onClick={() => setShowReference((v) => !v)}>
              {showReference ? 'Hide' : 'Show'} Reference Solution
            </Button>
            {showReference && (
              <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                {evaluation.reference_solution}
              </pre>
            )}
          </div>
        )}

        {/* Learn modules */}
        {evaluation.learn_modules.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recommended Learning</h3>
            {evaluation.learn_modules.map((mod, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-md border">
                <div>
                  <a href={mod.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline flex items-center gap-1">
                    {mod.title} <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-xs text-muted-foreground mt-0.5">{mod.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {evaluation.recommended_concepts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Concepts to Study</h3>
            <div className="flex flex-wrap gap-2">
              {evaluation.recommended_concepts.map((c, i) => (
                <Badge key={i} variant="secondary">{c}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}
