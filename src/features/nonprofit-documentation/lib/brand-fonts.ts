type BrandFontOption = {
  value: string
  label: string
  stack: string
}

type BrandFontGroup = {
  label: string
  options: readonly BrandFontOption[]
}

export const BRAND_FONT_GROUPS = [
  {
    label: "Sans serif",
    options: [
      {
        value: "System Sans",
        label: "System Sans",
        stack:
          'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      { value: "Arial", label: "Arial", stack: "Arial, Helvetica, sans-serif" },
      {
        value: "Arial Narrow",
        label: "Arial Narrow",
        stack: '"Arial Narrow", Arial, sans-serif',
      },
      {
        value: "Aptos",
        label: "Aptos",
        stack: 'Aptos, Calibri, "Segoe UI", sans-serif',
      },
      {
        value: "Avenir Next",
        label: "Avenir Next",
        stack: '"Avenir Next", Avenir, sans-serif',
      },
      {
        value: "Calibri",
        label: "Calibri",
        stack: 'Calibri, "Segoe UI", sans-serif',
      },
      {
        value: "Century Gothic",
        label: "Century Gothic",
        stack: '"Century Gothic", Futura, sans-serif',
      },
      {
        value: "Franklin Gothic",
        label: "Franklin Gothic",
        stack: '"Franklin Gothic Medium", "Arial Narrow", sans-serif',
      },
      {
        value: "Gill Sans",
        label: "Gill Sans",
        stack: '"Gill Sans", Calibri, sans-serif',
      },
      {
        value: "Helvetica",
        label: "Helvetica",
        stack: "Helvetica, Arial, sans-serif",
      },
      {
        value: "Helvetica Neue",
        label: "Helvetica Neue",
        stack: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      },
      {
        value: "Lucida Grande",
        label: "Lucida Grande",
        stack: '"Lucida Grande", "Lucida Sans Unicode", sans-serif',
      },
      {
        value: "Segoe UI",
        label: "Segoe UI",
        stack: '"Segoe UI", Arial, sans-serif',
      },
      {
        value: "Tahoma",
        label: "Tahoma",
        stack: "Tahoma, Verdana, sans-serif",
      },
      {
        value: "Trebuchet MS",
        label: "Trebuchet MS",
        stack: '"Trebuchet MS", Arial, sans-serif',
      },
      {
        value: "Verdana",
        label: "Verdana",
        stack: "Verdana, Geneva, sans-serif",
      },
    ],
  },
  {
    label: "Serif",
    options: [
      {
        value: "System Serif",
        label: "System Serif",
        stack: "ui-serif, Georgia, serif",
      },
      {
        value: "Baskerville",
        label: "Baskerville",
        stack: "Baskerville, Georgia, serif",
      },
      {
        value: "Book Antiqua",
        label: "Book Antiqua",
        stack: '"Book Antiqua", Palatino, serif',
      },
      {
        value: "Charter",
        label: "Charter",
        stack: 'Charter, "Bitstream Charter", serif',
      },
      { value: "Didot", label: "Didot", stack: "Didot, Bodoni, serif" },
      {
        value: "Garamond",
        label: "Garamond",
        stack: 'Garamond, "Times New Roman", serif',
      },
      { value: "Georgia", label: "Georgia", stack: "Georgia, serif" },
      {
        value: "Hoefler Text",
        label: "Hoefler Text",
        stack: '"Hoefler Text", Georgia, serif',
      },
      {
        value: "Palatino",
        label: "Palatino",
        stack: 'Palatino, "Palatino Linotype", serif',
      },
      {
        value: "Rockwell",
        label: "Rockwell",
        stack: 'Rockwell, "Courier New", serif',
      },
      {
        value: "Times New Roman",
        label: "Times New Roman",
        stack: '"Times New Roman", Times, serif',
      },
    ],
  },
  {
    label: "Display",
    options: [
      {
        value: "Copperplate",
        label: "Copperplate",
        stack: 'Copperplate, "Copperplate Gothic Light", fantasy',
      },
      {
        value: "Futura",
        label: "Futura",
        stack: 'Futura, "Century Gothic", sans-serif',
      },
      {
        value: "Impact",
        label: "Impact",
        stack: "Impact, Haettenschweiler, sans-serif",
      },
      {
        value: "Optima",
        label: "Optima",
        stack: 'Optima, "Segoe UI", sans-serif',
      },
    ],
  },
  {
    label: "Monospace",
    options: [
      {
        value: "System Mono",
        label: "System Mono",
        stack: 'ui-monospace, "SFMono-Regular", monospace',
      },
      {
        value: "Consolas",
        label: "Consolas",
        stack: 'Consolas, "Liberation Mono", monospace',
      },
      {
        value: "Courier New",
        label: "Courier New",
        stack: '"Courier New", Courier, monospace',
      },
      { value: "Menlo", label: "Menlo", stack: "Menlo, Monaco, monospace" },
      { value: "Monaco", label: "Monaco", stack: "Monaco, Menlo, monospace" },
    ],
  },
] as const satisfies readonly BrandFontGroup[]

export const BRAND_FONT_OPTIONS = BRAND_FONT_GROUPS.reduce<BrandFontOption[]>(
  (options, group) => [...options, ...group.options],
  []
)

export function brandFontStack(value: string) {
  return (
    BRAND_FONT_OPTIONS.find((option) => option.value === value)?.stack ??
    BRAND_FONT_OPTIONS[0].stack
  )
}
