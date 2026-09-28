"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

const AppShellCalendarAction = dynamic(
  () =>
    import("./app-shell-calendar-action").then(
      (mod) => mod.AppShellCalendarAction
    ),
  { ssr: false }
)

export function AppShellCalendarPreview() {
  const [open, setOpen] = useState(false)
  const [clicks, setClicks] = useState(0)
  return (
    <>
      <header className="flex justify-end">
        <AppShellCalendarAction />
      </header>
      <Drawer open={open} onOpenChange={setOpen} modal={false} handleOnly>
        <DrawerTrigger asChild>
          <Button variant="outline">Open workspace drawer</Button>
        </DrawerTrigger>
        <DrawerContent className="h-48 p-4">
          <DrawerTitle>Workspace drawer</DrawerTitle>
          <DrawerDescription>Calendar interaction fixture</DrawerDescription>
          <Button onClick={() => setClicks((value) => value + 1)}>
            Workspace action ({clicks})
          </Button>
        </DrawerContent>
      </Drawer>
    </>
  )
}
