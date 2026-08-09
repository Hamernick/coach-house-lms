import { beforeEach, describe, expect, it, vi } from "vitest"

import type { WorkspaceFinanceCsvImportBatchInput } from "@/features/workspace-finance/lib/csv-import"

const {
  createSupabaseAdminClientMock,
  resolveAuthenticatedAppContextMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  createSupabaseAdminClientMock: vi.fn(),
  resolveAuthenticatedAppContextMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }))
vi.mock("@/lib/auth/request-context", () => ({
  resolveAuthenticatedAppContext: resolveAuthenticatedAppContextMock,
}))
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}))

import {
  createWorkspaceFinanceManualRecord,
  importWorkspaceFinanceCsvBatch,
  updateWorkspaceFinanceRecordProgram,
} from "@/features/workspace-finance/server/actions"

const VALID_RECORD_ID = "30000000-0000-4000-8000-000000000001"
const VALID_PROGRAM_ID = "40000000-0000-4000-8000-000000000001"

const VALID_INPUT: WorkspaceFinanceCsvImportBatchInput = {
  fileFingerprint: "a".repeat(64),
  finalBatch: true,
  records: [
    {
      rowNumber: 2,
      effectiveAt: "2026-08-01T12:00:00.000Z",
      recordType: "donation",
      direction: "in",
      sourceKind: "donations",
      sourceLabel: "Community donor",
      amountCents: 12_500,
      currencyCode: "USD",
    },
  ],
}
const VALID_MANUAL_INPUT = {
  amount: "125.50",
  effectiveDate: "2026-08-08",
  programId: VALID_PROGRAM_ID,
  recordType: "donation",
  sourceLabel: "Community donor",
} as const

