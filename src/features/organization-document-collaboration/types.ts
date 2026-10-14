import type { BudgetTableRow } from "@/lib/modules"
import type { JSONContent } from "@tiptap/core"
import type { RoadmapSection } from "@/lib/roadmap"
export type DocumentScope = { organizationId: string; sectionId: string }
export type DocumentStep = { step: Record<string, unknown>; clientId: string }
export type DocumentSession = {
  generation: string; version: number; document: JSONContent; steps: DocumentStep[];
  section_revision: string | null; section_content: string
}
export type DocumentParticipant = {
  session_id: string; actor_id: string; display_name: string; role: string; mode: "viewing" | "editing";
  selection: { anchor: number; head: number; version: number } | null
}
export type DocumentSyncInput = DocumentScope & {
  clientId: string; generation?: string; version: number;
  steps?: Record<string, unknown>[]; initialDocument?: JSONContent;
  expectedRevision?: string | null;
  budget?: { base: BudgetTableRow[]; next: BudgetTableRow[] };
  selection?: DocumentParticipant["selection"];
}
export type DocumentSyncResult = { error: string; code?: "external_change" | "expired" | "budget_conflict"; savedBudgetRows?: BudgetTableRow[] } | {
  section: RoadmapSection; session: DocumentSession | null;
  participants: DocumentParticipant[]; userId: string
}
export type DocumentVersion = { id: string; created_at: string; actor_id: string | null; actor_name?: string; content: Record<string, unknown> | null }

export type DocumentTransport = {
  sync: (input: DocumentSyncInput) => Promise<DocumentSyncResult>;
  leave: (scope: DocumentScope, clientId: string) => Promise<void>;
  versions: (scope: DocumentScope) => Promise<{ versions: DocumentVersion[] } | { error: string }>;
}
