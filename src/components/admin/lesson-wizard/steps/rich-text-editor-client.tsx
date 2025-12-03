"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const RichTextEditor = dynamic(() => import("@/components/rich-text-editor").then((m) => m.RichTextEditor), {
  ssr: false,
  loading: () => <Skeleton className="h-40 w-full" />,
})

export { RichTextEditor }

