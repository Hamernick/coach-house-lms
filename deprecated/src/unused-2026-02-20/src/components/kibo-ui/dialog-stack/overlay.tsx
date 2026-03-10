"use client";

import type { HTMLAttributes } from "react";
import { useCallback } from "react";

import { cn } from "@/lib/utils";
import { useDialogStackContext } from "./context";

export type DialogStackOverlayProps = HTMLAttributes<HTMLDivElement>;

export function DialogStackOverlay({ className, ...props }: DialogStackOverlayProps) {
  const context = useDialogStackContext();

  const handleClick = useCallback(() => {
    context.setIsOpen(false);
  }, [context]);

  if (!context.isOpen) return null;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: "This is a clickable overlay"
    // biome-ignore lint/a11y/useKeyWithClickEvents: "This is a clickable overlay"
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/80",
        "data-[state=closed]:animate-out data-[state=open]:animate-in",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      onClick={handleClick}
      {...props}
    />
  );
}

