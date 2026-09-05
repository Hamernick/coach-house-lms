"use client"

import { useEffect, useRef } from "react"
import Form from "next/form"
import { usePathname, useSearchParams } from "next/navigation"

import { SearchInput } from "@/components/ui/search-input"
import {
  DOCUMENTATION_SEARCH_QUERY_LIMIT,
  sanitizeDocumentationQuery,
} from "../lib/documentation-search"

export function DocumentationSearchForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const query = sanitizeDocumentationQuery(
    pathname === "/documentation/search" ? searchParams.get("q") : ""
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k" &&
        !event.altKey &&
        !event.shiftKey &&
        !event.isComposing &&
        !event.defaultPrevented
      ) {
        event.preventDefault()
        const input =
          formRef.current?.querySelector<HTMLInputElement>('input[name="q"]')
        input?.focus()
        input?.select()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <Form
      ref={formRef}
      action="/documentation/search"
      prefetch={false}
      role="search"
      aria-label="Documentation"
      className="min-w-0 flex-1 lg:max-w-56 xl:max-w-64"
    >
      <SearchInput
        key={`${pathname}:${query}`}
        name="q"
        aria-label="Search documentation"
        aria-keyshortcuts="Meta+K Control+K"
        defaultValue={query}
        placeholder="Search docs…"
        maxLength={DOCUMENTATION_SEARCH_QUERY_LIMIT}
        autoComplete="off"
        submitLabel="Search documentation"
      />
    </Form>
  )
}
