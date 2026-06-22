'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

const SEVERITIES = ['Informational', 'Low', 'Medium', 'High']
const CATEGORIES = ['Identity', 'Network', 'Endpoint', 'Cloud', 'Email', 'Application']
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

const NONE = '__none__'

export function LibraryFilters() {
  const router = useRouter()
  const params = useSearchParams()

  function update(key: string, value: string) {
    const p = new URLSearchParams(params.toString())
    if (value && value !== NONE) {
      p.set(key, value)
    } else {
      p.delete(key)
    }
    p.delete('page')
    router.push(`/library?${p}`)
  }

  function clear() {
    router.push('/library')
  }

  const hasFilters = params.size > 0

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search use cases..."
          defaultValue={params.get('query') ?? ''}
          onChange={(e) => update('query', e.target.value)}
        />
      </div>

      <Select value={params.get('severity') ?? NONE} onValueChange={(v) => update('severity', v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>All severities</SelectItem>
          {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={params.get('category') ?? NONE} onValueChange={(v) => update('category', v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>All categories</SelectItem>
          {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={params.get('difficulty') ?? NONE} onValueChange={(v) => update('difficulty', v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>All levels</SelectItem>
          {DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clear} className="gap-1">
          <X className="h-3 w-3" /> Clear
        </Button>
      )}
    </div>
  )
}
