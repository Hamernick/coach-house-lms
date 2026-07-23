import { expect, test, type Locator } from "@playwright/test"

async function expectFlowNodesContained(fixture: Locator) {
  const nodes = fixture.locator(".react-flow__node")
  await expect(nodes).toHaveCount(2)
  const violations = await nodes.evaluateAll((elements) => {
    const flow = elements[0]?.closest(".react-flow")?.getBoundingClientRect()
    if (!flow) return ["missing-flow"]

    return elements.flatMap((element) => {
      const node = element.getBoundingClientRect()
      return node.left >= flow.left - 1 &&
        node.top >= flow.top - 1 &&
        node.right <= flow.right + 1 &&
        node.bottom <= flow.bottom + 1
        ? []
        : [element.getAttribute("data-id") ?? "unknown-node"]
    })
  })
  expect(violations).toEqual([])
}

test("registers React Flow errors after render across Strict Mode remounts", async ({
  page,
}) => {
  const browserProblems: string[] = []
  page.on("console", (message) => {
    if (
      ["error", "warning"].includes(message.type()) &&
      !message.text().startsWith("[React Grab]")
    ) {
      browserProblems.push(message.text())
    }
  })
  page.on("pageerror", (error) => browserProblems.push(error.message))

  await page.goto("/visual-regression/workspace-reactflow-error-bootstrap")
  const fixture = page.locator(
    '[data-workspace-reactflow-error-bootstrap-fixture="true"]'
  )
  const replaceNodeTypes = fixture.getByRole("button", {
    name: "Replace node types",
  })
  const emitMeaningfulError = fixture.getByRole("button", {
    name: "Emit meaningful error",
  })
  const meaningfulErrors = fixture.getByTestId("meaningful-errors")

  await expect(fixture.locator(".react-flow__edge")).toHaveCount(1)
  await expectFlowNodesContained(fixture)
  await replaceNodeTypes.click()
  await expect(meaningfulErrors).toBeEmpty()
  await page.waitForTimeout(100)
  expect(browserProblems).toEqual([])

  await fixture.getByRole("button", { name: "Remount bootstrap" }).click()
  await expect(fixture.getByTestId("bootstrap-generation")).toHaveText("1")
  await expect(fixture.locator(".react-flow__edge")).toHaveCount(1)
  await expectFlowNodesContained(fixture)
  await page.waitForTimeout(100)
  expect(browserProblems).toEqual([])

  await emitMeaningfulError.click()
  await expect(meaningfulErrors).toHaveText("999: Fixture error")

  await fixture.getByRole("button", { name: "Remount provider" }).click()
  await expect(fixture.getByTestId("provider-generation")).toHaveText("1")
  await expect(fixture.getByTestId("bootstrap-generation")).toHaveText("0")
  await expect(fixture.locator(".react-flow__edge")).toHaveCount(1)
  await fixture.getByRole("button", { name: "Replace node types" }).click()
  await expect(fixture.getByTestId("meaningful-errors")).toBeEmpty()
  await page.waitForTimeout(100)
  expect(browserProblems).toEqual([])

  await fixture.getByRole("button", { name: "Emit meaningful error" }).click()
  await expect(fixture.getByTestId("meaningful-errors")).toHaveText(
    "999: Fixture error"
  )
  await page.waitForTimeout(100)
  expect(browserProblems).toEqual([])
})
