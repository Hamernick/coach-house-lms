import { expect, test } from "@playwright/test"
import { build } from "vite"

// Exercise the installed primitive in real React 19, including a consumer that
// measures its root on attachment. A detach/reattach on every render loops here.
test("navigation root preserves its ref through parent updates", async ({
  page,
}) => {
  const entry = `${process.cwd()}/virtual-navigation-ref-regression.js`
  const result = await build({
    configFile: false,
    logLevel: "error",
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    plugins: [
      {
        name: "navigation-ref-regression",
        resolveId: (id) => (id === entry ? entry : undefined),
        load: (id) =>
          id === entry
            ? `
        import React from "react";
        import { createRoot } from "react-dom/client";
        import { NavigationMenu } from "radix-ui";
        window.refEvents = [];
        function App() {
          const [count, setCount] = React.useState(0);
          const [bounds, setBounds] = React.useState(null);
          const measure = React.useCallback(node => {
            window.refEvents.push(node ? "attach" : "detach");
            if (node) setBounds({ width: node.getBoundingClientRect().width });
          }, []);
          return React.createElement(React.Fragment, null,
            React.createElement("button", { onClick: () => setCount(n => n + 1) }, "Update " + count),
            React.createElement(NavigationMenu.Root, { ref: measure },
              React.createElement(NavigationMenu.List, null,
                React.createElement(NavigationMenu.Item, null,
                  React.createElement(NavigationMenu.Trigger, null, "Collect"),
                  React.createElement(NavigationMenu.Content, null, "Directory")
                )
              )
            ),
            React.createElement("output", null, bounds ? "Measured" : "Pending")
          );
        }
        const root = createRoot(document.getElementById("root"));
        window.unmountFixture = () => root.unmount();
        root.render(React.createElement(App));
      `
            : undefined,
      },
    ],
    build: {
      write: false,
      lib: { entry, name: "NavigationRefRegression", formats: ["iife"] },
    },
  })
  const bundle = Array.isArray(result) ? result[0] : result
  if (!("output" in bundle)) throw new Error("Expected an in-memory bundle")
  const chunk = bundle.output.find((file) => file.type === "chunk")
  if (!chunk || chunk.type !== "chunk")
    throw new Error("Missing fixture bundle")

  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.setContent('<div id="root"></div>')
  await page.addScriptTag({ content: chunk.code })
  await expect(page.locator("output")).toHaveText("Measured")
  for (let count = 0; count < 5; count++) {
    await page
      .getByRole("button", { name: `Update ${count}`, exact: true })
      .click()
  }
  await expect(page.getByRole("button", { name: "Update 5" })).toBeVisible()
  await page.getByRole("button", { name: "Collect", exact: true }).click()
  await expect(page.getByText("Directory", { exact: true })).toBeVisible()
  expect(await page.evaluate("window.refEvents")).toEqual(["attach"])
  await page.evaluate("window.unmountFixture()")
  expect(await page.evaluate("window.refEvents")).toEqual(["attach", "detach"])
  expect(errors).toEqual([])
})
