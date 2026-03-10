import { useEffect, useState } from "react"

import type { OrgDocuments } from "../../../types"
import type { DocumentsPolicyEntry } from "../types"

type UseDocumentsTabStateArgs = {
  documents?: OrgDocuments | null
  policyEntries: DocumentsPolicyEntry[]
}

export function useDocumentsTabState({
  documents,
  policyEntries,
}: UseDocumentsTabStateArgs) {
  const [documentsState, setDocumentsState] = useState<OrgDocuments>(documents ?? {})
  const [policiesState, setPoliciesState] = useState<DocumentsPolicyEntry[]>(policyEntries)

  useEffect(() => {
    setDocumentsState(documents ?? {})
  }, [documents])

  useEffect(() => {
    setPoliciesState(policyEntries)
  }, [policyEntries])

  return {
    documentsState,
    setDocumentsState,
    policiesState,
    setPoliciesState,
  }
}
