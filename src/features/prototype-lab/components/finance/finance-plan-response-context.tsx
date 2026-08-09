"use client"

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import type { FinancePlanResponse } from "@/lib/prototype-lab/finance-plan-response"

const ENDPOINT = "/api/prototypes/finance-plan-responses"
export const FINANCE_PLAN_RESPONSE_ENABLED =
  process.env.NODE_ENV !== "production"

type FinancePlanResponsePayload = {
  responses?: FinancePlanResponse[]
  error?: string
}

type FinancePlanResponseContextValue = {
  addResponse: (response: FinancePlanResponse) => void
  error: string | null
  loading: boolean
  responses: FinancePlanResponse[]
}

const FinancePlanResponseContext =
  createContext<FinancePlanResponseContextValue | null>(null)

export function FinancePlanResponseProvider({
  children,
}: {
  children: ReactNode
}) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(FINANCE_PLAN_RESPONSE_ENABLED)
  const [responses, setResponses] = useState<FinancePlanResponse[]>([])

  useEffect(() => {
    if (!FINANCE_PLAN_RESPONSE_ENABLED) return
    const controller = new AbortController()

    void fetch(ENDPOINT, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response
          .json()
          .catch(() => ({}))) as FinancePlanResponsePayload
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load replies.")
        }
        setResponses(payload.responses ?? [])
      })
      .catch((requestError: unknown) => {
        if ((requestError as Error).name !== "AbortError") {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load replies."
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  const addResponse = useCallback((response: FinancePlanResponse) => {
    setResponses((current) => [response, ...current])
  }, [])
  const value = useMemo(
    () => ({ addResponse, error, loading, responses }),
    [addResponse, error, loading, responses]
  )

  return (
    <FinancePlanResponseContext.Provider value={value}>
      {children}
    </FinancePlanResponseContext.Provider>
  )
}

export function useFinancePlanResponses() {
  const value = useContext(FinancePlanResponseContext)
  if (!value) {
    throw new Error(
      "useFinancePlanResponses must be used within FinancePlanResponseProvider."
    )
  }
  return value
}
