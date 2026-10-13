"use client";

import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type DialogStackTitleProps = HTMLAttributes<HTMLHeadingElement>;

export function DialogStackTitle({ children, className, ...props }: DialogStackTitleProps) {
  return (
    <h2 className={cn("font-semibold text-lg leading-none tracking-tight", className)} {...props}>
      {children}
    </h2>
  );
}

export type DialogStackDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export function DialogStackDescription({ children, className, ...props }: DialogStackDescriptionProps) {
  return (
    <p className={cn("text-muted-foreground text-sm", className)} {...props}>
      {children}
    </p>
  );
}

export type DialogStackHeaderProps = HTMLAttributes<HTMLDivElement>;

export function DialogStackHeader({ className, ...props }: DialogStackHeaderProps) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />;
}

export type DialogStackFooterProps = HTMLAttributes<HTMLDivElement>;

export function DialogStackFooter({ children, className, ...props }: DialogStackFooterProps) {
  return (
    <div className={cn("flex items-center justify-end space-x-2 pt-4", className)} {...props}>
      {children}
    </div>
  );
}

