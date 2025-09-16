import { Button } from "../components/ui/button"

import type { StoryConfig } from "./types"

const buttonStories = {
  title: "Design System/Button",
  component: Button,
  tags: ["design-system"],
  states: [
    {
      name: "Default",
      render: () => <Button>Primary action</Button>,
    },
    {
      name: "Secondary",
      render: () => <Button variant="secondary">Secondary</Button>,
    },
    {
      name: "Outline",
      render: () => <Button variant="outline">Outline</Button>,
    },
    {
      name: "Ghost",
      render: () => <Button variant="ghost">Ghost</Button>,
    },
    {
      name: "Destructive",
      render: () => <Button variant="destructive">Delete</Button>,
    },
    {
      name: "Icon",
      render: () => (
        <Button size="icon" aria-label="Add item">
          +
        </Button>
      ),
    },
  ],
} satisfies StoryConfig<typeof Button>

export default buttonStories
