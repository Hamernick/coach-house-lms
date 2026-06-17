import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import {
  clampDocumentsResultsTableColumnWidth,
  DEFAULT_DOCUMENTS_RESULTS_TABLE_COLUMN_WIDTHS,
  DOCUMENTS_RESULTS_TABLE_COLUMNS,
  DOCUMENTS_RESULTS_TABLE_COLUMN_WIDTH_STORAGE_KEY,
  sanitizeDocumentsResultsTableColumnWidths,
} from "@/components/organization/org-profile-card/tabs/documents-tab/components/documents-results-table-columns"

describe("documents results table column resizing", () => {
  it("defines the visible desktop columns with bounded default widths", () => {
    expect(DOCUMENTS_RESULTS_TABLE_COLUMNS.map((column) => column.id)).toEqual([
      "status",
      "name",
      "category",
      "updatedAt",
      "visibility",
      "actions",
    ])
    expect(DOCUMENTS_RESULTS_TABLE_COLUMN_WIDTH_STORAGE_KEY).toBe(
      "coach-house.documents-results-table.column-widths.v1"
    )
    expect(DEFAULT_DOCUMENTS_RESULTS_TABLE_COLUMN_WIDTHS.name).toBe(360)
    expect(DEFAULT_DOCUMENTS_RESULTS_TABLE_COLUMN_WIDTHS.actions).toBe(216)
    expect(clampDocumentsResultsTableColumnWidth("name", 200)).toBe(300)
    expect(clampDocumentsResultsTableColumnWidth("name", 900)).toBe(720)
    expect(clampDocumentsResultsTableColumnWidth("actions", 120)).toBe(196)
    expect(
      sanitizeDocumentsResultsTableColumnWidths({
        status: 140,
        name: 500,
        actions: 999,
      })
    ).toMatchObject({
      status: 140,
      name: 500,
      actions: 360,
    })
  })

  it("wires column widths through a colgroup and accessible resize handles", () => {
    const documentsTabSource = readFileSync(
      "src/components/organization/org-profile-card/tabs/documents-tab.tsx",
      "utf8"
    )
    const tableSource = readFileSync(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-results-table.tsx",
      "utf8"
    )
    const headerSource = readFileSync(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-results-table-header.tsx",
      "utf8"
    )
    const rowSource = readFileSync(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-results-table-row.tsx",
      "utf8"
    )
    const uploadActionsSource = readFileSync(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/upload-row-actions.tsx",
      "utf8"
    )
    const policyActionsSource = readFileSync(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/policy-row-actions.tsx",
      "utf8"
    )
    const roadmapActionsSource = readFileSync(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/roadmap-row-actions.tsx",
      "utf8"
    )
    const rowActionStylesSource = readFileSync(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/document-row-action-styles.ts",
      "utf8"
    )
    const mobileSource = readFileSync(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-results-mobile.tsx",
      "utf8"
    )

    expect(documentsTabSource).toContain("DOCUMENTS_INDEX_CARD_CLASSNAME")
    expect(documentsTabSource).toContain(
      "border border-border/60 bg-muted relative w-full rounded-[2rem] p-3 shadow-sm"
    )
    expect(documentsTabSource).toContain("DOCUMENTS_INDEX_BODY_CLASSNAME")
    expect(documentsTabSource).toContain(
      "bg-background border-border/60 overflow-hidden rounded-[1.45rem] border p-0 first:pt-0"
    )
    expect(documentsTabSource).toContain(
      '<Card id="documents-index" className={DOCUMENTS_INDEX_CARD_CLASSNAME}>'
    )
    expect(documentsTabSource).toContain(
      "<CardContent className={DOCUMENTS_INDEX_BODY_CLASSNAME}>"
    )

    expect(tableSource).toContain("<colgroup>")
    expect(tableSource).toContain("DOCUMENTS_RESULTS_TABLE_COLUMNS.map")
    expect(tableSource).toContain('<div className="hidden w-full md:block">')
    expect(tableSource).toContain(
      'className="w-full table-fixed border-collapse"'
    )
    expect(tableSource).toContain("style={{ minWidth: tableWidth }}")
    expect(tableSource).not.toContain("style={{ width: tableWidth }}")
    expect(tableSource).toContain("columnWidths={columnWidths}")
    expect(tableSource).toContain("window.localStorage.getItem")
    expect(tableSource).toContain("window.localStorage.setItem")
    expect(tableSource).toContain(
      "onColumnWidthChange={handleColumnWidthChange}"
    )

    expect(headerSource).toContain("function ResizableTableHead")
    expect(headerSource).toContain('role="separator"')
    expect(headerSource).toContain('aria-orientation="vertical"')
    expect(headerSource).toContain("aria-valuemin")
    expect(headerSource).toContain("aria-valuemax")
    expect(headerSource).toContain("aria-valuenow")
    expect(headerSource).toContain("onPointerDown={handlePointerDown}")
    expect(headerSource).toContain("onKeyDown={handleKeyDown}")
    expect(headerSource).toContain("w-2 cursor-col-resize")
    expect(headerSource).not.toContain("w-6 cursor-col-resize")
    expect(headerSource).toContain("KEYBOARD_RESIZE_STEP")
    expect(headerSource).toContain("group/column-head")

    expect(rowSource).toContain("style={{ width: columnWidths.actions }}")
    expect(mobileSource).toContain('presentation="mobile"')
    expect(rowActionStylesSource).toContain(
      "DOCUMENT_ROW_FRAME_ICON_BUTTON_CLASSNAME"
    )
    expect(rowActionStylesSource).toContain("border-border/60 bg-muted/70")
    expect(rowActionStylesSource).toContain("rounded-full border shadow-sm")
    expect(rowActionStylesSource).toContain(
      "DOCUMENT_ROW_MOBILE_ACTION_BUTTON_CLASSNAME"
    )
    expect(rowActionStylesSource).toContain(
      "h-7 max-w-full overflow-visible rounded-full"
    )
    expect(rowActionStylesSource).toContain(
      "border-transparent bg-muted/55 px-2.5 py-1"
    )
    expect(rowActionStylesSource).toContain(
      "transition-[background-color,color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]"
    )
    expect(rowActionStylesSource).toContain("shadow-none")
    expect(rowActionStylesSource).toContain(
      "DOCUMENT_ROW_MOBILE_DESTRUCTIVE_ACTION_BUTTON_CLASSNAME"
    )
    for (const source of [
      uploadActionsSource,
      policyActionsSource,
      roadmapActionsSource,
    ]) {
      expect(source).toContain("getDocumentRowActionsClassName(presentation)")
      expect(source).not.toContain("justify-end")
      expect(source).not.toContain("min-w-[170px]")
      expect(source).not.toContain("min-w-[180px]")
    }
    for (const source of [uploadActionsSource, policyActionsSource]) {
      expect(source).toContain("getDocumentRowActionButtonClassName")
      expect(source).toContain("getDocumentRowActionButtonSize")
      expect(source).toContain("shouldShowDocumentRowActionLabel")
      expect(source).toContain('variant="ghost"')
      expect(source).not.toContain(`size="icon"
              variant="secondary"`)
      expect(source).not.toContain('className="h-8 w-8"')
    }
    expect(uploadActionsSource).toContain(
      '<span className="truncate">View</span>'
    )
    expect(uploadActionsSource).toContain(
      '<span className="truncate">Download</span>'
    )
    expect(uploadActionsSource).toContain(
      '<span className="truncate">Manage</span>'
    )
    expect(policyActionsSource).toContain(
      '<span className="truncate">Delete</span>'
    )
    expect(roadmapActionsSource).toContain("mobileButtonClassName")
    expect(uploadActionsSource).toContain('size="sm"')
    expect(uploadActionsSource).toContain(
      '{isUploading ? "Uploading…" : "Upload"}'
    )
  })
})
