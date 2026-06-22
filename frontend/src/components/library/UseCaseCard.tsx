import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SeverityBadge } from './SeverityBadge'
import { EnrichmentStatus } from './EnrichmentStatus'
import type { UseCaseListItem } from '@/types'

export function UseCaseCard({ uc }: { uc: UseCaseListItem }) {
  return (
    <Link href={`/library/${uc.id}`}>
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{uc.title}</CardTitle>
            <SeverityBadge severity={uc.severity} />
          </div>
          <p className="text-xs text-muted-foreground">{uc.alert_name}</p>
        </CardHeader>
        <CardContent className="space-y-3">
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
    </Link>
  )
}
