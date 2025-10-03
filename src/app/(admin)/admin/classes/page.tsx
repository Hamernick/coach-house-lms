import Link from "next/link"

import { PaginationControls } from "@/components/dashboard/pagination-controls"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listClasses } from "@/lib/classes"

import { ClassPublishedToggle } from "./_components/class-published-toggle"
import { createClassAction, deleteClassAction } from "./actions"

const PAGE_SIZE = 12

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function AdminClassesPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const params = searchParams ? await searchParams : {}
  const pageParam = params?.page
  const parsedPage = typeof pageParam === "string" ? Number.parseInt(pageParam, 10) : NaN
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const result = await listClasses({ page, pageSize: PAGE_SIZE })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Classes</h1>
          <p className="text-sm text-muted-foreground">
            Manage class content, publication state, and modules.
          </p>
        </div>
        <form action={createClassAction}>
          <Button type="submit">New Class</Button>
        </form>
      </div>
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[30%]">Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  No classes yet. Create one to get started.
                </TableCell>
              </TableRow>
            ) : null}
            {result.items.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/20">
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.slug}</TableCell>
                <TableCell className="text-sm">{item.moduleCount}</TableCell>
                <TableCell>
                  <ClassPublishedToggle classId={item.id} published={item.published} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/classes/${item.id}`}>Edit</Link>
                    </Button>
                    <form action={deleteClassAction} className="inline">
                      <input type="hidden" name="classId" value={item.id} />
                      <Button size="sm" variant="destructive">
                        Delete
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationControls
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          basePath="/admin/classes"
        />
      </div>
    </div>
  )
}
