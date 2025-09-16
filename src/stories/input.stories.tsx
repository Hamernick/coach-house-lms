import { Label } from "../components/ui/label"
import { Input } from "../components/ui/input"

import type { StoryConfig } from "./types"

const inputStories = {
  title: "Design System/Input",
  component: Input,
  tags: ["design-system"],
  states: [
    {
      name: "Default",
      render: () => (
        <div className="grid gap-2 text-left">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" placeholder="you@example.com" type="email" />
        </div>
      ),
    },
    {
      name: "Invalid",
      render: () => (
        <div className="grid gap-2 text-left">
          <Label htmlFor="email-error">Email address</Label>
          <Input
            id="email-error"
            placeholder="missing @"
            type="email"
            aria-invalid="true"
          />
          <p className="text-sm text-destructive">Enter a valid email.</p>
        </div>
      ),
    },
    {
      name: "Disabled",
      render: () => (
        <div className="grid gap-2 text-left">
          <Label htmlFor="email-disabled">Email address</Label>
          <Input
            id="email-disabled"
            placeholder="you@example.com"
            type="email"
            disabled
          />
        </div>
      ),
    },
  ],
} satisfies StoryConfig<typeof Input>

export default inputStories
