"use client"

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react"
import {
  getCoreRowModel,
  useReactTable,
  type ColumnSizingState,
} from "@tanstack/react-table"

import { BudgetTableGrid } from "@/components/training/module-detail/budget-table-grid"
import { BudgetTableStackedRows } from "@/components/training/module-detail/budget-table-stacked-rows"
import {
  BUDGET_TABLE_CELL_CLASSES,
  buildBudgetTableColumns,
  fitBudgetTableColumnSizes,
} from "@/components/training/module-detail/budget-table-columns"
import { BUDGET_TABLE_MIN_WIDTH } from "@/components/training/module-detail/budget-table-column-config"
import { cn } from "@/lib/utils"
import type { BudgetTableRow } from "@/lib/modules"

type BudgetTableProps = {
  rows: BudgetTableRow[]
  blankRow: BudgetTableRow
  totals: number[]
  subtotal: number
  costTypeOptions: string[]
  unitOptions: string[]
  unitListId: string
  formatMoney: (value: number) => string
  onUpdateRow: (rowIndex: number, patch: Partial<BudgetTableRow>) => void
  onRowsChange: (rows: BudgetTableRow[]) => void
  onCategoryInputMount?: (
    rowIndex: number,
    input: HTMLInputElement | null
  ) => void
  frameClassName?: string
  layout?: "grid" | "stacked"
  maxBodyHeightClassName?: string
  readOnly?: boolean
}

export function BudgetTable({
  blankRow,
  layout = "grid",
  onRowsChange,
  readOnly = false,
  rows,
  ...props
}: BudgetTableProps) {
  const removeRow = useCallback(
    (rowIndex: number) => {
      const nextRows = [...rows]
      nextRows.splice(rowIndex, 1)
      if (nextRows.length === 0) nextRows.push(blankRow)
      onRowsChange(nextRows)
    },
    [blankRow, onRowsChange, rows]
  )

  if (layout === "stacked") {
    return (
      <BudgetTableStackedRows
        rows={rows}
        {...props}
        readOnly={readOnly}
        onRemoveRow={removeRow}
      />
    )
  }

  return (
    <BudgetTableGridEditor
      rows={rows}
      blankRow={blankRow}
      onRowsChange={onRowsChange}
      onRemoveRow={removeRow}
      readOnly={readOnly}
      {...props}
    />
  )
}

type BudgetTableGridEditorProps = BudgetTableProps & {
  onRemoveRow: (rowIndex: number) => void
}

