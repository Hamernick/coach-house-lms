# NavigationMenu React 19 ref fix

`@radix-ui/react-navigation-menu@1.2.14` creates a new state-setting callback
inside `useComposedRefs` on every render. React detaches and reattaches the root
ref; a measuring consumer that sets state on attachment can enter React error
185 (`Maximum update depth exceeded`). The reported public-directory crash
stack points to this callback in the deployed NavigationMenu bundle.

The version-bound pnpm patch passes the existing stable state setter directly,
in both ESM and CommonJS distributions. No package versions change. Both direct
imports and the `radix-ui` umbrella resolve to the patched instance.

`tests/visual/navigation-menu-ref.visual.spec.ts` bundles the installed primitive
with production React and runs it in Chromium: measurement, parent updates,
opening the menu, and unmount cleanup. It fails without the patch and passes
with it. It adds no route, fixture server, screenshot baseline, or dependency.
The exact user's click sequence remains unreproduced; this fixes the independently
reproduced defect identified by their stack, not the separate HTTP 503.

Related upstream investigation:
https://github.com/radix-ui/primitives/issues/3963

When upgrading this dependency, verify the upstream root ref is stable, remove
the version-specific patch registration if fixed, and retain the regression test.
