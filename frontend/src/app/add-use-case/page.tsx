import { AddUseCaseForm } from '@/components/add-use-case/AddUseCaseForm'

export default function AddUseCasePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Use Case</h1>
        <p className="text-muted-foreground mt-1">
          Paste a Sentinel analytics rule. AI will generate detection overviews, KQL explanations,
          investigation guides, and learning recommendations.
        </p>
      </div>
      <AddUseCaseForm />
    </div>
  )
}
