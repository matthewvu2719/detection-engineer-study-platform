import { Badge } from '@/components/ui/badge'
import type { Severity } from '@/types'

const COLORS: Record<string, string> = {
  High: 'bg-red-500/20 text-red-400 border-red-500/30',
  Medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Low: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Informational: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

export function SeverityBadge({ severity }: { severity: Severity | string | null }) {
  if (!severity) return null
  return (
    <Badge variant="outline" className={COLORS[severity] ?? ''}>
      {severity}
    </Badge>
  )
}
