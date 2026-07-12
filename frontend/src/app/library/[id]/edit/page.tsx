import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { EditUseCaseForm } from '@/components/library/EditUseCaseForm'
import { api } from '@/lib/api'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditUseCasePage({ params }: PageProps) {
  const { id } = await params
  let uc
  try {
    uc = await api.useCases.get(id)
  } catch {
    notFound()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" size="sm" render={<Link href={`/library/${id}`} />} nativeButton={false} className="mb-4 -ml-2 gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Use Case</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Changes to the KQL rule or additional info will trigger a fresh AI enrichment.
        </p>
      </div>

      <Separator />

      <EditUseCaseForm uc={uc} />
    </div>
  )
}
