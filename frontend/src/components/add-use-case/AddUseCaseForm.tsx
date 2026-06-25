'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, ApiError } from '@/lib/api'

const SEVERITIES = ['Informational', 'Low', 'Medium', 'High']
const CATEGORIES = ['Identity', 'Network', 'Endpoint', 'Cloud', 'Email', 'Application']
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

export function AddUseCaseForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    alert_name: '',
    alert_description: '',
    analytics_rule_name: '',
    analytics_rule_kql: '',
    investigation_notes: '',
    response_notes: '',
    category: '',
    severity: '',
    difficulty: '',
    platform: 'Microsoft Sentinel',
    tags: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.title || !form.alert_name || !form.analytics_rule_kql) {
      toast.error('Title, Alert Name, and KQL are required.')
      return
    }

    setLoading(true)
    try {
      const uc = await api.useCases.create({
        title: form.title,
        alert_name: form.alert_name,
        alert_description: form.alert_description || undefined,
        analytics_rule_name: form.analytics_rule_name || undefined,
        analytics_rule_kql: form.analytics_rule_kql,
        investigation_notes: form.investigation_notes || undefined,
        response_notes: form.response_notes || undefined,
        category: form.category || undefined,
        severity: form.severity || undefined,
        difficulty: form.difficulty || undefined,
        platform: form.platform,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      })

      toast.success('Use case created! AI enrichment is running in the background.')
      router.push(`/library/${uc.id}`)
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409 && err.detail?.existing_id) {
        toast.warning('This KQL rule already exists in your library.', {
          action: {
            label: 'View it',
            onClick: () => router.push(`/library/${err.detail!.existing_id}`),
          },
          duration: 8000,
        })
      } else {
        toast.error(err instanceof Error ? err.message : 'Something went wrong.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Required fields */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Details</CardTitle>
          <CardDescription>The core information about the Sentinel alert.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Brute Force Attack on Azure AD"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert_name">Alert Name *</Label>
              <Input
                id="alert_name"
                placeholder="e.g. Multiple failed sign-ins"
                value={form.alert_name}
                onChange={(e) => set('alert_name', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert_description">Alert Description</Label>
            <Textarea
              id="alert_description"
              placeholder="Paste the alert description from Sentinel..."
              rows={3}
              value={form.alert_description}
              onChange={(e) => set('alert_description', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="analytics_rule_name">Analytics Rule Name</Label>
            <Input
              id="analytics_rule_name"
              placeholder="e.g. Sign-ins from IPs that attempt sign-ins to disabled accounts"
              value={form.analytics_rule_name}
              onChange={(e) => set('analytics_rule_name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="analytics_rule_kql">Analytics Rule KQL *</Label>
            <Textarea
              id="analytics_rule_kql"
              placeholder="Paste the KQL query from your Sentinel analytics rule..."
              rows={10}
              className="font-mono text-sm"
              value={form.analytics_rule_kql}
              onChange={(e) => set('analytics_rule_kql', e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
          <CardDescription>Optional — AI will infer these if left blank.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={form.severity || undefined} onValueChange={(v) => set('severity', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category || undefined} onValueChange={(v) => set('category', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={form.difficulty || undefined} onValueChange={(v) => set('difficulty', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Comma-separated: brute-force, identity, azure-ad"
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Optional notes */}
      <Card>
        <CardHeader>
          <CardTitle>Investigation & Response Notes</CardTitle>
          <CardDescription>Your own notes — AI will incorporate these into the enrichment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="investigation_notes">Investigation Notes</Label>
            <Textarea
              id="investigation_notes"
              placeholder="What do you check when this alert fires?"
              rows={4}
              value={form.investigation_notes}
              onChange={(e) => set('investigation_notes', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="response_notes">Response Notes</Label>
            <Textarea
              id="response_notes"
              placeholder="What actions do you take for a confirmed True Positive?"
              rows={4}
              value={form.response_notes}
              onChange={(e) => set('response_notes', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} size="lg" className="gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving & enriching...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Save & Enrich with AI
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
