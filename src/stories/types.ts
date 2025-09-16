import type { ReactElement } from "react"

export type StoryState = {
  name: string
  description?: string
  render: () => ReactElement
}

export type StoryConfig<Component> = {
  title: string
  component: Component
  tags?: string[]
  description?: string
  states: StoryState[]
}

export type StoryModule<Component> = StoryConfig<Component>