function BudgetTableGridEditor({
  rows,
  totals,
  subtotal,
  costTypeOptions,
  unitOptions,
  unitListId,
  formatMoney,
  onUpdateRow,
  onRowsChange,
  onRemoveRow,
  onCategoryInputMount,
  frameClassName,
  maxBodyHeightClassName,
  readOnly = false,
}: BudgetTableGridEditorProps) {
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() =>
    fitBudgetTableColumnSizes(BUDGET_TABLE_MIN_WIDTH)
  )
  const [hasMeasuredWidth, setHasMeasuredWidth] = useState(false)
  const [userSized, setUserSized] = useState(false)
  const [draggingRow, setDraggingRow] = useState<number | null>(null)
  const tableFrameRef = useRef<HTMLDivElement | null>(null)
  const totalsRef = useRef(totals)
  const onUpdateRowRef = useRef(onUpdateRow)
  const onRemoveRowRef = useRef(onRemoveRow)
  const onCategoryInputMountRef = useRef(onCategoryInputMount)

  useLayoutEffect(() => {
    totalsRef.current = totals
    onUpdateRowRef.current = onUpdateRow
    onRemoveRowRef.current = onRemoveRow
    onCategoryInputMountRef.current = onCategoryInputMount
  }, [onCategoryInputMount, onRemoveRow, onUpdateRow, totals])

  const getRowTotal = useCallback(
    (rowIndex: number) => totalsRef.current[rowIndex] ?? 0,
    []
  )
  const handleUpdateRow = useCallback(
    (rowIndex: number, patch: Partial<BudgetTableRow>) => {
      onUpdateRowRef.current(rowIndex, patch)
    },
    []
  )
  const handleRemoveRow = useCallback((rowIndex: number) => {
    onRemoveRowRef.current(rowIndex)
  }, [])
  const handleCategoryInputMount = useCallback(
    (rowIndex: number, input: HTMLInputElement | null) => {
      onCategoryInputMountRef.current?.(rowIndex, input)
    },
    []
  )

  useLayoutEffect(() => {
    if (userSized) return
    const node = tableFrameRef.current
    if (!node || typeof ResizeObserver === "undefined") return
    const update = () => {
      const width = Math.round(
        node.getBoundingClientRect().width || node.clientWidth
      )
      if (!width) return
      setColumnSizing(fitBudgetTableColumnSizes(width))
      setHasMeasuredWidth(true)
    }
    update()
    const observer = new ResizeObserver(() => update())
    observer.observe(node)
    return () => observer.disconnect()
  }, [userSized])

  const moveRow = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return
      const nextRows = [...rows]
      const [moved] = nextRows.splice(fromIndex, 1)
      if (!moved) return
      nextRows.splice(toIndex, 0, moved)
      onRowsChange(nextRows)
    },
    [onRowsChange, rows]
  )

  const handleRowDragStart = useCallback(
    (rowIndex: number, event: DragEvent<HTMLButtonElement>) => {
      setDraggingRow(rowIndex)
      event.dataTransfer.effectAllowed = "move"
      event.dataTransfer.setData("text/plain", String(rowIndex))
    },
    []
  )

  const handleRowDrop = useCallback(
    (rowIndex: number, event: DragEvent<HTMLTableRowElement>) => {
      event.preventDefault()
      const payload = event.dataTransfer.getData("text/plain")
      const fromIndex = Number.parseInt(payload, 10)
      if (Number.isNaN(fromIndex)) {
        setDraggingRow(null)
        return
      }
      moveRow(fromIndex, rowIndex)
      setDraggingRow(null)
    },
    [moveRow]
  )

  const handleRowDragEnd = useCallback(() => {
    setDraggingRow(null)
  }, [])

  const columns = useMemo(() => {
    return buildBudgetTableColumns({
      costTypeOptions,
      unitListId,
      getRowTotal,
      formatMoney,
      rowsLength: rows.length,
      onUpdateRow: handleUpdateRow,
      onRemoveRow: handleRemoveRow,
      onCategoryInputMount: handleCategoryInputMount,
      onRowDragStart: handleRowDragStart,
      readOnly,
    })
  }, [
    costTypeOptions,
    unitListId,
    getRowTotal,
    formatMoney,
    rows.length,
    handleUpdateRow,
    handleRemoveRow,
    handleCategoryInputMount,
    handleRowDragStart,
    readOnly,
  ])

  const table = useReactTable({
    data: rows,
    columns,
    state: { columnSizing },
    onColumnSizingChange: (updater) => {
      setColumnSizing((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater
        return next
      })
    },
    columnResizeMode: "onChange",
    columnResizeDirection: "ltr",
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div
      ref={tableFrameRef}
      className={cn(
        "border-border/60 bg-background dark:bg-input/30 min-w-0 overflow-hidden rounded-xl border",
        frameClassName
      )}
    >
      <div
        className={cn(
          "nowheel w-full overflow-auto overscroll-contain",
          maxBodyHeightClassName ?? "max-h-[min(62vh,40rem)]",
          !hasMeasuredWidth && "overflow-hidden"
        )}
      >
        <div className={cn(!hasMeasuredWidth && "invisible")}>
          <BudgetTableGrid
            table={table}
            tableCellClass={BUDGET_TABLE_CELL_CLASSES.tableCellClass}
            draggingRow={draggingRow}
            subtotal={subtotal}
            unitListId={unitListId}
            unitOptions={unitOptions}
            formatMoney={formatMoney}
            onRowDrop={handleRowDrop}
            onRowDragEnd={handleRowDragEnd}
            onStartColumnResize={() => setUserSized(true)}
          />
        </div>
      </div>
    </div>
  )
}
