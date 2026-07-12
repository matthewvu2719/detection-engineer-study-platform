'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SeverityBadge } from './SeverityBadge'
import { EnrichmentStatus } from './EnrichmentStatus'
import { api } from '@/lib/api'
import type { UseCaseListItem } from '@/types'

export function UseCaseCard({ uc }: { uc: UseCaseListItem }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setDeleting(true)
    try {
      await api.useCases.delete(String(uc.id))
      toast.success('Use case deleted.')
      router.refresh()
    } catch {
      toast.error('Failed to delete.')
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <Card className="h-full border-destructive/50">
        <CardContent className="pt-6 flex flex-col items-center justify-center gap-4 h-full text-center">
          <p className="text-sm font-medium">Delete <span className="font-semibold">{uc.title}</span>?</p>
          <p className="text-xs text-muted-foreground">This cannot be undone.</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-1"
            >
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={deleting}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="h-full flex flex-col hover:border-primary/50 transition-colors cursor-pointer group relative"
      onClick={() => router.push(`/library/${uc.id}`)}
    >
      {/* Hover action buttons */}
      <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          title="Edit"
          onClick={(e) => { e.stopPropagation(); router.push(`/library/${uc.id}/edit`) }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 hover:text-destructive"
          title="Delete"
          onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 pr-14">
          <CardTitle className="text-base leading-snug">{uc.title}</CardTitle>
          <SeverityBadge severity={uc.severity} />
        </div>
        {uc.alert_name !== uc.title && (
          <p className="text-xs text-muted-foreground">{uc.alert_name}</p>
        )}
      </CardHeader>

      <CardContent className="mt-auto space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {uc.category && (
            <Badge variant="secondary" className="text-xs">{uc.category}</Badge>
          )}
          {uc.difficulty && (
            <Badge variant="outline" className="text-xs">{uc.difficulty}</Badge>
          )}
          {uc.tags.slice(0, 3).map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-xs" style={{ borderColor: tag.color + '60', color: tag.color }}>
              {tag.name}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <EnrichmentStatus status={uc.enrichment_status} />
          <span className="text-xs text-muted-foreground">
            {new Date(uc.created_at).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
