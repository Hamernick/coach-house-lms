import { describe, expect, it } from "vitest"

import {
  DEFAULT_DOCUMENTS_SORT_STATE,
  getDefaultDocumentsSortDirection,
  resolveNextDocumentsSortState,
} from "@/components/organization/org-profile-card/tabs/documents-tab/hooks/documents-index-sort-state"

describe("documents index sort state", () => {
  it("toggles direction each time the active sort header is clicked", () => {
    const firstClick = resolveNextDocumentsSortState(
      DEFAULT_DOCUMENTS_SORT_STATE,
      "name"
    )
    const secondClick = resolveNextDocumentsSortState(firstClick, "name")
    const thirdClick = resolveNextDocumentsSortState(secondClick, "name")

    expect(firstClick).toEqual({ sortColumn: "name", sortDirection: "asc" })
    expect(secondClick).toEqual({ sortColumn: "name", sortDirection: "desc" })
    expect(thirdClick).toEqual({ sortColumn: "name", sortDirection: "asc" })
  })

  it("uses a descending default when moving to last updated", () => {
    expect(getDefaultDocumentsSortDirection("updatedAt")).toBe("desc")
    expect(
      resolveNextDocumentsSortState(
        { sortColumn: "name", sortDirection: "desc" },
        "updatedAt"
      )
    ).toEqual({ sortColumn: "updatedAt", sortDirection: "desc" })
  })
})
