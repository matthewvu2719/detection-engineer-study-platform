import { cn } from '@/lib/utils'

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

export function ScoreRing({ score, label }: { score: number; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn('text-3xl font-bold tabular-nums', scoreColor(score))}>
        {score}
      </div>
      <div className="text-xs text-muted-foreground">{label ?? 'Score'}</div>
    </div>
  )
}
