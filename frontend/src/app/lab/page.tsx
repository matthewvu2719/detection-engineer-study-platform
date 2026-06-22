import { Suspense } from 'react'
import { DetectionLab } from '@/components/lab/DetectionLab'

interface PageProps {
  searchParams: Promise<{ use_case_id?: string }>
}

export default async function LabPage({ searchParams }: PageProps) {
  const { use_case_id } = await searchParams

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Detection Engineering Lab</h1>
        <p className="text-muted-foreground mt-1">
          Practice writing Sentinel KQL. Generate a challenge, write your detection, and get AI feedback.
        </p>
      </div>
      <Suspense>
        <DetectionLab initialUseCaseId={use_case_id} />
      </Suspense>
    </div>
  )
}
