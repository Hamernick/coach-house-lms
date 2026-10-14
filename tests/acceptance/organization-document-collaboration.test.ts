import { describe, expect, it } from "vitest"
import { EditorState } from "@tiptap/pm/state"
import { collab, getVersion, receiveTransaction, sendableSteps } from "@tiptap/pm/collab"
import { history, undo } from "@tiptap/pm/history"
import { Step } from "@tiptap/pm/transform"
import { applyDocumentSteps } from "@/features/organization-document-collaboration/lib"
import { documentSchema, serializeDocument } from "@/features/organization-document-collaboration/lib/schema"
import type { DocumentSession } from "@/features/organization-document-collaboration/types"

const paragraph = (text: string) => documentSchema.node("doc", null, [documentSchema.node("paragraph", null, text ? documentSchema.text(text) : undefined)])
const client = (id: string) => EditorState.create({ doc: paragraph("Hello"), plugins: [history(), collab({ clientID: id })] })
function state() : DocumentSession {
  return { generation: "test", version: 0, document: paragraph("Hello").toJSON(), steps: [], section_revision: null, section_content: "<p>Hello</p>" }
}
function receive(local: EditorState, remote: DocumentSession) {
  const incoming = remote.steps.slice(getVersion(local) - (remote.version - remote.steps.length))
  return local.apply(receiveTransaction(local, incoming.map(({ step }) => Step.fromJSON(documentSchema, step)), incoming.map(({ clientId }) => clientId)))
}

describe("core document simultaneous editing", () => {
  it("rebases two same-position edits without losing either contribution", () => {
    let a = client("coach"), b = client("member"), server = state()
    a = a.apply(a.tr.insertText(" coach", 6))
    b = b.apply(b.tr.insertText(" member", 6))
    server = applyDocumentSteps(server, sendableSteps(a)!.steps.map(step => step.toJSON()), "coach")
    a = receive(a, server)
    b = receive(b, server)
    server = applyDocumentSteps(server, sendableSteps(b)!.steps.map(step => step.toJSON()), "member")
    a = receive(a, server); b = receive(b, server)
    expect(a.doc.eq(b.doc)).toBe(true)
    expect(a.doc.textContent).toContain("coach")
    expect(a.doc.textContent).toContain("member")
    expect(sendableSteps(a)).toBeNull()
    expect(sendableSteps(b)).toBeNull()
    expect(getVersion(a)).toBe(2)
  })
  it("local undo preserves another editor's saved contribution", () => {
    let a = client("coach"), b = client("member"), server = state()
    a = a.apply(a.tr.insertText(" coach", 6))
    server = applyDocumentSteps(server, sendableSteps(a)!.steps.map(step => step.toJSON()), "coach")
    a = receive(a, server); b = receive(b, server)
    b = b.apply(b.tr.insertText(" member", b.doc.content.size - 1))
    server = applyDocumentSteps(server, sendableSteps(b)!.steps.map(step => step.toJSON()), "member")
    a = receive(a, server); b = receive(b, server)
    undo(a, transaction => { a = a.apply(transaction) })
    expect(a.doc.textContent).toContain("member")
    expect(a.doc.textContent).not.toContain("coach")
  })
  it("duplicate acknowledgement does not duplicate text", () => {
    let a = client("coach")
    a = a.apply(a.tr.insertText(" once", 6))
    const server = applyDocumentSteps(state(), sendableSteps(a)!.steps.map(step => step.toJSON()), "coach")
    a = receive(a, server); a = receive(a, server)
    expect(a.doc.textContent).toBe("Hello once")
  })
  it("rejects malformed steps and invalid documents", () => {
    expect(() => applyDocumentSteps(state(), [{ stepType: "unknown" }], "coach")).toThrow()
    expect(() => applyDocumentSteps({ ...state(), document: { type: "untrusted" } }, [], "coach")).toThrow()
    expect(() => applyDocumentSteps(state(), Array(201).fill({}), "coach")).toThrow()
  })
  it("serializes nested content and escapes text without a browser DOM", () => {
    const doc = paragraph('<script>"&')
    expect(serializeDocument(doc)).toBe('<p>&lt;script&gt;&quot;&amp;</p>')
  })
})
