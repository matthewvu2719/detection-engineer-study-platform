import { Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  completed: { icon: CheckCircle2, label: 'Enriched', className: 'text-green-400' },
  processing: { icon: Loader2, label: 'Enriching...', className: 'text-blue-400 animate-spin' },
  pending: { icon: Clock, label: 'Pending', className: 'text-muted-foreground' },
  failed: { icon: XCircle, label: 'Failed', className: 'text-red-400' },
}

export function EnrichmentStatus({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
  const Icon = config.icon
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className={cn('h-3 w-3', config.className)} />
      {config.label}
    </span>
  )
}
