import { expect, test, type Page } from "@playwright/test"

const WORD_HTML =
  '<h2><span style="color:#0066cc">Board strategy</span></h2><p><span style="color:#000000;background-color:#ffffff;font-family:Georgia;font-size:18px"><strong>Black Word text</strong></span></p><p><span style="color:#222222">Near-black text</span></p><p><span style="color:#ffffff">White source text</span></p><p><span style="color:#fff;background-color:#ffff00">Yellow highlight</span></p><p><span style="color:rgb(180,20,30)">Red emphasis</span></p><ul><li>Recruit board members</li></ul><table><tbody><tr><td>Finance</td><td>September</td></tr></tbody></table>'
const PLAIN =
  "Board strategy\nBlack Word text\nNear-black text\nWhite source text\nYellow highlight\nRed emphasis\nRecruit board members\nFinance\tSeptember"

async function setup(page: Page) {
  await page.route("https://unpkg.com/react-grab@*/**", (route) =>
    route.fulfill({ body: "", contentType: "application/javascript" })
  )
  await page.route("**/api/link-preview**", (route) =>
    route.fulfill({ json: {} })
  )
  await page.goto("/visual-regression/document-import")
  await page.addStyleTag({ content: "nextjs-portal { visibility: hidden; }" })
  await expect(page.locator('[contenteditable="true"]')).toContainText(
    "Existing board notes."
  )
}

async function clipboard(page: Page) {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"])
  await page.evaluate(
    async ({ html, text }) => {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ])
    },
    { html: WORD_HTML, text: PLAIN }
  )
}

async function theme(page: Page, mode: "light" | "dark") {
  await page.evaluate((mode) => {
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(mode)
    document.documentElement.style.colorScheme = mode
  }, mode)
}

async function readableColors(page: Page, mode: "light" | "dark") {
  return page.locator('[contenteditable="true"]').evaluate((editor, mode) => {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext("2d")!
    const rgb = (color: string) => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 1, 1)
      return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3)
    }
    const luminance = (color: number[]) =>
      color
        .map((n) => n / 255)
        .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4))
        .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0)
    return Array.from(editor.querySelectorAll("span")).map((span) => {
      const style = getComputedStyle(span)
      const color = rgb(style.color)
      const background = rgb(
        style.backgroundColor === "rgba(0, 0, 0, 0)"
          ? mode === "dark"
            ? "#303030"
            : "#e6e6e6"
          : style.backgroundColor
      )
      const [a, b] = [luminance(color), luminance(background)].sort(
        (a, b) => b - a
      )
      return {
        text: span.textContent,
        color,
        contrast: (a + 0.05) / (b + 0.05),
      }
    })
  }, mode)
}

for (const width of [390, 1440]) {
  test(`formatted Word paste follows both themes and survives reload at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await setup(page)
    await clipboard(page)
    const editor = page.locator('[contenteditable="true"]')
    await editor.click()
    await page.keyboard.press("ControlOrMeta+A")
    await page.keyboard.press("ControlOrMeta+V")
    await expect(editor.locator("strong")).toHaveText("Black Word text")
    await expect(editor.locator("table")).toBeVisible()
    await expect(editor.locator('[style*="font-family"]')).toHaveCSS(
      "font-family",
      "Georgia"
    )
    const saved = await page.evaluate(() =>
      localStorage.getItem("document-import-visual-content")
    )
    for (const mode of ["light", "dark"] as const) {
      await theme(page, mode)
      for (const span of await readableColors(page, mode))
        expect(span.contrast, `${mode}: ${span.text}`).toBeGreaterThanOrEqual(
          4.5
        )
      await expect(page.locator("main")).toHaveScreenshot(
        `pasted-word-${width}-${mode}.png`,
        {
          animations: "disabled",
          maxDiffPixelRatio: 0.02,
        }
      )
      expect(
        await page.evaluate(() =>
          localStorage.getItem("document-import-visual-content")
        )
      ).toBe(saved)
    }
    await page.reload()
    await theme(page, "dark")
    await expect(editor).toContainText("Black Word text")
    for (const span of await readableColors(page, "dark"))
      expect(span.contrast).toBeGreaterThanOrEqual(4.5)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })
}

test("native paste without formatting keeps text and omits source styles", async ({
  page,
}) => {
  await setup(page)
  await clipboard(page)
  const editor = page.locator('[contenteditable="true"]')
  await editor.click()
  await page.keyboard.press("ControlOrMeta+A")
  await page.keyboard.press("ControlOrMeta+Shift+V")
  await expect(editor).toContainText("Black Word text")
  await expect(
    editor.locator("span[style], strong, h2, table, ul")
  ).toHaveCount(0)
  await page.reload()
  await expect(editor).toContainText("September")
  await expect(
    editor.locator("span[style], strong, h2, table, ul")
  ).toHaveCount(0)
})

test("the paste menu supports formatted and plain paste at the selection", async ({
  page,
}) => {
  await setup(page)
  await clipboard(page)
  const editor = page.locator('[contenteditable="true"]')
  await editor.click()
  await page.keyboard.press("ControlOrMeta+A")
  await page.getByRole("button", { name: "Paste options", exact: true }).click()
  await page.getByRole("menuitem", { name: /^Paste Ctrl/ }).click()
  await expect(editor.locator("strong")).toHaveText("Black Word text")
  await editor.click()
  await page.keyboard.press("ControlOrMeta+A")
  await page.getByRole("button", { name: "Paste options", exact: true }).click()
  await page
    .getByRole("menuitem", { name: /^Paste without formatting/ })
    .click()
  await expect(editor).toContainText("September")
  await expect(
    editor.locator("span[style], strong, h2, table, ul")
  ).toHaveCount(0)
})

test("clipboard denial explains the keyboard fallback without changing content", async ({
  page,
}) => {
  await setup(page)
  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, "read", {
      configurable: true,
      value: async () => {
        throw new DOMException("Denied", "NotAllowedError")
      },
    })
  })
  await page.getByRole("button", { name: "Paste options", exact: true }).click()
  await page.getByRole("menuitem", { name: /^Paste Ctrl/ }).click()
  await expect(
    page.getByText("Click in the editor and press Ctrl/Cmd+V to paste.", {
      exact: true,
    })
  ).toBeVisible()
  await expect(page.locator('[contenteditable="true"]')).toHaveText(
    "Existing board notes."
  )
})
