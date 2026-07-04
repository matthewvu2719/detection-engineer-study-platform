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
import { api, ApiError } from '@/lib/api'

export function AddUseCaseForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [kql, setKql] = useState('')
  const [rawInfo, setRawInfo] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Title is required.')
      return
    }

    setLoading(true)
    try {
      const uc = await api.useCases.create({
        title: title.trim(),
        analytics_rule_kql: kql.trim() || undefined,
        raw_info: rawInfo.trim() || undefined,
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Use Case Title *</Label>
        <Input
          id="title"
          placeholder="e.g. Brute Force Attack on Azure AD"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* KQL Rule */}
      <div className="space-y-2">
        <Label>KQL Rule</Label>
        <p className="text-xs text-muted-foreground">Paste your Sentinel analytics rule query. Leave blank if not available — the AI will infer the detection logic from your context.</p>
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

      {/* Freeform info */}
      <div className="space-y-2">
        <Label htmlFor="raw_info">Additional Info</Label>
        <p className="text-xs text-muted-foreground">
          Paste anything — alert description, entity types, investigation steps, response playbook, ticket notes.
          The AI will extract and structure it automatically.
        </p>
        <Textarea
          id="raw_info"
          placeholder={`Example:\nAlert fires when 10+ failed logins from the same IP within 5 minutes.\nEntities: Account (UserPrincipalName), IP (IPAddress)\nCheck if IP is in threat intel. Disable account if confirmed malicious.`}
          rows={8}
          value={rawInfo}
          onChange={(e) => setRawInfo(e.target.value)}
        />
      </div>

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
    </form>
  )
}
