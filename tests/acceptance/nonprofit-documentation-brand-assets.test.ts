import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript"
import { afterEach, describe, expect, it, vi } from "vitest"
import * as identity from "@/features/nonprofit-documentation/lib/brand-identity"
import * as validation from "@/features/nonprofit-documentation/lib/brand-asset-validation"
import { saveBrandAsset } from "@/features/nonprofit-documentation/lib/brand-identity-storage"

const feature = "src/features/nonprofit-documentation/"
const flush = () => new Promise<void>((resolve) => setImmediate(resolve))

function sourceModule(
  path: string,
  dependencies: Record<string, unknown>,
  extra = {}
) {
  const compiledModule = { exports: {} as Record<string, (...args: any[]) => any> }
  runInNewContext(
    transpileModule(readFileSync(feature + path, "utf8"), {
      fileName: path,
      compilerOptions: {
        target: ScriptTarget.ES2020,
        module: ModuleKind.CommonJS,
        jsx: JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      module: compiledModule,
      exports: compiledModule.exports,
      URL,
      Date,
      ...extra,
      require: (name: string) => dependencies[name] ?? {},
    }
  )
  return compiledModule.exports
}

afterEach(() => vi.unstubAllGlobals())

describe("Brand Identity assets", () => {
  it("accepts exactly one supported, nonempty image within the limit", () => {
    const png = { type: "image/png", size: 12 * 1024 * 1024 }
    expect(validation.brandAssetError([png])).toBeNull()
    expect(validation.brandAssetError([png, png])).toContain("one image")
    expect(
      validation.brandAssetError([{ ...png, size: png.size + 1 }])
    ).toContain("12 MB")
    expect(validation.brandAssetError([{ ...png, size: 0 }])).toContain("empty")
    expect(
      validation.brandAssetError([{ ...png, type: "text/html" }])
    ).toContain("PNG")
  })

  it.each(["complete", "abort"])(
    "acknowledges the transaction's %s event, not early request success",
    async (outcome) => {
      const request = { result: "primary-logo", error: null } as any
      const transaction = {
        objectStore: () => ({ put: () => request }),
        error: null,
      } as any
      const close = vi.fn()
      const database = { transaction: () => transaction, close }
      vi.stubGlobal("indexedDB", {
        open: () => {
          const open = { result: database } as any
          queueMicrotask(() => open.onsuccess())
          return open
        },
      })
      let settled = false
      const promise = saveBrandAsset({
        id: "primary-logo",
        name: "logo.png",
        type: "image/png",
        blob: new Blob(["image"]),
        updatedAt: "",
      }).then(
        () => {
          settled = true
          return "saved"
        },
        () => {
          settled = true
          return "failed"
        }
      )
      await flush()
      request.onsuccess?.()
      await flush()
      expect(settled).toBe(false)
      if (outcome === "complete") transaction.oncomplete()
      else transaction.onabort()
      expect(await promise).toBe(outcome === "complete" ? "saved" : "failed")
      expect(close).toHaveBeenCalled()
    }
  )

  it.each(["normal", "asset-read", "text-read", "text-write"])(
    "reports %s storage honestly and preserves export readiness",
    async (scenario) => {
      const states: any[] = []
      let cursor = 0
      let effects: Array<() => unknown> = []
      const setItem = vi.fn(() => {
        if (scenario === "text-write") throw new Error("quota")
      })
      const hook = sourceModule(
        "hooks/use-brand-identity-tool.ts",
        {
          react: {
            useState: (initial: unknown) => {
              const i = cursor++
              if (!(i in states)) states[i] = initial
              return [
                states[i],
                (next: any) => {
                  states[i] =
                    typeof next === "function" ? next(states[i]) : next
                },
              ]
            },
            useEffect: (effect: () => unknown) => effects.push(effect),
            useMemo: (fn: () => unknown) => fn(),
            useCallback: (fn: unknown) => fn,
          },
          "../lib/brand-identity": identity,
          "../lib/brand-asset-validation": validation,
          "../lib/brand-identity-storage": {
            loadBrandAssets: () =>
              scenario === "asset-read"
                ? Promise.reject(new Error("blocked"))
                : Promise.resolve([]),
          },
        },
        {
          window: {
            localStorage: {
              getItem: () => {
                if (scenario === "text-read") throw new Error("blocked")
                return null
              },
              setItem,
            },
          },
        }
      )
      const render = () => {
        cursor = 0
        effects = []
        return hook.useBrandIdentityTool()
      }
      expect(render().assetsReady).toBe(false)
      expect(() => effects[0]()).not.toThrow()
      await flush()
      render()
      expect(() => effects[1]()).not.toThrow()
      const result = render()
      if (scenario === "normal")
        expect(result.message).toBe("Saved on this device")
      else expect(result.message).not.toBe("Saved on this device")
      if (scenario === "asset-read") expect(result.assetsReady).toBe(false)
      if (scenario === "text-read") {
        expect(result.ready).toBe(false)
        expect(setItem).not.toHaveBeenCalled()
      }
      if (scenario === "text-write")
        expect(result.message).toContain("could not be saved")
    }
  )

  it("routes each drop to its own slot, supports file selection, and rejects multiple files", async () => {
    const jsx = (type: unknown, props: any) => ({ type, props })
    const upload = vi.fn().mockResolvedValue(true)
    const errors: unknown[] = []
    const { BrandAssetField } = sourceModule(
      "components/brand-identity/brand-asset-field.tsx",
      {
        "react/jsx-runtime": { jsx, jsxs: jsx },
        react: {
          useRef: (value: unknown) => ({ current: value }),
          useState: (value: unknown) => [
            value,
            (next: unknown) => errors.push(next),
          ],
        },
        "@/lib/utils": {
          cn: (...values: unknown[]) => values.filter(Boolean).join(" "),
        },
        "../../lib/brand-asset-validation": validation,
        "./brand-identity-owner": { brandIdentityOwner: () => ({}) },
      }
    )
    const nodes = (node: any): any[] =>
      node?.props ? [node, ...[node.props.children].flat().flatMap(nodes)] : []
    const file = new File(["image"], "review.png", { type: "image/png" })
    const props = {
      label: "Review",
      guidance: "",
      onUpload: upload,
      onDelete: vi.fn(),
    }
    for (const id of ["primary-logo", "illustration-3"]) {
      const tree = BrandAssetField({ ...props, id })
      const dropzone = nodes(tree).find((node) => node.props.onDrop)
      dropzone.props.onDrop({
        preventDefault() {},
        dataTransfer: { files: [file] },
      })
      await flush()
      expect(upload).toHaveBeenLastCalledWith(id, file)
      dropzone.props.onDrop({
        preventDefault() {},
        dataTransfer: { files: [file, file] },
      })
      await flush()
    }
    expect(upload).toHaveBeenCalledTimes(2)
    expect(errors).toContain("Choose one image for this tile.")
    const picker = nodes(BrandAssetField({ ...props, id: "brand-mark" })).find(
      (node) => node.type === "input"
    )
    const target = { files: [file], value: "review.png" }
    picker.props.onChange({ target })
    await flush()
    expect(upload).toHaveBeenLastCalledWith("brand-mark", file)
    expect(target.value).toBe("")
  })
})
