"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { useSupabaseClient } from "@/hooks/use-supabase-client"

import {
  resolveGoogleAuthErrorMessage,
  sanitizeGoogleSignupMetadata,
} from "../lib"
import type { GoogleAuthMode, GoogleSignupInput } from "../types"

function encodeBase64Url(bytes: Uint8Array) {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return window
    .btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "")
}

async function createGoogleNonce() {
  const randomBytes = window.crypto.getRandomValues(new Uint8Array(32))
  const nonce = encodeBase64Url(randomBytes)
  const digest = await window.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(nonce)
  )

  return {
    nonce,
    nonceHash: Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join(""),
  }
}

type UseGoogleAuthControllerInput = {
  mode: GoogleAuthMode
  redirectTo: string
  accountIntent?: string
  intentFocus?: GoogleSignupInput["intentFocus"]
  signUpMetadata?: Record<string, unknown>
  disabled?: boolean
}

export function useGoogleAuthController({
  mode,
  redirectTo,
  accountIntent,
  intentFocus,
  signUpMetadata,
  disabled = false,
}: UseGoogleAuthControllerInput) {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const nonceRef = useRef<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleCredential = useCallback(
    async (credential: string) => {
      const nonce = nonceRef.current
      if (!nonce || isPending) return

      setIsPending(true)
      setErrorMessage(null)

      try {
        if (mode === "signup") {
          const provisionResponse = await fetch("/api/auth/google/signup", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              credential,
              nonce,
              acceptedLegal: true,
              accountIntent: accountIntent ?? "founder_exec",
              intentFocus: intentFocus ?? "build",
              signUpMetadata: sanitizeGoogleSignupMetadata(signUpMetadata),
            }),
          })
          const provisionResult = provisionResponse.ok
            ? ({ ok: true } as const)
            : ({
                ok: false,
                code:
                  provisionResponse.status === 400
                    ? ("invalid" as const)
                    : ("unavailable" as const),
              } as const)

          if (!provisionResult.ok) {
            setErrorMessage(
              resolveGoogleAuthErrorMessage({
                mode,
                result: provisionResult,
              })
            )
            return
          }
        }

        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: credential,
          nonce,
        })

        if (error) {
          setErrorMessage(resolveGoogleAuthErrorMessage({ mode }))
          return
        }

        router.replace(redirectTo)
        router.refresh()
      } catch {
        setErrorMessage(resolveGoogleAuthErrorMessage({ mode }))
      } finally {
        setIsPending(false)
      }
    },
    [
      accountIntent,
      intentFocus,
      isPending,
      mode,
      redirectTo,
      router,
      signUpMetadata,
      supabase,
    ]
  )

  const initializeButton = useCallback(
    async (element: HTMLElement) => {
      if (
        !scriptReady ||
        disabled ||
        !window.google?.accounts.id ||
        !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      ) {
        return
      }

      const { nonce, nonceHash } = await createGoogleNonce()
      nonceRef.current = nonce
      element.replaceChildren()

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: ({ credential }) => void handleCredential(credential),
        nonce: nonceHash,
        context: mode === "signup" ? "signup" : "signin",
        ux_mode: "popup",
        auto_select: false,
        cancel_on_tap_outside: true,
      })
      window.google.accounts.id.renderButton(element, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: mode === "signup" ? "signup_with" : "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: Math.min(400, Math.max(220, element.clientWidth)),
      })
    },
    [disabled, handleCredential, mode, scriptReady]
  )

  useEffect(() => {
    setErrorMessage(null)
  }, [mode])

  return {
    errorMessage,
    initializeButton,
    isPending,
    scriptReady,
    setErrorMessage,
    setScriptReady,
  }
}
