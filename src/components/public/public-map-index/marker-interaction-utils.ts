export function bindMarkerActivation({
  button,
  onActivate,
}: {
  button: HTMLButtonElement
  onActivate: () => void
}) {
  let lastPointerActivationAt = 0
  const activate = () => {
    onActivate()
  }
  const handlePointerActivation = (event: PointerEvent) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    lastPointerActivationAt = Date.now()
    activate()
  }
  button.addEventListener("pointerdown", (event) => {
    event.stopPropagation()
  })
  button.addEventListener("pointerup", handlePointerActivation)
  button.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (Date.now() - lastPointerActivationAt < 250) return
    activate()
  })
  button.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    event.stopPropagation()
    activate()
  })
}

export function bindClusterMarkerInteractionState({
  button,
  glyphShell,
  count,
  idleShadow,
  activeShadow,
  idleCountBackground,
  activeCountBackground,
}: {
  button: HTMLButtonElement
  glyphShell: HTMLElement
  count: HTMLElement
  idleShadow: string
  activeShadow: string
  idleCountBackground: string
  activeCountBackground: string
}) {
  const applyInteractionState = (state: "idle" | "hover" | "pressed") => {
    if (state === "pressed") {
      glyphShell.style.boxShadow = activeShadow
      glyphShell.style.borderColor = "rgba(226, 232, 240, 0.88)"
      count.style.background = activeCountBackground
      count.style.borderColor = "rgba(255, 255, 255, 0.5)"
      return
    }
    if (state === "hover") {
      glyphShell.style.boxShadow = activeShadow
      glyphShell.style.borderColor = "rgba(226, 232, 240, 0.82)"
      count.style.background = activeCountBackground
      count.style.borderColor = "rgba(255, 255, 255, 0.46)"
      return
    }
    glyphShell.style.boxShadow = idleShadow
    glyphShell.style.borderColor = "rgba(209, 214, 222, 0.58)"
    count.style.background = idleCountBackground
    count.style.borderColor = "rgba(255, 255, 255, 0.28)"
  }

  button.addEventListener("pointerenter", () => {
    applyInteractionState("hover")
  })
  button.addEventListener("pointerleave", () => {
    applyInteractionState("idle")
  })
  button.addEventListener("pointerdown", () => {
    applyInteractionState("pressed")
  })
  button.addEventListener("focus", () => {
    applyInteractionState("hover")
  })
  button.addEventListener("blur", () => {
    applyInteractionState("idle")
  })
  button.addEventListener("pointerup", () => {
    applyInteractionState("hover")
  })
}
