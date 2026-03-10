"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import type { HTMLAttributes, ReactNode } from "react";
import { useEffect, useState } from "react";

import { DialogStackContext } from "./context";

export type DialogStackProps = HTMLAttributes<HTMLDivElement> & {
  open?: boolean;
  clickable?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  children?: ReactNode;
};

export function DialogStack({
  children,
  className,
  open,
  defaultOpen = false,
  onOpenChange,
  clickable = false,
  ...props
}: DialogStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useControllableState({
    defaultProp: defaultOpen,
    prop: open,
    onChange: onOpenChange,
  });

  useEffect(() => {
    if (onOpenChange && isOpen !== undefined) {
      onOpenChange(isOpen);
    }
  }, [isOpen, onOpenChange]);

  return (
    <DialogStackContext.Provider
      value={{
        activeIndex,
        setActiveIndex: (v: number | ((prev: number) => number)) =>
          setActiveIndex(typeof v === "function" ? (v as (prev: number) => number)(activeIndex) : v),
        totalDialogs: 0,
        setTotalDialogs: () => {},
        isOpen: isOpen ?? false,
        setIsOpen: (value: boolean | ((prev: boolean) => boolean)) =>
          setIsOpen(
            Boolean(
              typeof value === "function"
                ? (value as (prev: boolean) => boolean)(Boolean(isOpen))
                : value,
            ),
          ),
        clickable,
      }}
    >
      <div className={className} {...props}>
        {children}
      </div>
    </DialogStackContext.Provider>
  );
}
