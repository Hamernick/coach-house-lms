import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BoardNotificationsInput } from "../types"

type BoardNotificationsPanelProps = {
  input: BoardNotificationsInput
}

export function BoardNotificationsPanel({ input }: BoardNotificationsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>BoardNotifications</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{input.id}</CardContent>
    </Card>
  )
}
