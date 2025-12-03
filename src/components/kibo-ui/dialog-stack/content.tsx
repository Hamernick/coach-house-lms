"use client";

import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { useDialogStackContext } from "./context";

export type DialogStackContentProps = HTMLAttributes<HTMLDivElement> & {
  index?: number;
  offset?: number;
};

export function DialogStackContent({
  children,
  className,
  index = 0,
  offset = 16,
  ...props
}: DialogStackContentProps) {
  const context = useDialogStackContext();

  if (!context.isOpen) return null;

  const handleClick = () => {
    if (context.clickable && context.activeIndex > index) {
      context.setActiveIndex(index ?? 0);
    }
  };

  const isActive = context.activeIndex === index;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: "This is a clickable dialog"
    // biome-ignore lint/a11y/useKeyWithClickEvents: "This is a clickable dialog"
    <div
      className={cn(
        "h-auto w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg transition-all duration-300",
        className,
      )}
      onClick={handleClick}
      style={{
        top: 0,
        left: 0,
        right: 0,
        marginLeft: "auto",
        marginRight: "auto",
        transform: isActive ? "translateY(0)" : `translateY(${offset}px)`,
        zIndex: isActive ? 50 : 40,
        position: isActive ? "relative" : "absolute",
        opacity: isActive ? 1 : 0,
        cursor: context.clickable && context.activeIndex > index ? "pointer" : "default",
      }}
      {...props}
    >
      <div
        className={cn(
          "h-full w-full transition-all duration-300",
          !isActive && "pointer-events-none select-none",
        )}
        aria-hidden={!isActive}
      >
        {children}
      </div>
    </div>
  );
}
