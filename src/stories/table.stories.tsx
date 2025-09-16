import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"

import type { StoryConfig } from "./types"

const sampleRows = [
  { name: "Orientation", students: 42, completion: "92%" },
  { name: "Module 1", students: 38, completion: "78%" },
  { name: "Module 2", students: 32, completion: "61%" },
]

const tableStories = {
  title: "Design System/Table",
  component: Table,
  tags: ["design-system"],
  states: [
    {
      name: "Analytics",
      render: () => (
        <Table>
          <TableCaption>Class performance overview</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Module</TableHead>
              <TableHead>Active students</TableHead>
              <TableHead className="text-right">Completion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleRows.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.students}</TableCell>
                <TableCell className="text-right">{row.completion}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ),
    },
  ],
} satisfies StoryConfig<typeof Table>

export default tableStories