describe("workspace Finance CSV import action", () => {
  beforeEach(() => {
    createSupabaseAdminClientMock.mockReset()
    resolveAuthenticatedAppContextMock.mockReset()
    revalidatePathMock.mockReset()
  })

  it("rejects malformed batches before resolving an actor", async () => {
    await expect(
      importWorkspaceFinanceCsvBatch({
        ...VALID_INPUT,
        fileFingerprint: "not-a-fingerprint",
      })
    ).resolves.toEqual({ error: "The CSV import data is invalid." })
    await expect(
      importWorkspaceFinanceCsvBatch({
        ...VALID_INPUT,
        programId: "not-a-program-id",
      })
    ).resolves.toEqual({ error: "The CSV import data is invalid." })
    expect(resolveAuthenticatedAppContextMock).not.toHaveBeenCalled()
  })

  it("authorizes the organization owner before writing scoped rows", async () => {
    const admin = createAdminClient([])
    createSupabaseAdminClientMock.mockReturnValue(admin.client)
    resolveAuthenticatedAppContextMock.mockResolvedValue({
      activeOrg: { orgId: "organization-1", role: "owner" },
      supabase: {},
      user: { id: "owner-1" },
    })

    await expect(importWorkspaceFinanceCsvBatch(VALID_INPUT)).resolves.toEqual({
      ok: true,
      imported: 1,
      skipped: 0,
    })

    expect(admin.orgEq).toHaveBeenCalledWith("org_id", "organization-1")
    expect(admin.providerEq).toHaveBeenCalledWith("external_provider", "csv")
    expect(admin.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        org_id: "organization-1",
        program_id: null,
        record_type: "donation",
        direction: "in",
        source_kind: "donations",
        amount_cents: 12_500,
        status: "recorded",
        external_provider: "csv",
        external_record_id: `${"a".repeat(64)}:2`,
        created_source: "import",
        created_by: "owner-1",
      }),
    ])
    expect(revalidatePathMock).toHaveBeenCalledWith("/workspace")
    expect(revalidatePathMock).toHaveBeenCalledWith("/organization/workspace")
  })

  it("links imports only to a program owned by the active organization", async () => {
    const programId = "40000000-0000-4000-8000-000000000001"
    const admin = createAdminClient([], { id: programId })
    createSupabaseAdminClientMock.mockReturnValue(admin.client)
    resolveAuthenticatedAppContextMock.mockResolvedValue({
      activeOrg: { orgId: "organization-1", role: "owner" },
      supabase: {},
      user: { id: "owner-1" },
    })

    await expect(
      importWorkspaceFinanceCsvBatch({ ...VALID_INPUT, programId })
    ).resolves.toMatchObject({ ok: true, imported: 1 })

    expect(admin.programIdEq).toHaveBeenCalledWith("id", programId)
    expect(admin.programOrgEq).toHaveBeenCalledWith("user_id", "organization-1")
    expect(admin.insert).toHaveBeenCalledWith([
      expect.objectContaining({ program_id: programId }),
    ])

    const foreignProgram = createAdminClient([], null)
    createSupabaseAdminClientMock.mockReturnValue(foreignProgram.client)
    await expect(
      importWorkspaceFinanceCsvBatch({ ...VALID_INPUT, programId })
    ).resolves.toEqual({
      error: "Choose a program from this organization.",
    })
    expect(foreignProgram.insert).not.toHaveBeenCalled()
  })

  it("skips a row already imported from the same file", async () => {
    const externalRecordId = `${"a".repeat(64)}:2`
    const admin = createAdminClient([{ external_record_id: externalRecordId }])
    createSupabaseAdminClientMock.mockReturnValue(admin.client)
    resolveAuthenticatedAppContextMock.mockResolvedValue({
      activeOrg: { orgId: "organization-1", role: "owner" },
      supabase: {},
      user: { id: "owner-1" },
    })

    await expect(importWorkspaceFinanceCsvBatch(VALID_INPUT)).resolves.toEqual({
      ok: true,
      imported: 0,
      skipped: 1,
    })
    expect(admin.insert).not.toHaveBeenCalled()
  })

  it("allows an explicit Finance manager but denies ordinary members", async () => {
    const deniedAccess = createFinanceAccessClient(null)
    resolveAuthenticatedAppContextMock.mockResolvedValueOnce({
      activeOrg: { orgId: "organization-1", role: "admin" },
      supabase: deniedAccess.client,
      user: { id: "admin-1" },
    })

    await expect(importWorkspaceFinanceCsvBatch(VALID_INPUT)).resolves.toEqual({
      error: "Only Finance managers can import records.",
    })
    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled()

    const managerAccess = createFinanceAccessClient("manager")
    const admin = createAdminClient([])
    resolveAuthenticatedAppContextMock.mockResolvedValueOnce({
      activeOrg: { orgId: "organization-1", role: "board" },
      supabase: managerAccess.client,
      user: { id: "manager-1" },
    })
    createSupabaseAdminClientMock.mockReturnValue(admin.client)

    await expect(
      importWorkspaceFinanceCsvBatch(VALID_INPUT)
    ).resolves.toMatchObject({
      ok: true,
      imported: 1,
    })
    expect(managerAccess.orgEq).toHaveBeenCalledWith("org_id", "organization-1")
    expect(managerAccess.memberEq).toHaveBeenCalledWith(
      "member_id",
      "manager-1"
    )
  })

  it("rejects malformed manual records before resolving an actor", async () => {
    await expect(
      createWorkspaceFinanceManualRecord({
        ...VALID_MANUAL_INPUT,
        amount: "0.00",
      })
    ).resolves.toEqual({
      error: "Check the date, amount, source, and record type.",
    })
    expect(resolveAuthenticatedAppContextMock).not.toHaveBeenCalled()
  })

  it("creates one organization-scoped recorded item and returns its row", async () => {
    const admin = createManualRecordAdminClient({ id: VALID_PROGRAM_ID })
    createSupabaseAdminClientMock.mockReturnValue(admin.client)
    resolveAuthenticatedAppContextMock.mockResolvedValue({
      activeOrg: { orgId: "organization-1", role: "owner" },
      supabase: {},
      user: { id: "owner-1" },
    })

    await expect(
      createWorkspaceFinanceManualRecord(VALID_MANUAL_INPUT)
    ).resolves.toEqual({
      ok: true,
      record: {
        id: VALID_RECORD_ID,
        programId: VALID_PROGRAM_ID,
        effectiveAt: "2026-08-08T12:00:00.000Z",
        sourceLabel: "Community donor",
        recordType: "donation",
        typeLabel: "Donation",
        amountCents: 12_550,
        currencyCode: "USD",
        direction: "in",
        status: "recorded",
        sourceKind: "donations",
      },
    })

    expect(admin.insert).toHaveBeenCalledWith({
      org_id: "organization-1",
      program_id: VALID_PROGRAM_ID,
      effective_at: "2026-08-08T12:00:00.000Z",
      record_type: "donation",
      direction: "in",
      source_kind: "donations",
      source_label: "Community donor",
      amount_cents: 12_550,
      currency_code: "USD",
      status: "recorded",
      created_source: "manual",
      created_by: "owner-1",
    })
    expect(revalidatePathMock).toHaveBeenCalledWith("/workspace")
  })

  it("does not create a manual record for a foreign program", async () => {
    const admin = createManualRecordAdminClient(null)
    createSupabaseAdminClientMock.mockReturnValue(admin.client)
    resolveAuthenticatedAppContextMock.mockResolvedValue({
      activeOrg: { orgId: "organization-1", role: "owner" },
      supabase: {},
      user: { id: "owner-1" },
    })

    await expect(
      createWorkspaceFinanceManualRecord(VALID_MANUAL_INPUT)
    ).resolves.toEqual({
      error: "Choose a program from this organization.",
    })
    expect(admin.insert).not.toHaveBeenCalled()
  })

  it("rejects malformed program assignments before resolving an actor", async () => {
    await expect(
      updateWorkspaceFinanceRecordProgram({
        recordId: "not-a-record-id",
        programId: null,
      })
    ).resolves.toEqual({ error: "The Finance record update is invalid." })
    await expect(
      updateWorkspaceFinanceRecordProgram({
        recordId: VALID_RECORD_ID,
        programId: "not-a-program-id",
      })
    ).resolves.toEqual({ error: "The Finance record update is invalid." })
    expect(resolveAuthenticatedAppContextMock).not.toHaveBeenCalled()
  })

  it("assigns a Finance record only to an active-organization program", async () => {
    const admin = createProgramAssignmentAdminClient({
      id: VALID_PROGRAM_ID,
    })
    createSupabaseAdminClientMock.mockReturnValue(admin.client)
    resolveAuthenticatedAppContextMock.mockResolvedValue({
      activeOrg: { orgId: "organization-1", role: "owner" },
      supabase: {},
      user: { id: "owner-1" },
    })

    await expect(
      updateWorkspaceFinanceRecordProgram({
        recordId: VALID_RECORD_ID,
        programId: VALID_PROGRAM_ID,
      })
    ).resolves.toEqual({ ok: true })

    expect(admin.programIdEq).toHaveBeenCalledWith("id", VALID_PROGRAM_ID)
    expect(admin.programOrgEq).toHaveBeenCalledWith("user_id", "organization-1")
    expect(admin.update).toHaveBeenCalledWith({
      program_id: VALID_PROGRAM_ID,
    })
    expect(admin.recordIdEq).toHaveBeenCalledWith("id", VALID_RECORD_ID)
    expect(admin.recordOrgEq).toHaveBeenCalledWith("org_id", "organization-1")
    expect(admin.recordStatusEq).toHaveBeenCalledWith("status", "recorded")
    expect(revalidatePathMock).toHaveBeenCalledWith("/workspace")

    const foreignProgram = createProgramAssignmentAdminClient(null)
    createSupabaseAdminClientMock.mockReturnValue(foreignProgram.client)
    await expect(
      updateWorkspaceFinanceRecordProgram({
        recordId: VALID_RECORD_ID,
        programId: VALID_PROGRAM_ID,
      })
    ).resolves.toEqual({
      error: "Choose a program from this organization.",
    })
    expect(foreignProgram.update).not.toHaveBeenCalled()
  })

  it("clears a Finance record program without a program lookup", async () => {
    const admin = createProgramAssignmentAdminClient(null)
    createSupabaseAdminClientMock.mockReturnValue(admin.client)
    resolveAuthenticatedAppContextMock.mockResolvedValue({
      activeOrg: { orgId: "organization-1", role: "owner" },
      supabase: {},
      user: { id: "owner-1" },
    })

    await expect(
      updateWorkspaceFinanceRecordProgram({
        recordId: VALID_RECORD_ID,
        programId: null,
      })
    ).resolves.toEqual({ ok: true })

    expect(admin.from).not.toHaveBeenCalledWith("programs")
    expect(admin.update).toHaveBeenCalledWith({ program_id: null })
  })
})

