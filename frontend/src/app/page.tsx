import Link from 'next/link'
import { Shield, BookOpen, FlaskConical, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const MODULES = [
  {
    icon: Shield,
    title: 'Add Use Case',
    description:
      'Paste a Sentinel analytics rule and let AI generate detection overviews, KQL explanations, investigation guides, and Microsoft Learn recommendations.',
    href: '/add-use-case',
    cta: 'Add a use case',
  },
  {
    icon: BookOpen,
    title: 'Use Case Library',
    description:
      'Browse your enriched detection use cases. Search, filter by severity, category, or tags, and deep-dive into any rule.',
    href: '/library',
    cta: 'Browse library',
  },
  {
    icon: FlaskConical,
    title: 'Detection Lab',
    description:
      'Practice writing Sentinel KQL. Get AI-generated challenges, submit your query, and receive detailed feedback with scores and a reference solution.',
    href: '/lab',
    cta: 'Start practicing',
  },
]

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-16 py-12">
      <div className="text-center space-y-4 max-w-2xl">
        <div className="flex justify-center">
          <Shield className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Sentinel Detection Learning Platform
        </h1>
        <p className="text-lg text-muted-foreground">
          An AI-powered tutor for aspiring Detection Engineers. Learn Sentinel analytics rules,
          master KQL, and practice writing real detections.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {MODULES.map((mod) => {
          const Icon = mod.icon
          return (
            <Card key={mod.href} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{mod.title}</CardTitle>
                </div>
                <CardDescription>{mod.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <Button render={<Link href={mod.href} />} nativeButton={false} className="w-full gap-2">
                  {mod.cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
