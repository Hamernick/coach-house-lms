export type AutofillReport = {
  changed: number
  touched: number
}

export type AutofillControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

export type AutofillControlSnapshot = {
  element: AutofillControl
  value: string
  checked: boolean | null
}

export type AutofillEditorSnapshot = {
  element: HTMLElement
  html: string
}

export type AutofillSnapshot = {
  pathname: string
  controls: AutofillControlSnapshot[]
  editors: AutofillEditorSnapshot[]
}
