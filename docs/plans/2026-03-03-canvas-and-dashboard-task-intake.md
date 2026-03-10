# Task Intake

## Task 1

Change this:

@  
Build  
community-led  
nonprofits with Coach House.

in CanvasPanelShell (at /Users/calebhamernick/Development/coach-house-platform/src/components/public/home-canvas-preview-panels.tsx:19:4)  
in HomeSectionPanel (at /Users/calebhamernick/Development/coach-house-platform/src/components/public/home-canvas-preview-panels.tsx:63:20)  
in SidebarInset (at /Users/calebhamernick/Development/coach-house-platform/src/components/ui/sidebar/layout-primitives.tsx:13:4)

To say **Find, Build, & Fund** instead of just “Build”.

## Task 2

Install this / set it up properly wherever we have it and make sure any search component we use uses this if it's not set up already:

# Installation

URL (HTML): /docs/installation  
URL (LLMs): /docs/installation.md  
Source: https://raw.githubusercontent.com/47ng/nuqs/refs/heads/master/packages/docs/content/docs/installation.mdx

Getting started

import {  
  NextJS,  
  ReactRouter,  
  ReactRouterV7,  
  ReactSPA,  
  Remix,  
  TanStackRouter,  
} from '@/src/components/frameworks'

Install the `nuqs` package with your favourite package manager:

- NPM: `npm install nuqs`
- PNPM: `pnpm add nuqs`
- Yarn: `yarn add nuqs`
- Bun: `bun add nuqs`

## Which version should I use?

`nuqs@^2` supports the following frameworks and their respective versions:

