'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Editor from '@monaco-editor/react'
import { registerKqlCompletions } from '@/lib/kql-completions'
import { api } from '@/lib/api'
import type { UseCaseDetail } from '@/types'

export function EditUseCaseForm({ uc }: { uc: UseCaseDetail }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(uc.title)
  const [kql, setKql] = useState(uc.analytics_rule_kql ?? '')
  const [rawInfo, setRawInfo] = useState(uc.investigation_notes ?? '')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Title is required.')
      return
    }
    setLoading(true)
    try {
      await api.useCases.update(String(uc.id), {
        title: title.trim(),
        analytics_rule_kql: kql.trim() || undefined,
        raw_info: rawInfo.trim() || undefined,
      })
      toast.success('Saved! Re-enrichment is running in the background.')
      router.refresh()
      router.push(`/library/${uc.id}`)
    } catch {
      toast.error('Failed to save changes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="space-y-2">
        <Label htmlFor="title">Use Case Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>KQL Rule</Label>
        <p className="text-xs text-muted-foreground">Leave blank to let the AI infer the detection logic.</p>
        <div className="border border-border rounded-md overflow-hidden">
          <Editor
            height="260px"
            language="kusto"
            theme="vs-dark"
            value={kql}
            onChange={(value) => setKql(value ?? '')}
            onMount={(_, monaco) => registerKqlCompletions(monaco)}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: true,
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

      <div className="space-y-2">
        <Label htmlFor="raw_info">Investigation Notes</Label>
        <p className="text-xs text-muted-foreground">
          Your investigation steps or playbook. If provided, these are used directly as the investigation steps.
          If cleared, the AI will generate steps from the detection context.
        </p>
        <Textarea
          id="raw_info"
          placeholder={`Example:\n1. Check if the source IP appears in threat intelligence.\n2. Review sign-in history for the affected account over the past 7 days.\n3. Correlate with other alerts from the same IP or user.\n4. If confirmed malicious, disable the account and reset credentials.`}
          rows={8}
          value={rawInfo}
          onChange={(e) => setRawInfo(e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Save & Re-enrich</>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/library/${uc.id}`)}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
