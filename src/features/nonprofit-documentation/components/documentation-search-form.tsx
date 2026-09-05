"use client"

import { useEffect, useRef } from "react"
import Form from "next/form"
import SearchIcon from "lucide-react/dist/esm/icons/search"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { DOCUMENTATION_SEARCH_QUERY_LIMIT } from "../lib/documentation-search"

export function DocumentationSearchForm({ query = "" }: { query?: string }) {
  const formRef = useRef<HTMLFormElement>(null)

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
      className="w-full max-w-md"
    >
      <InputGroup>
        <InputGroupInput
          key={query}
          name="q"
          type="search"
          aria-label="Search documentation"
          aria-keyshortcuts="Meta+K Control+K"
          defaultValue={query}
          placeholder="Search guides and tools…"
          maxLength={DOCUMENTATION_SEARCH_QUERY_LIMIT}
          autoComplete="off"
          className="h-11 min-w-0 text-base"
        />
        <InputGroupAddon>
          <Button
            type="submit"
            variant="outline"
            size="icon"
            className="size-11 touch-manipulation"
            aria-label="Search documentation"
          >
            <SearchIcon aria-hidden />
          </Button>
        </InputGroupAddon>
      </InputGroup>
    </Form>
  )
}
