import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, BookOpen, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { SeverityBadge } from '@/components/library/SeverityBadge'
import { EnrichmentStatus } from '@/components/library/EnrichmentStatus'
import { EnrichmentPoller } from '@/components/library/EnrichmentPoller'
import { DeleteButton } from '@/components/library/DeleteButton'
import { api } from '@/lib/api'
import type { UseCaseDetail, TableReference, ColumnReference } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

function KqlBlock({ kql }: { kql: string | null }) {
  if (!kql) return <p className="text-sm text-muted-foreground italic">No KQL rule provided.</p>
  return (
    <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm font-mono whitespace-pre-wrap">
      {kql}
    </pre>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}

function ContextBadge({ context }: { context: string }) {
  if (context === 'both') return (
    <>
      <Badge variant="outline" className="text-[10px] px-1 py-0">Detection</Badge>
      <Badge variant="outline" className="text-[10px] px-1 py-0">Investigation</Badge>
    </>
  )
  return <Badge variant="outline" className="text-[10px] px-1 py-0">{context === 'detection' ? 'Detection' : 'Investigation'}</Badge>
}

export default async function UseCaseDetailPage({ params }: PageProps) {
  const { id } = await params
  let uc: UseCaseDetail
  try {
    uc = await api.useCases.get(id)
  } catch {
    notFound()
  }

  const detectionTables = uc.tables_used.filter((t: TableReference) => t.context === 'detection' || t.context === 'both')
  const investigationTables = uc.tables_used.filter((t: TableReference) => t.context === 'investigation' || t.context === 'both')
  const detectionColumns = uc.important_columns.filter((c: ColumnReference) => c.context === 'detection' || c.context === 'both')
  const investigationColumns = uc.important_columns.filter((c: ColumnReference) => c.context === 'investigation' || c.context === 'both')
  const hasInvestigationSchema = investigationTables.length > 0 || investigationColumns.length > 0 || uc.investigation_functions.length > 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + header */}
      <div>
        <Button variant="ghost" size="sm" render={<Link href="/library" />} nativeButton={false} className="mb-4 -ml-2 gap-1">
          <ArrowLeft className="h-4 w-4" /> Library
        </Button>

        <div className="flex flex-wrap items-start gap-3 justify-between">
          <div>
            <h1 className="text-2xl font-bold">{uc.title}</h1>
            {uc.alert_name && uc.alert_name !== uc.title && (
              <p className="text-muted-foreground mt-0.5">{uc.alert_name}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <SeverityBadge severity={uc.severity} />
            {uc.category && <Badge variant="secondary">{uc.category}</Badge>}
            {uc.difficulty && <Badge variant="outline">{uc.difficulty}</Badge>}
            <EnrichmentStatus status={uc.enrichment_status} />
            <Button size="sm" variant="ghost" render={<Link href={`/library/${uc.id}/edit`} />} nativeButton={false} className="gap-1.5 text-muted-foreground">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <DeleteButton id={String(uc.id)} />
          </div>
        </div>

        {uc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {uc.tags.map((tag) => (
              <Badge key={tag.id} variant="outline" className="text-xs" style={{ borderColor: tag.color + '60', color: tag.color }}>
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <EnrichmentPoller status={uc.enrichment_status} />

      <Separator />

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kql">KQL</TabsTrigger>
          <TabsTrigger value="investigation">Investigation</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ─────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-5 mt-4">
          {uc.detection_purpose && (
            <Section title="Detection Purpose">
              <p className="text-sm leading-relaxed">{uc.detection_purpose}</p>
            </Section>
          )}
          {uc.detection_logic && (
            <Section title="Detection Logic">
              <p className="text-sm leading-relaxed">{uc.detection_logic}</p>
            </Section>
          )}
          {uc.typical_attack_scenarios && (
            <Section title="Typical Attack Scenarios">
              <p className="text-sm leading-relaxed whitespace-pre-line">{uc.typical_attack_scenarios}</p>
            </Section>
          )}
          {uc.alert_description && (
            <Section title="Alert Description">
              <p className="text-sm leading-relaxed text-muted-foreground">{uc.alert_description}</p>
            </Section>
          )}
          {uc.mitre_mapping.length > 0 && (
            <Section title="MITRE ATT&CK">
              <div className="flex flex-wrap gap-2">
                {uc.mitre_mapping.map((m: { tactic: string; technique: string }, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {m.tactic} › {m.technique}
                  </Badge>
                ))}
              </div>
            </Section>
          )}
        </TabsContent>

        {/* ── KQL ──────────────────────────────────────────────── */}
        <TabsContent value="kql" className="space-y-5 mt-4">
          <Section title="Analytics Rule KQL">
            <KqlBlock kql={uc.analytics_rule_kql} />
          </Section>

          {uc.kql_explanation && (
            <Section title="KQL Explanation">
              <p className="text-sm leading-relaxed whitespace-pre-line">{uc.kql_explanation}</p>
            </Section>
          )}

          {uc.analytics_rule_kql && uc.rule_tuning_suggestions.length > 0 && (
            <Section title="Rule Tuning Suggestions">
              <ul className="space-y-2">
                {uc.rule_tuning_suggestions.map((s, i) => (
                  <li key={i} className="text-sm flex gap-2 items-start">
                    <Badge variant="outline" className="text-xs shrink-0 mt-0.5">{s.type}</Badge>
                    <span>{s.suggestion}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </TabsContent>

        {/* ── INVESTIGATION ─────────────────────────────────────── */}
        <TabsContent value="investigation" className="mt-4 space-y-6">
          {uc.investigation_steps.length === 0 && !uc.classification_guidance && uc.benign_indicators.length === 0 && uc.malicious_indicators.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No investigation steps available.</p>
          ) : (
            <ol className="relative border-l border-border ml-3 space-y-0">
              {uc.investigation_steps.map((step) => (
                <li key={step.id} className="mb-6 ml-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold ring-2 ring-background">
                    {step.step_order}
                  </span>
                  <p className="text-sm font-semibold leading-tight">{step.title}</p>
                  {step.description && (
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  )}
                  {step.kql && (
                    <div className="mt-3">
                      <KqlBlock kql={step.kql} />
                    </div>
                  )}
                </li>
              ))}

              {(uc.classification_guidance || uc.benign_indicators.length > 0 || uc.malicious_indicators.length > 0) && (
                <li className="mb-2 ml-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-400 text-xs ring-2 ring-background">
                    ⚑
                  </span>
                  <p className="text-sm font-semibold text-yellow-400 leading-tight">Classify the Alert</p>
                  {uc.classification_guidance && (
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{uc.classification_guidance}</p>
                  )}
                  {(uc.benign_indicators.length > 0 || uc.malicious_indicators.length > 0) && (
                    <div className="mt-3 grid md:grid-cols-2 gap-3">
                      {uc.benign_indicators.length > 0 && (
                        <div className="rounded-md border border-green-500/20 bg-green-500/5 p-3 space-y-1.5">
                          <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">Benign</p>
                          <ul className="space-y-1.5">
                            {uc.benign_indicators.map((ind, i) => (
                              <li key={i}>
                                <span className="text-xs font-medium text-green-300">{ind.indicator}</span>
                                <span className="text-muted-foreground text-xs block">{ind.reasoning}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {uc.malicious_indicators.length > 0 && (
                        <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3 space-y-1.5">
                          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Malicious</p>
                          <ul className="space-y-1.5">
                            {uc.malicious_indicators.map((ind, i) => (
                              <li key={i}>
                                <span className="text-xs font-medium text-red-300">{ind.indicator}</span>
                                <span className="text-muted-foreground text-xs block">{ind.reasoning}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              )}
            </ol>
          )}
        </TabsContent>

        {/* ── LEARNING (merged Knowledge + Learning) ────────────── */}
        <TabsContent value="learning" className="space-y-8 mt-4">

          {/* Detection Rule Schema */}
          {(detectionTables.length > 0 || detectionColumns.length > 0 || uc.kql_operators_to_study.length > 0) && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Detection Rule</h3>

              {detectionTables.length > 0 && (
                <Section title="Tables Used">
                  <div className="space-y-2">
                    {detectionTables.map((t: TableReference, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-md border">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="font-mono text-xs font-semibold">{t.name}</code>
                            <ContextBadge context={t.context} />
                          </div>
                          {t.definition && <p className="text-xs text-muted-foreground mt-1">{t.definition}</p>}
                        </div>
                        {t.doc_url && (
                          <a href={t.doc_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5" title="Microsoft Learn docs">
                            <BookOpen className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {detectionColumns.length > 0 && (
                <Section title="Key Columns">
                  <div className="space-y-2">
                    {detectionColumns.map((col: ColumnReference, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-md border">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{col.table}.{col.column}</code>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{col.reason}</p>
                        </div>
                        {col.doc_url && (
                          <a href={col.doc_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5" title="Microsoft Learn docs">
                            <BookOpen className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {uc.kql_operators_to_study.length > 0 && (
                <Section title="KQL Functions Used">
                  <div className="flex flex-wrap gap-1.5">
                    {uc.kql_operators_to_study.map((fn: string, i: number) => (
                      <Badge key={i} variant="secondary" className="font-mono text-xs">{fn}</Badge>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}

          {/* Investigation Schema */}
          {hasInvestigationSchema && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Investigation Queries</h3>

              {investigationTables.length > 0 && (
                <Section title="Tables Used">
                  <div className="space-y-2">
                    {investigationTables.map((t: TableReference, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-md border">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="font-mono text-xs font-semibold">{t.name}</code>
                            <ContextBadge context={t.context} />
                          </div>
                          {t.definition && <p className="text-xs text-muted-foreground mt-1">{t.definition}</p>}
                        </div>
                        {t.doc_url && (
                          <a href={t.doc_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5" title="Microsoft Learn docs">
                            <BookOpen className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {investigationColumns.length > 0 && (
                <Section title="Key Columns">
                  <div className="space-y-2">
                    {investigationColumns.map((col: ColumnReference, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-md border">
                        <div className="flex-1 min-w-0">
                          <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{col.table}.{col.column}</code>
                          <p className="text-xs text-muted-foreground mt-1">{col.reason}</p>
                        </div>
                        {col.doc_url && (
                          <a href={col.doc_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5" title="Microsoft Learn docs">
                            <BookOpen className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {uc.investigation_functions.length > 0 && (
                <Section title="KQL Functions Used">
                  <div className="flex flex-wrap gap-1.5">
                    {uc.investigation_functions.map((fn: string, i: number) => (
                      <Badge key={i} variant="secondary" className="font-mono text-xs">{fn}</Badge>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}

          {/* Entity Mapping */}
          {uc.entity_mapping.length > 0 && (
            <Section title="Detection Entities">
              <div className="space-y-1.5">
                {uc.entity_mapping.map((e, i) => (
                  <div key={i} className="text-xs flex items-center gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">{e.entity_type}</Badge>
                    <span className="text-muted-foreground">{e.field} → <code className="font-mono">{e.column}</code></span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* MS Learn resources */}
          {uc.learn_recommendations.length > 0 && (
            <Section title="Microsoft Learn Resources">
              <div className="space-y-2">
                {uc.learn_recommendations.map((mod, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-md border">
                    <div className="flex-1">
                      <a href={mod.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline flex items-center gap-1">
                        {mod.title} <ExternalLink className="h-3 w-3" />
                      </a>
                      <p className="text-xs text-muted-foreground mt-0.5">{mod.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Related concepts */}
          {uc.related_concepts.length > 0 && (
            <Section title="Related Concepts">
              <div className="flex flex-wrap gap-2">
                {uc.related_concepts.map((c: string, i: number) => (
                  <Badge key={i} variant="secondary">{c}</Badge>
                ))}
              </div>
            </Section>
          )}

          <div className="pt-2 border-t">
            <Button render={<Link href={`/lab?use_case_id=${uc.id}`} />} nativeButton={false} className="gap-2">
              Practice KQL from this use case →
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
