import type { ProjectNote } from "./data/project-details"

export type ProjectNoteState = {
    items: ProjectNote[]
    localNotes: ProjectNote[]
    savingNoteId?: string
}

type NoteEvent =
    | { type: "sync"; notes: ProjectNote[] }
    | { type: "start"; note: ProjectNote }
    | { type: "saved"; temporaryId: string; noteId: string }
    | { type: "failed"; temporaryId: string; original?: ProjectNote }
    | { type: "remove"; noteId: string }

function upsertNote(notes: ProjectNote[], note: ProjectNote) {
    return notes.some((item) => item.id === note.id)
        ? notes.map((item) => item.id === note.id ? note : item)
        : [note, ...notes]
}

export function projectNoteReducer(state: ProjectNoteState, event: NoteEvent): ProjectNoteState {
    switch (event.type) {
        case "sync": {
            // A server refresh can arrive before create returns its real ID.
            // Defer it while saving so the temporary and real rows never coexist.
            if (state.savingNoteId) return state
            // Keep local saves visible until the refreshed server data catches up.
            const localNotes = state.localNotes.filter((local) =>
                !event.notes.some((note) =>
                    note.id === local.id && note.title === local.title &&
                    (note.content ?? "").trim() === (local.content ?? "").trim(),
                ),
            )
            return { ...state, localNotes, items: localNotes.reduceRight(upsertNote, event.notes) }
        }
        case "start":
            return {
                items: upsertNote(state.items, event.note),
                localNotes: upsertNote(state.localNotes, event.note),
                savingNoteId: event.note.id,
            }
        case "saved": {
            const replace = (note: ProjectNote) => note.id === event.temporaryId
                ? { ...note, id: event.noteId }
                : note
            const items = state.items.map(replace).filter((note, index, notes) =>
                notes.findIndex((item) => item.id === note.id) === index,
            )
            return { items, localNotes: state.localNotes.map(replace) }
        }
        case "failed": {
            const items = event.original
                ? upsertNote(state.items, event.original)
                : state.items.filter((note) => note.id !== event.temporaryId)
            return { items, localNotes: state.localNotes.filter((note) => note.id !== event.temporaryId) }
        }
        case "remove":
            return {
                ...state,
                items: state.items.filter((note) => note.id !== event.noteId),
                localNotes: state.localNotes.filter((note) => note.id !== event.noteId),
            }
    }
}
