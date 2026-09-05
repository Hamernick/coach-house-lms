"use client"

import Image from "next/image"
import type { ReactNode } from "react"

import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"
import communityCourtyard from "../assets/community-courtyard.webp"

export function DocumentationPageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <header
      className="my-5 text-center"
      {...getReactGrabOwnerProps({
        ownerId: "documentation:page-header",
        component: "DocumentationPageHeader",
        source:
          "src/features/nonprofit-documentation/components/documentation-page-header.tsx",
        slot: "article-header",
        tokenSource: "src/app/globals.css",
      })}
    >
      <p className="text-muted-foreground text-xs font-medium">{eyebrow}</p>
      <h1 className="mx-auto mt-2 max-w-3xl text-[1.75rem] leading-tight font-semibold tracking-tight text-balance sm:text-[2.125rem]">
        {title}
      </h1>
      <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-[15px] leading-normal text-pretty sm:text-base">
        {description}
      </p>
      {children ? <div className="mt-3">{children}</div> : null}
      <div className="bg-muted/20 mt-5 rounded-2xl border p-2 print:hidden">
        <Image
          src={communityCourtyard}
          alt=""
          className="aspect-[16/7] w-full rounded-lg object-cover sm:aspect-[3/1]"
          sizes="(min-width: 1280px) 1100px, (min-width: 768px) 75vw, 100vw"
          preload
        />
      </div>
    </header>
  )
}
