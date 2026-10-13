import next from "eslint-config-next"

const config = [
  {
    ignores: [
      "node_modules/**",
      "dist-snapshots/**",
      "build/**",
      ".next/**",
      "deprecated/**",
      "**/*.d.ts",
    ],
  },
  ...next,
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    rules: {
      // Keep complexity constrained at module boundaries; oversized logic belongs in extracted helpers/hooks.
      complexity: ["error", { max: 130 }],
      "max-lines": ["error", { max: 600, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": [
        "error",
        { max: 350, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
    },
  },
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/static-components": "off",
      "react-hooks/purity": "off",
    },
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]

export default config
