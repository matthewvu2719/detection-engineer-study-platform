import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { SeverityBadge } from '@/components/library/SeverityBadge'
import { EnrichmentStatus } from '@/components/library/EnrichmentStatus'
import { api } from '@/lib/api'

interface PageProps {
  params: Promise<{ id: string }>
}

function KqlBlock({ kql }: { kql: string }) {
  return (
    <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm font-mono whitespace-pre-wrap">
      {kql}
    </pre>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  )
}

export default async function UseCaseDetailPage({ params }: PageProps) {
  const { id } = await params
  let uc
  try {
    uc = await api.useCases.get(id)
  } catch {
    notFound()
  }

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
            <p className="text-muted-foreground mt-0.5">{uc.alert_name}</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <SeverityBadge severity={uc.severity} />
            {uc.category && <Badge variant="secondary">{uc.category}</Badge>}
            {uc.difficulty && <Badge variant="outline">{uc.difficulty}</Badge>}
            <EnrichmentStatus status={uc.enrichment_status} />
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

      <Separator />

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kql">KQL</TabsTrigger>
          <TabsTrigger value="investigation">Investigation</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ─────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
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
        <TabsContent value="kql" className="space-y-4 mt-4">
          <Section title="Analytics Rule KQL">
            <KqlBlock kql={uc.analytics_rule_kql} />
          </Section>
          {uc.kql_explanation && (
            <Section title="KQL Explanation">
              <p className="text-sm leading-relaxed whitespace-pre-line">{uc.kql_explanation}</p>
            </Section>
          )}
          {uc.kql_operators_to_study.length > 0 && (
            <Section title="KQL Operators to Study">
              <div className="flex flex-wrap gap-2">
                {uc.kql_operators_to_study.map((op: string, i: number) => (
                  <Badge key={i} variant="secondary" className="font-mono text-xs">{op}</Badge>
                ))}
              </div>
            </Section>
          )}
        </TabsContent>

        {/* ── INVESTIGATION ─────────────────────────────────────── */}
        <TabsContent value="investigation" className="space-y-6 mt-4">
          {uc.investigation_steps.length > 0 && (
            <Section title="Investigation Steps">
              <ol className="space-y-3">
                {uc.investigation_steps.map((step) => (
                  <li key={step.id} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
                      {step.step_order}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{step.title}</p>
                      {step.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {uc.investigation_queries.length > 0 && (
            <Section title="Investigation KQL Queries">
              <div className="space-y-4">
                {uc.investigation_queries.map((q) => (
                  <div key={q.id} className="space-y-1.5">
                    <p className="text-sm font-medium">{q.title}</p>
                    {q.description && <p className="text-xs text-muted-foreground">{q.description}</p>}
                    <KqlBlock kql={q.kql} />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {uc.classification_guidance && (
            <Section title="Classification Guidance">
              <p className="text-sm leading-relaxed">{uc.classification_guidance}</p>
            </Section>
          )}
        </TabsContent>

        {/* ── KNOWLEDGE ─────────────────────────────────────────── */}
        <TabsContent value="knowledge" className="space-y-6 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {uc.tables_used.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Tables Used</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {uc.tables_used.map((t: string, i: number) => (
                      <Badge key={i} variant="secondary" className="font-mono text-xs">{t}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {uc.entity_mapping.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Entity Mapping</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {uc.entity_mapping.map((e, i) => (
                      <div key={i} className="text-xs flex gap-2">
                        <Badge variant="outline" className="text-xs">{e.entity_type}</Badge>
                        <span className="text-muted-foreground">{e.field} → <code className="font-mono">{e.column}</code></span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {uc.important_columns.length > 0 && (
            <Section title="Important Columns">
              <div className="space-y-2">
                {uc.important_columns.map((col: { table: string; column: string; reason: string }, i: number) => (
                  <div key={i} className="text-sm flex gap-2 items-start">
                    <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded shrink-0">{col.table}.{col.column}</code>
                    <span className="text-muted-foreground text-xs">{col.reason}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {uc.benign_indicators.length > 0 && (
              <Section title="Benign Indicators">
                <ul className="space-y-1.5">
                  {uc.benign_indicators.map((ind: { indicator: string; reasoning: string }, i: number) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium">{ind.indicator}</span>
                      <span className="text-muted-foreground text-xs block">{ind.reasoning}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {uc.malicious_indicators.length > 0 && (
              <Section title="Malicious Indicators">
                <ul className="space-y-1.5">
                  {uc.malicious_indicators.map((ind: { indicator: string; reasoning: string }, i: number) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium text-red-400">{ind.indicator}</span>
                      <span className="text-muted-foreground text-xs block">{ind.reasoning}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>

          {uc.rule_tuning_suggestions.length > 0 && (
            <Section title="Rule Tuning Suggestions">
              <ul className="space-y-2">
                {uc.rule_tuning_suggestions.map((s: { suggestion: string; type: string }, i: number) => (
                  <li key={i} className="text-sm flex gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">{s.type}</Badge>
                    <span>{s.suggestion}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </TabsContent>

        {/* ── LEARNING ──────────────────────────────────────────── */}
        <TabsContent value="learning" className="space-y-6 mt-4">
          {uc.learn_recommendations.length > 0 && (
            <Section title="Microsoft Learn Recommendations">
              <div className="space-y-2">
                {uc.learn_recommendations.map((mod: { title: string; url: string; reason: string }, i: number) => (
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

          {uc.related_concepts.length > 0 && (
            <Section title="Related Concepts">
              <div className="flex flex-wrap gap-2">
                {uc.related_concepts.map((c: string, i: number) => (
                  <Badge key={i} variant="secondary">{c}</Badge>
                ))}
              </div>
            </Section>
          )}

          {uc.kql_operators_to_study.length > 0 && (
            <Section title="KQL Operators to Study">
              <div className="flex flex-wrap gap-2">
                {uc.kql_operators_to_study.map((op: string, i: number) => (
                  <Badge key={i} variant="outline" className="font-mono text-xs">{op}</Badge>
                ))}
              </div>
            </Section>
          )}

          <div className="pt-2">
            <Button variant="outline" render={<Link href={`/lab?use_case_id=${uc.id}`} />} nativeButton={false}>
              Practice KQL from this use case →
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
