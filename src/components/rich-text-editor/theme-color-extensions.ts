import { Color, BackgroundColor } from "@tiptap/extension-text-style"
import { themeTextColor } from "@/lib/markdown/theme-colors"

export const ThemeTextColor = Color.extend({
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          color: {
            default: null,
            parseHTML: (element) =>
              element.style.color ? themeTextColor(element.style.color) : null,
            renderHTML: (attributes) =>
              attributes.color
                ? { style: `color: ${themeTextColor(attributes.color)}` }
                : {},
          },
        },
      },
    ]
  },
})

export const ThemeHighlightColor = BackgroundColor.extend({
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          backgroundColor: {
            default: null,
            parseHTML: (element) =>
              element.style.backgroundColor
                ? themeTextColor(element.style.backgroundColor, "highlight")
                : null,
            renderHTML: (attributes) =>
              attributes.backgroundColor
                ? {
                    style: `background-color: ${themeTextColor(attributes.backgroundColor, "highlight")}`,
                  }
                : {},
          },
        },
      },
    ]
  },
})
