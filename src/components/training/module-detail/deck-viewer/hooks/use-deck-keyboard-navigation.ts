import { useEffect } from "react"

type UseDeckKeyboardNavigationArgs = {
  navigate: (delta: number) => void
}

export function useDeckKeyboardNavigation({ navigate }: UseDeckKeyboardNavigationArgs) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = (event.target as HTMLElement | null)?.closest("input, textarea, [contenteditable=true]")
      if (target) return
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        if (event.altKey) return
        const delta = event.key === "ArrowRight" ? 1 : -1
        event.preventDefault()
        navigate(delta)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [navigate])
}
