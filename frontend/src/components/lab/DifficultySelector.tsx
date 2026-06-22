'use client'

import { cn } from '@/lib/utils'
import type { Difficulty } from '@/types'

const OPTIONS: { value: Difficulty; label: string; description: string; color: string }[] = [
  { value: 'Easy', label: 'Easy', description: 'Single table, basic filters', color: 'border-green-500/50 bg-green-500/10 text-green-400' },
  { value: 'Medium', label: 'Medium', description: 'Joins, aggregations, time windows', color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' },
  { value: 'Hard', label: 'Hard', description: 'Multi-table correlation, complex logic', color: 'border-red-500/50 bg-red-500/10 text-red-400' },
]

interface Props {
  value: Difficulty
  onChange: (v: Difficulty) => void
}

export function DifficultySelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-lg border p-3 text-left transition-all',
            value === opt.value
              ? opt.color + ' border-2'
              : 'border-border hover:border-muted-foreground'
          )}
        >
          <p className="font-medium text-sm">{opt.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
        </button>
      ))}
    </div>
  )
}