- <NextJS className="inline mr-1.5" role="presentation" /> [Next.js](/docs/adapters#nextjs): `next@>=14.2.0` <small className="text-muted-foreground">(app & pages routers)</small>
- <ReactSPA className="inline mr-1.5" role="presentation" /> [React SPA](/docs/adapters#react-spa): `react@^18.3 || ^19`
- <Remix className="inline mr-1.5" role="presentation" /> [Remix](/docs/adapters#remix): `@remix-run/react@^2`
- <ReactRouter className="inline mr-1.5" role="presentation" /> [React Router v6](/docs/adapters#react-router-v6): `react-router-dom@^6`
- <ReactRouterV7 className="inline mr-1.5" role="presentation" /> [React Router v7](/docs/adapters#react-router-v7): `react-router@^7`
- <TanStackRouter className="inline mr-1.5 not-prose" role="presentation" /> [TanStack Router](/docs/adapters#tanstack-router): `@tanstack/react-router@^1`

<Callout>  
  For older versions of Next.js, you may use `nuqs@^1` (documentation in `node_modules/nuqs/README.md`).  
</Callout>

## Task 3

Delete this:

@  
Showing 2 of 2 notes across 2 modules.  
(3 elements)

in CardContent (at /Users/calebhamernick/Development/coach-house-platform/src/components/ui/card.tsx:65:2)  
in Card (at /Users/calebhamernick/Development/coach-house-platform/src/components/ui/card.tsx:6:2)  
in SidebarInset (at /Users/calebhamernick/Development/coach-house-platform/src/components/ui/sidebar/layout-primitives.tsx:13:4)

## Task 4

This needs to be dynamic to say “Person” if it's just 1 and then “People” once more people are on it:

@  
People

in OrganizationOverviewCard (at /Users/calebhamernick/Development/coach-house-platform/src/app/%28dashboard%29/my-organization/_components/my-organization-editor-view.tsx:36:6)  
in CardContent (at /Users/calebhamernick/Development/coach-house-platform/src/components/ui/card.tsx:65:2)  
in Card (at /Users/calebhamernick/Development/coach-house-platform/src/components/ui/card.tsx:6:2)

## Task 5

The loader/skeleton that shows on the home canvas before the React Flow canvas displays is not centered on the canvas and it needs to be:

@  
Organization

Bright Futures Collective

Powering opportunity for youth

Programs  
0  
People  
1  
Goal  
$0...

in MyOrganizationWorkspaceView (at /Users/calebhamernick/Development/coach-house-platform/src/app/%28dashboard%29/my-organization/_components/workspace-board/my-organization-workspace-view.tsx:14:4)  
in OrganizationWorkspacePage (at Server)  
in SidebarInset (at /Users/calebhamernick/Development/coach-house-platform/src/components/ui/sidebar/layout-primitives.tsx:13:4)

## Task 6

The animation for this:

@  
Docs

in FloatingDock (at /Users/calebhamernick/Development/coach-house-platform/src/components/ui/floating-dock.tsx:46:4)  
in WorkspaceBoardCanvasDocks (at /Users/calebhamernick/Development/coach-house-platform/src/app/%28dashboard%29/my-organization/_components/workspace-board/workspace-board-canvas-docks.tsx:88:26)  
in MyOrganizationWorkspaceView (at /Users/calebhamernick/Development/coach-house-platform/src/app/%28dashboard%29/my-organization/_components/workspace-board/my-organization-workspace-view.tsx:14:4)

Is weird since it's just one and is vertical instead of horizontal. We should make it so it doesn't grow as much / not so big, and also the container behind it grows horizontally as well as vertically.

## Task 7

There is too much space below the description text, the gap below that text needs to be the same amount of gap above the Brand Kit title:

in CardTitle (at /Users/calebhamernick/Development/coach-house-platform/src/components/ui/card.tsx:32:2)  
in CardHeader (at /Users/calebhamernick/Development/coach-house-platform/src/components/ui/card.tsx:19:2)  
in Card (at /Users/calebhamernick/Development/coach-house-platform/src/components/ui/card.tsx:6:2)

## Task 8

Bring in the events list / list items / style design / date display / + button to add an event:

`npx shadcn@latest add @reui/p-calendar-22`

We'll have to pick a color convention since it uses colors. Might need to let the user add a type like Board meetings and the other presets we already have there.

```tsx
"use client"

import { useState } from "react"
import { formatDateRange } from "little-date"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { PlusIcon } from 'lucide-react'

const events = [
  {
    title: "Product Launch",
    start: "2026-01-24T10:00:00",
    end: "2026-01-24T11:30:00",
    colorful: "after:bg-green-500",
  },
  {
    title: "Weekly Standup",
    start: "2026-01-28T13:00:00",
    end: "2026-01-28T13:30:00",
    colorful: "after:bg-yellow-500",
  },
  {
    title: "Code Review Session",
    start: "2026-01-31T15:00:00",
    end: "2026-01-31T16:00:00",
    colorful: "after:bg-blue-500",
  },
]

export function Pattern() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <Card className="w-2xs py-4">
      <CardContent className="px-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="w-full bg-transparent p-0"
          required
        />
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3 border-t px-4! pt-3! pb-0!">
        <div className="flex w-full items-center justify-between px-1">
          <div className="text-sm font-medium">
            {date?.toLocaleDateString("en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            title="Add Event"
          >
            <PlusIcon />
            <span className="sr-only">Add Event</span>
          </Button>
        </div>
        <div className="flex w-full flex-col gap-2">
          {events.map((event) => (
            <div
              key={event.title}
              className={cn(
                "bg-muted relative p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1",
                "rounded-md",
                "after:rounded-full",
                event.colorful
              )}
            >
              <div className="font-medium">{event.title}</div>
              <div className="text-muted-foreground text-xs">
                {formatDateRange(new Date(event.start), new Date(event.end))}
              </div>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  )
}
```

## Task 9

When I click on the accelerator, everything goes away/disappears from the board and the whole site crashes.

## Task 10

I'd like to combine these two and make a super dashboard, very simple. Pull in everything from these two tools, remove redundancies, make sure it's ready to go so I have access and so do two other members of my team. I’ll need to provide them instructions or login info:

`npx shadcn@latest add @supabase/platform-kit-nextjs`

and this:

# Overview
URL: /docs/overview  
Source: /vercel/path0/docs/content/docs/(guides)/overview.mdx

---
title: Overview  
lastModified: "2026-02-11"
---

<div className="flex flex-col items-center text-center not-prose">
  <StackAuthIcon size={56} className="mb-2" />

  <p className="text-3xl font-bold tracking-tight mb-0.5">Welcome to Stack Auth</p>
  <p className="text-base text-fd-muted-foreground mb-4">Open-source authentication that gets you started in minutes.</p>
</div>

### Quick Start (Next.js)

**1. Install the SDK**

```bash
npx @stackframe/init-stack@latest
```

**2. Use authentication**

```tsx
const user = useUser({ or: "redirect" });
return <div>Hi, {user.displayName}</div>;
```

For other frameworks or detailed configuration, see the [full setup guide](./getting-started/setup).

{/* IF_PLATFORM: react-like */}

## Components

Pre-built UI components ready to use:

<CardGroup>
  <Card href="./components/sign-in">`<SignIn />`</Card>
  <Card href="./components/sign-up">`<SignUp />`</Card>
  <Card href="./components/user-button">`<UserButton />`</Card>
  <Card href="./components/account-settings">`<AccountSettings />`</Card>
  <Card href="./components/selected-team-switcher">`<SelectedTeamSwitcher />`</Card>
  <Card href="./components/stack-handler">`<StackHandler />`</Card>
</CardGroup>

[View all components →](./components)

{/* END_PLATFORM */}

## Explore

<QuickLinks>
  <QuickLink title="Setup & Installation" icon="fa-regular fa-play" href="./getting-started/setup">
    Get started with Stack in 5 minutes
  </QuickLink>

  {/* IF_PLATFORM: react-like */}

  <QuickLink title="Components" icon="fa-solid fa-puzzle" href="./components">
    Pre-built React components for sign-in, user management, and more
  </QuickLink>

  {/* END_PLATFORM */}

  {/* IF_PLATFORM: js-like */}

  <QuickLink title="SDK Reference" icon="fa-regular fa-file-lines" href="./sdk">
    Learn how to use Stack Auth's SDK
  </QuickLink>

  {/* END_PLATFORM */}

  <QuickLink title="REST API" icon="fa-solid fa-code" href="/api/overview">
    Explore Stack's REST APIs
  </QuickLink>
</QuickLinks>

## Apps

Enable powerful features through the dashboard:

<AppGrid appIds={["api-keys", "emails", "teams", "rbac", "webhooks"]} />

Still have questions? Check out our [FAQ](./faq) or [join our Discord](https://discord.stack-auth.com).

## Task 11

The design of this is basically just a prototype. Spend time in planning mode and skills, use shadcn items and lists, and make sure the one at the bottom isn’t being clipped / has proper gap at the bottom between it and the parent container:

@  
(3 elements)  
Finalize board packet

Active

Confirm guest speaker

To do

Publish monthly update

Done

in CardContent (at /Users/calebhamernick/Development/coach-house-platform/src/components/ui/card.tsx:65:2)  
in Card (at /Users/calebhamernick/Development/coach-house-platform/src/components/ui/card.tsx:6:2)  
in WorkspaceBoardCard (at /Users/calebhamernick/Development/coach-house-platform/src/app/%28dashboard%29/my-organization/_components/workspace-board/workspace-board-node.tsx:188:6)
