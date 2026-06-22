import type {
  UseCaseCreatePayload,
  UseCaseDetail,
  UseCaseListResponse,
  Challenge,
  Evaluation,
} from '@/types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

// ── Use Cases ──────────────────────────────────────────────────────────────

export const api = {
  useCases: {
    list(params: Record<string, string | number | undefined> = {}): Promise<UseCaseListResponse> {
      const qs = new URLSearchParams()
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') qs.set(k, String(v))
      }
      return request<UseCaseListResponse>(`/use-cases?${qs}`)
    },

    get(id: string): Promise<UseCaseDetail> {
      return request<UseCaseDetail>(`/use-cases/${id}`)
    },

    create(payload: UseCaseCreatePayload): Promise<UseCaseDetail> {
      return request<UseCaseDetail>('/use-cases/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },

    delete(id: string): Promise<void> {
      return request<void>(`/use-cases/${id}`, { method: 'DELETE' })
    },

    triggerEnrichment(id: string): Promise<{ status: string; message: string }> {
      return request(`/use-cases/${id}/enrich`, { method: 'POST' })
    },
  },

  practice: {
    generateChallenge(payload: {
      difficulty: string
      source_use_case_id?: string
      user_id?: string
    }): Promise<Challenge> {
      return request<Challenge>('/practice/challenge', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },

    getChallenge(id: string): Promise<Challenge> {
      return request<Challenge>(`/practice/challenge/${id}`)
    },

    submitKql(payload: {
      challenge_id: string
      submitted_kql: string
      user_id?: string
      started_at?: string
    }): Promise<Evaluation> {
      return request<Evaluation>('/practice/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },

    getHint(challenge_id: string, hint_index: number): Promise<{ hint: string; hints_remaining: number }> {
      return request('/practice/hint', {
        method: 'POST',
        body: JSON.stringify({ challenge_id, hint_index }),
      })
    },
  },
}
