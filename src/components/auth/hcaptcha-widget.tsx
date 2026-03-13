"use client"

import { useEffect, useState } from "react"
import HCaptcha from "@hcaptcha/react-hcaptcha"
import { useTheme } from "next-themes"

import { isCaptchaConfigured } from "@/components/auth/sign-up-form-schema"
import { clientEnv } from "@/lib/env"

type HCaptchaWidgetProps = {
  captchaRef: React.RefObject<HCaptcha | null>
  onError: (message: string) => void
  onExpire: () => void
  onVerify: (token: string) => void
}

export function HCaptchaWidget({
  captchaRef,
  onError,
  onExpire,
  onVerify,
}: HCaptchaWidgetProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const siteKey = clientEnv.NEXT_PUBLIC_HCAPTCHA_SITE_KEY

  useEffect(() => {
    setMounted(true)
  }, [])

  if (
    !siteKey ||
    !isCaptchaConfigured(siteKey, clientEnv.NEXT_PUBLIC_HCAPTCHA_ENABLED)
  ) {
    return null
  }

  return (
    <HCaptcha
      ref={captchaRef}
      sitekey={siteKey}
      theme={mounted && resolvedTheme === "dark" ? "dark" : "light"}
      onVerify={(token) => onVerify(token)}
      onExpire={onExpire}
      onError={() => onError("We could not load the security check. Refresh and try again.")}
    />
  )
}
