import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("documents results table column order", () => {
  it("renders status first, actions last, and no source column", () => {
    const headerSource = readFileSync(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-results-table-header.tsx",
      "utf8"
    )
    const rowSource = readFileSync(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-results-table-row.tsx",
      "utf8"
    )

    expect(headerSource.indexOf('column="status"')).toBeLessThan(
      headerSource.indexOf('column="name"')
    )
    expect(headerSource).not.toContain('column="source"')
    expect(headerSource).not.toContain(">Source<")
    expect(headerSource.indexOf('column="category"')).toBeLessThan(
      headerSource.indexOf('column="updatedAt"')
    )
    expect(headerSource.indexOf('column="updatedAt"')).toBeLessThan(
      headerSource.indexOf('column="visibility"')
    )
    expect(headerSource.indexOf('column="visibility"')).toBeLessThan(
      headerSource.indexOf('columnId="actions"')
    )
    expect(headerSource).not.toContain('className="text-right"')
    expect(rowSource).toContain('className="whitespace-normal"')
    expect(rowSource).not.toContain('className="text-right whitespace-normal"')

    expect(rowSource.indexOf("StatusBadge status={row.status}")).toBeLessThan(
      rowSource.indexOf("row.name")
    )
    expect(rowSource).not.toContain("SOURCE_LABEL[row.source]")
    expect(
      rowSource.indexOf("CategoryBadges categories={row.categories}")
    ).toBeLessThan(rowSource.indexOf("formatUpdatedAt(row.updatedAt)"))
    expect(rowSource.indexOf("formatUpdatedAt(row.updatedAt)")).toBeLessThan(
      rowSource.indexOf("row.visibility")
    )
    expect(rowSource.indexOf("row.visibility")).toBeLessThan(
      rowSource.indexOf("<DocumentRowActions")
    )
  })

  it("keeps document status badge shell neutral", () => {
    const metaSource = readFileSync(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/document-row-meta.tsx",
      "utf8"
    )
    const statusConfigSource = readFileSync(
      "src/components/organization/org-profile-card/tabs/documents-tab/document-status-config.ts",
      "utf8"
    )
    const tableRowSource = readFileSync(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-results-table-row.tsx",
      "utf8"
    )
    const mobileSource = readFileSync(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-results-mobile.tsx",
      "utf8"
    )

    expect(metaSource).toContain(
      "border-border bg-muted/40 text-muted-foreground inline-flex h-6"
    )
    expect(metaSource).toContain(
      "inline-flex h-6 items-center gap-2 rounded-full"
    )
    expect(metaSource).toContain("h-1.5 w-1.5 shrink-0 rounded-full")
    expect(metaSource).toContain("DocumentMetaPill")
    expect(tableRowSource).toContain("DocumentMetaPill")
    expect(mobileSource).toContain("DocumentMetaPill")
    expect(tableRowSource).not.toContain('Badge variant="outline"')
    expect(mobileSource).not.toContain('Badge variant="outline"')
    expect(metaSource).not.toContain("meta.className")
    for (const source of [
      metaSource,
      statusConfigSource,
      tableRowSource,
      mobileSource,
    ]) {
      expect(source).not.toContain("className:")
      expect(source).not.toContain("border-amber")
      expect(source).not.toContain("text-amber")
      expect(source).not.toContain("bg-amber-500/10")
      expect(source).not.toContain("border-sky")
      expect(source).not.toContain("text-sky")
      expect(source).not.toContain("bg-sky-500/15")
      expect(source).not.toContain("bg-sky-500/10")
      expect(source).not.toContain("border-sky-500/30")
      expect(source).not.toContain("border-emerald")
      expect(source).not.toContain("text-emerald")
      expect(source).not.toContain("bg-emerald-500/10")
      expect(source).not.toContain("border-violet")
      expect(source).not.toContain("text-violet")
      expect(source).not.toContain("bg-violet-500/10")
    }
  })
})
