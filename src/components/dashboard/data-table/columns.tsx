import CircleCheckIcon from "lucide-react/dist/esm/icons/circle-check"
import MoreVerticalIcon from "lucide-react/dist/esm/icons/more-vertical"
import GripVerticalIcon from "lucide-react/dist/esm/icons/grip-vertical"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"
import TrendingUpIcon from "lucide-react/dist/esm/icons/trending-up"
import { useSortable } from "@dnd-kit/sortable"
import { ColumnDef, Row } from "@tanstack/react-table"
import { toast } from "@/lib/toast"
import { useIsMobile } from "@/hooks/use-mobile"
import type { DashboardTableRow } from "@/lib/dashboard/table-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

type InlineField = "target" | "limit"

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function createDashboardColumns(): ColumnDef<DashboardTableRow>[] {
  return [
    {
      id: "drag",
      header: () => null,
      cell: ({ row }) => <DragHandle id={row.original.id} />,
    },
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "header",
      header: "Header",
      cell: ({ row }) => <TableCellViewer item={row.original} />,
      enableHiding: false,
    },
    {
      accessorKey: "type",
      header: "Section Type",
      cell: ({ row }) => (
        <div className="w-32">
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {row.original.type}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.status === "Done" ? (
            <CircleCheckIcon className="text-green-500 dark:text-green-400" />
          ) : (
            <Loader2Icon className="animate-spin" />
          )}
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "target",
      header: () => <div className="w-full text-right">Target</div>,
      cell: ({ row }) => (
        <InlineMetricForm field="target" label="Target" row={row} />
      ),
    },
    {
      accessorKey: "limit",
      header: () => <div className="w-full text-right">Limit</div>,
      cell: ({ row }) => (
        <InlineMetricForm field="limit" label="Limit" row={row} />
      ),
    },
    {
      accessorKey: "reviewer",
      header: "Reviewer",
      cell: ({ row }) => <ReviewerSelect row={row} />,
    },
    {
      id: "actions",
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <MoreVerticalIcon />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Make a copy</DropdownMenuItem>
            <DropdownMenuItem>Favorite</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

export const dashboardTableColumns = createDashboardColumns()

function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <GripVerticalIcon className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

function InlineMetricForm({ field, label, row }: { field: InlineField; label: string; row: Row<DashboardTableRow> }) {
  const id = `${row.original.id}-${field}`

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
          loading: `Saving ${row.original.header}`,
          success: "Done",
          error: "Error",
        })
      }}
    >
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <Input
        className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
        defaultValue={row.original[field]}
        id={id}
      />
    </form>
  )
}

function ReviewerSelect({ row }: { row: Row<DashboardTableRow> }) {
  const id = `${row.original.id}-reviewer`
  const isAssigned = row.original.reviewer !== "Assign reviewer"

  if (isAssigned) {
    return row.original.reviewer
  }

  return (
    <>
      <Label htmlFor={id} className="sr-only">
        Reviewer
      </Label>
      <Select>
        <SelectTrigger
          className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
          size="sm"
          id={id}
        >
          <SelectValue placeholder="Assign reviewer" />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
          <SelectItem value="Jamik Tashpulatov">
            Jamik Tashpulatov
          </SelectItem>
        </SelectContent>
      </Select>
    </>
  )
}

function TableCellViewer({ item }: { item: DashboardTableRow }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.header}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.header}</DrawerTitle>
          <DrawerDescription>
            Showing total visitors for the last 6 months
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Trending up by 5.2% this month{" "}
                  <TrendingUpIcon className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Showing total visitors for the last 6 months. This is just
                  some random text to test the layout. It spans multiple lines
                  and should wrap around.
                </div>
              </div>
              <Separator />
            </>
          )}
          <EditableDetails item={item} />
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function EditableDetails({ item }: { item: DashboardTableRow }) {
  return (
    <form className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Label htmlFor="header">Header</Label>
        <Input id="header" defaultValue={item.header} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="type">Type</Label>
          <Select defaultValue={item.type}>
            <SelectTrigger id="type" className="w-full">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Table of Contents">
                Table of Contents
              </SelectItem>
              <SelectItem value="Executive Summary">
                Executive Summary
              </SelectItem>
              <SelectItem value="Technical Approach">
                Technical Approach
              </SelectItem>
              <SelectItem value="Design">Design</SelectItem>
              <SelectItem value="Capabilities">Capabilities</SelectItem>
              <SelectItem value="Focus Documents">Focus Documents</SelectItem>
              <SelectItem value="Narrative">Narrative</SelectItem>
              <SelectItem value="Cover Page">Cover Page</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="status">Status</Label>
          <Select defaultValue={item.status}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Done">Done</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Not Started">Not Started</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="target">Target</Label>
          <Input id="target" defaultValue={item.target} />
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="limit">Limit</Label>
          <Input id="limit" defaultValue={item.limit} />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Label htmlFor="reviewer">Reviewer</Label>
        <Select defaultValue={item.reviewer}>
          <SelectTrigger id="reviewer" className="w-full">
            <SelectValue placeholder="Select a reviewer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
            <SelectItem value="Jamik Tashpulatov">
              Jamik Tashpulatov
            </SelectItem>
            <SelectItem value="Emily Whalen">Emily Whalen</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </form>
  )
}
