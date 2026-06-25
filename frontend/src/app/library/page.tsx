import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { LibraryFilters } from '@/components/library/LibraryFilters'
import { UseCaseCard } from '@/components/library/UseCaseCard'
import { api } from '@/lib/api'

interface PageProps {
  searchParams: Promise<Record<string, string>>
}

async function UseCaseGrid({ searchParams }: { searchParams: Record<string, string> }) {
  const data = await api.useCases.list({
    query: searchParams.query,
    severity: searchParams.severity,
    category: searchParams.category,
    difficulty: searchParams.difficulty,
    tag: searchParams.tag,
    page: searchParams.page ? Number(searchParams.page) : 1,
    page_size: 20,
  })

  if (data.items.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg">No use cases found.</p>
        <p className="text-sm mt-1">Try adjusting your filters or add a new use case.</p>
        <Button render={<Link href="/add-use-case" />} nativeButton={false} className="mt-4">
          Add your first use case
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{data.total} use cases</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.items.map((uc) => (
          <UseCaseCard key={uc.id} uc={uc} />
        ))}
      </div>
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-lg" />
      ))}
    </div>
  )
}

export default async function LibraryPage({ searchParams }: PageProps) {
  const resolved = await searchParams

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Use Case Library</h1>
          <p className="text-muted-foreground mt-1">Browse and study your enriched detection use cases.</p>
        </div>
        <Button render={<Link href="/add-use-case" />} nativeButton={false} className="gap-2">
          <Plus className="h-4 w-4" /> Add Use Case
        </Button>
      </div>

      <Suspense fallback={null}>
        <LibraryFilters />
      </Suspense>

      <Suspense fallback={<GridSkeleton />}>
        <UseCaseGrid searchParams={resolved} />
      </Suspense>
    </div>
  )
}
