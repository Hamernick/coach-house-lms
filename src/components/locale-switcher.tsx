"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/locale"
import { Button } from "@/components/ui/button"

export function LocaleSwitcher({ currentLocale }: { currentLocale: SupportedLocale }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(locale: SupportedLocale) {
    startTransition(async () => {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale }),
      })
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      {SUPPORTED_LOCALES.map((locale) => (
        <Button
          key={locale}
          size="sm"
          variant={locale === currentLocale ? "secondary" : "ghost"}
          onClick={() => handleChange(locale)}
          disabled={isPending}
        >
          {new Intl.DisplayNames([locale], { type: "language" }).of(locale.split("-")[0]) ?? locale}
        </Button>
      ))}
    </div>
  )
}