function createAdminClient(
  existingRows: Array<{ external_record_id: string | null }>,
  program: { id: string } | null = null
) {
  const returns = vi.fn().mockResolvedValue({ data: existingRows, error: null })
  const inIds = vi.fn(() => ({ returns }))
  const providerEq = vi.fn(() => ({ in: inIds }))
  const orgEq = vi.fn(() => ({ eq: providerEq }))
  const select = vi.fn(() => ({ eq: orgEq }))
  const insert = vi.fn().mockResolvedValue({ error: null })
  const programMaybeSingle = vi.fn().mockResolvedValue({
    data: program,
    error: null,
  })
  const programOrgEq = vi.fn(() => ({ maybeSingle: programMaybeSingle }))
  const programIdEq = vi.fn(() => ({ eq: programOrgEq }))
  const programSelect = vi.fn(() => ({ eq: programIdEq }))
  return {
    client: {
      from: vi.fn((table: string) =>
        table === "programs" ? { select: programSelect } : { insert, select }
      ),
    },
    insert,
    orgEq,
    providerEq,
    programIdEq,
    programOrgEq,
  }
}

function createFinanceAccessClient(accessLevel: "manager" | null) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: accessLevel ? { access_level: accessLevel } : null,
  })
  const accessLevelEq = vi.fn(() => ({ maybeSingle }))
  const memberEq = vi.fn(() => ({ eq: accessLevelEq }))
  const orgEq = vi.fn(() => ({ eq: memberEq }))
  const select = vi.fn(() => ({ eq: orgEq }))
  return {
    client: { from: vi.fn(() => ({ select })) },
    memberEq,
    orgEq,
  }
}

