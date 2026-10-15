"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { BudgetTableRow } from "@/lib/modules"
import { normalizeRoadmapBudgetRows, roadmapBudgetRowsEqual } from "@/lib/roadmap/budget"
import type { Editor } from "@tiptap/core"
import { collab, getVersion, receiveTransaction, sendableSteps } from "@tiptap/pm/collab"
import { documentCursorsPlugin, documentCursorsKey } from "../lib/cursors"
import { syncDocumentOverHttp } from "../lib/transport"
import { Step } from "@tiptap/pm/transform"
import { leaveOrganizationDocument, loadOrganizationDocumentVersions } from "../server/actions"
import type { DocumentScope, DocumentSyncResult, DocumentParticipant, DocumentTransport } from "../types"

export const defaultDocumentTransport: DocumentTransport = { sync: syncDocumentOverHttp, leave: leaveOrganizationDocument, versions: loadOrganizationDocumentVersions }

type Loaded = Exclude<DocumentSyncResult, { error: string }>
export function useOrganizationDocumentCollaborationController(scope: DocumentScope, userId: string, transport = defaultDocumentTransport, canEdit = true) {
  const [clientId] = useState(() => `${userId}:${crypto.randomUUID()}`)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [savedSection, setSavedSection] = useState<Loaded["section"] | null>(null)
  const initializing = useRef(false)
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState("Connecting…")
  const [error, setError] = useState<string | null>(null)
  const [participants, setParticipants] = useState<DocumentParticipant[]>([])
  const editorRef = useRef<Editor | null>(null)
  const generation = useRef<string | null>(null)
  const busy = useRef(false)
  const mounted = useRef(true)
  const lastSaved = useRef<Loaded | null>(null)
  const blocked = useRef(false)
  const scopeRef = useRef(scope)
  scopeRef.current = scope
  const dirty = useRef(false)
  const budgetDraft = useRef<{ base: BudgetTableRow[]; next: BudgetTableRow[] } | null>(null)
  const [budgetConflict, setBudgetConflict] = useState<BudgetTableRow[] | null>(null)
  const [budgetRows, setBudgetRows] = useState<BudgetTableRow[]>([])

  const acceptSection = useCallback((result: Loaded) => {
    lastSaved.current = result
    setSavedSection(previous => previous?.lastUpdated === result.section.lastUpdated
      && previous?.content === result.section.content
      && roadmapBudgetRowsEqual(previous?.budgetRows ?? [], result.section.budgetRows ?? []) ? previous : result.section)
  }, [])

  const open = useCallback(async () => {
    setError(null)
    setStatus("Connecting…")
    try {
      const result = await transport.sync({ ...scopeRef.current, clientId, version: 0 })
      if (!mounted.current) return
      if ("error" in result) { setError(result.error); setStatus("Not connected"); return }
      setBudgetRows(result.section.budgetRows ?? [])
      setLoaded(result)
      acceptSection(result)
    } catch {
      if (mounted.current) { setError("Unable to open the live document. Try again."); setStatus("Not connected") }
    }
  }, [acceptSection, clientId, transport])

  useEffect(() => {
    mounted.current = true
    void open()
    return () => {
      mounted.current = false
      void transport.leave(scopeRef.current, clientId).catch(() => {})
    }
  }, [clientId, open, transport])

  const onReady = useCallback(async (editor: Editor) => {
    if (!loaded || initializing.current || (editorRef.current === editor && generation.current)) return
    initializing.current = true
    editorRef.current = editor
    try {
      let result = loaded
      if (!result.session && canEdit) {
        const initialized = await transport.sync({ ...scopeRef.current, clientId, version: 0,
          initialDocument: editor.getJSON(), expectedRevision: loaded.section.lastUpdated })
        if (!mounted.current || editor.isDestroyed) return
        if ("error" in initialized) { setError(initialized.error); setStatus("Not connected"); return }
        result = initialized
      }
      if (!mounted.current || editor.isDestroyed) return
      if (result.session) {
        editor.chain().setContent(result.session.document).setMeta("addToHistory", false).run()
        editor.registerPlugin(collab({ version: result.session.version, clientID: clientId }))
        editor.registerPlugin(documentCursorsPlugin())
        generation.current = result.session.generation
      } else if (!canEdit) {
        editor.chain().setContent(result.section.content).setMeta("addToHistory", false).run()
      } else if (canEdit) { setError("Unable to start editing safely."); setStatus("Not connected"); return }
      acceptSection(result)
      setParticipants(result.participants)
      setError(null)
      setReady(true)
      setStatus("Saved")
    } catch {
      if (mounted.current) { setError("Unable to connect the editor. Try again."); setStatus("Not connected") }
    } finally { initializing.current = false }
  }, [acceptSection, loaded, clientId, transport, canEdit])

  const sync = useCallback(async () => {
    const editor = editorRef.current
    if (!editor || editor.isDestroyed || busy.current || blocked.current) return
    if (!generation.current) {
      if (!canEdit) await open()
      return
    }
    let uploading = false
    editor.state.doc.descendants(node => {
      if (node.type.name === "image" && (node.attrs.uploading || String(node.attrs.src).startsWith("blob:"))) uploading = true
    })
    if (uploading) { dirty.current = true; setStatus("Waiting for image upload…"); return }
    busy.current = true
    const pending = sendableSteps(editor.state)
    if (pending || budgetDraft.current) { dirty.current = true; setStatus("Saving…") }
    const sentBudget = budgetDraft.current
    let { anchor, head } = editor.state.selection
    // Report cursor coordinates in the acknowledged document, before local steps.
    for (const step of [...(pending?.steps ?? [])].reverse()) {
      const inverse = step.getMap().invert()
      anchor = inverse.map(anchor); head = inverse.map(head)
    }
    try {
      const result = await transport.sync({ ...scopeRef.current, clientId,
        generation: generation.current, version: getVersion(editor.state),
        budget: sentBudget ?? undefined,
        steps: pending?.steps.slice(0, 200).map(step => step.toJSON()),
        selection: { anchor, head, version: getVersion(editor.state) },
      })
      if (!mounted.current || editor.isDestroyed) return
      if ("error" in result) {
        if ((result.code === "external_change" || result.code === "expired") && !sendableSteps(editor.state) && !budgetDraft.current) {
          setReady(false); setLoaded(null); editorRef.current = null; generation.current = null
          await open()
          return
        }
        setError(result.error)
        setStatus("Not saved")
        if (result.code) blocked.current = true
        if (result.code === "budget_conflict") setBudgetConflict(result.savedBudgetRows ?? [])
        return
      }
      const session = result.session
      if (!session || session.generation !== generation.current) {
        blocked.current = true
        setError("Document changed. Your unsaved edits are retained here.")
        return
      }
      const version = getVersion(editor.state)
      const offset = version - (session.version - session.steps.length)
      const incoming = session.steps.slice(offset)
      if (incoming.length) {
        editor.view.dispatch(receiveTransaction(editor.state,
          incoming.map(item => Step.fromJSON(editor.schema, item.step)),
          incoming.map(item => item.clientId)))
      }
      const cursors = result.participants.filter(person => person.session_id !== clientId).map(person => {
        if (!person.selection || person.selection.version > session.version || person.selection.version < session.version - session.steps.length) return { ...person, selection: null }
        let { anchor, head } = person.selection
        const maps = session.steps.slice(person.selection.version - (session.version - session.steps.length))
          .map(item => Step.fromJSON(editor.schema, item.step).getMap())
        maps.push(...(sendableSteps(editor.state)?.steps.map(step => step.getMap()) ?? []))
        for (const map of maps) { anchor = map.map(anchor); head = map.map(head) }
        return { ...person, selection: { anchor, head, version: getVersion(editor.state) } }
      })
      editor.view.dispatch(editor.state.tr.setMeta(documentCursorsKey, cursors))
      if (sentBudget && roadmapBudgetRowsEqual(result.section.budgetRows ?? [], sentBudget.next)) {
        if (budgetDraft.current === sentBudget) budgetDraft.current = null
        else if (budgetDraft.current) budgetDraft.current = { ...budgetDraft.current, base: result.section.budgetRows ?? [] }
      }
      if (!budgetDraft.current) setBudgetRows(result.section.budgetRows ?? [])
      acceptSection(result)
      dirty.current = Boolean(sendableSteps(editor.state) || budgetDraft.current)
      setParticipants(result.participants)
      setError(null)
      setStatus(dirty.current ? "Saving…" : "Saved")
    } catch {
      if (mounted.current) {
        setStatus("Offline · edits retained")
        setError("Connection interrupted. Keep this editor open; syncing will retry automatically.")
      }
    } finally { busy.current = false }
  }, [acceptSection, canEdit, clientId, open, transport])

  useEffect(() => {
    const editor = editorRef.current
    if (!ready || !editor) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const changed = () => {
      if (!generation.current || !sendableSteps(editor.state)) return
      dirty.current = true
      setStatus("Saving…")
      clearTimeout(timer)
      timer = setTimeout(() => void sync(), 400)
    }
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current || busy.current) { event.preventDefault(); event.returnValue = "" }
    }
    editor.on("transaction", changed)
    window.addEventListener("beforeunload", warn)
    const poll = setInterval(() => void sync(), 2000)
    return () => {
      clearTimeout(timer); clearInterval(poll)
      editor.off("transaction", changed)
      window.removeEventListener("beforeunload", warn)
    }
  }, [ready, sync])

  const retry = useCallback(async () => {
    if (blocked.current) return
    if (!ready) {
      // A failed bootstrap never has local editable work to overwrite.
      setLoaded(null)
      editorRef.current = null
      generation.current = null
      await open()
    } else await sync()
  }, [open, ready, sync])

  const changeBudgetRows = (rows: BudgetTableRow[]) => {
    rows = normalizeRoadmapBudgetRows(rows)
    budgetDraft.current = { base: budgetDraft.current?.base ?? lastSaved.current?.section.budgetRows ?? [], next: rows }
    setBudgetRows(rows); dirty.current = true; setStatus("Saving…")
  }
  const resolveBudgetConflict = (keepMine: boolean) => {
    if (!budgetConflict) return
    if (keepMine && budgetDraft.current) budgetDraft.current = { base: budgetConflict, next: budgetDraft.current.next }
    else { budgetDraft.current = null; setBudgetRows(budgetConflict) }
    setBudgetConflict(null); blocked.current = false; setError(null)
    void sync()
  }
  return { budgetConflict, resolveBudgetConflict, loaded, ready, error, status, participants, onReady, sync, retry, blocked: blocked.current, editorRef, dirty, savedSection, budgetRows, changeBudgetRows }
}
