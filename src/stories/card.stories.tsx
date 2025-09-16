import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "../components/ui/card"
import { Button } from "../components/ui/button"

import type { StoryConfig } from "./types"

const cardStories = {
  title: "Design System/Card",
  component: Card,
  tags: ["design-system"],
  states: [
    {
      name: "Basic",
      render: () => (
        <Card>
          <CardHeader>
            <CardTitle>Billing Upgrade</CardTitle>
            <CardDescription>
              Unlock analytics, unlimited classes, and remove the Coach House
              watermark.
            </CardDescription>
            <CardAction>
              <Button size="sm">Upgrade</Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Plans start at $29/month and include onboarding support.
            </p>
          </CardContent>
          <CardFooter className="justify-between">
            <span className="text-xs text-muted-foreground">Cancel anytime</span>
            <Button variant="ghost" size="sm">
              Learn more
            </Button>
          </CardFooter>
        </Card>
      ),
    },
    {
      name: "Compact",
      render: () => (
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
            <CardDescription>12 students currently active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <span>Module completion</span>
              <span className="font-medium">68%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted">
              <div className="h-full w-2/3 rounded-full bg-primary" />
            </div>
          </CardContent>
        </Card>
      ),
    },
  ],
} satisfies StoryConfig<typeof Card>

export default cardStories
