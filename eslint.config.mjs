import next from "eslint-config-next"

const config = [
  ...next,
  {
    ignores: [
      "node_modules/**",
      "dist-snapshots/**",
      "build/**",
    ],
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
