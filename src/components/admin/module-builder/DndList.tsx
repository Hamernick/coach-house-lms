"use client"

import {
  DndContext,
  type DragEndEvent,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

export function DndList<T extends { _id: string }>({
  sensors,
  items,
  render,
  onDragEnd,
  onDelete,
}: {
  sensors: ReturnType<typeof useSensors>
  items: T[]
  render: (item: T) => React.ReactNode
  onDragEnd: (e: DragEndEvent) => void
  onDelete: (index: number) => void
}) {
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.length === 0 ? <li className="text-xs text-muted-foreground">No items yet.</li> : null}
          {items.map((it, idx) => (
            <SortableRow key={it._id} id={it._id} onDelete={() => onDelete(idx)}>
              {render(it)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function SortableRow({ id, children, onDelete }: { id: string; children: React.ReactNode; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <li ref={setNodeRef} style={style} className="flex items-start justify-between gap-2 rounded-md border bg-card/60 p-2">
      <div className="flex-1">
        <button type="button" aria-label="Drag to reorder" className="mr-2 cursor-grab text-muted-foreground" {...attributes} {...listeners}>⋮⋮</button>
        {children}
      </div>
      <div className="flex items-center gap-1">
        <button type="button" className="h-7 w-7 rounded-md bg-destructive text-destructive-foreground" onClick={onDelete}>✕</button>
      </div>
    </li>
  )
}

