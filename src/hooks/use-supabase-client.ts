"use client"

import { useMemo } from "react"

import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export function useSupabaseClient() {
  return useMemo(() => createSupabaseBrowserClient(), [])
}