function createProgramAssignmentAdminClient(program: { id: string } | null) {
  const programMaybeSingle = vi.fn().mockResolvedValue({
    data: program,
    error: null,
  })
  const programOrgEq = vi.fn(() => ({ maybeSingle: programMaybeSingle }))
  const programIdEq = vi.fn(() => ({ eq: programOrgEq }))
  const programSelect = vi.fn(() => ({ eq: programIdEq }))

  const recordMaybeSingle = vi.fn().mockResolvedValue({
    data: { id: VALID_RECORD_ID },
    error: null,
  })
  const recordSelect = vi.fn(() => ({ maybeSingle: recordMaybeSingle }))
  const recordStatusEq = vi.fn(() => ({ select: recordSelect }))
  const recordOrgEq = vi.fn(() => ({ eq: recordStatusEq }))
  const recordIdEq = vi.fn(() => ({ eq: recordOrgEq }))
  const update = vi.fn(() => ({ eq: recordIdEq }))
  const from = vi.fn((table: string) =>
    table === "programs" ? { select: programSelect } : { update }
  )

  return {
    client: { from },
    from,
    programIdEq,
    programOrgEq,
    recordIdEq,
    recordOrgEq,
    recordStatusEq,
    update,
  }
}

function createManualRecordAdminClient(program: { id: string } | null) {
  const programMaybeSingle = vi.fn().mockResolvedValue({
    data: program,
    error: null,
  })
  const programOrgEq = vi.fn(() => ({ maybeSingle: programMaybeSingle }))
  const programIdEq = vi.fn(() => ({ eq: programOrgEq }))
  const programSelect = vi.fn(() => ({ eq: programIdEq }))

  const single = vi.fn().mockResolvedValue({
    data: { id: VALID_RECORD_ID },
    error: null,
  })
  const recordSelect = vi.fn(() => ({ single }))
  const insert = vi.fn(() => ({ select: recordSelect }))
  const from = vi.fn((table: string) =>
    table === "programs" ? { select: programSelect } : { insert }
  )

  return {
    client: { from },
    insert,
  }
}
