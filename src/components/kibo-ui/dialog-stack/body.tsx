"use client";

import { Portal } from "radix-ui";
import type { HTMLAttributes, MouseEventHandler, ReactElement } from "react";
import { Children, cloneElement, useContext, useState } from "react";

import { cn } from "@/lib/utils";
import { DialogStackContext } from "./context";

type DialogStackChildProps = { index?: number };

export type DialogStackBodyProps = HTMLAttributes<HTMLDivElement> & {
  children:
    | ReactElement<DialogStackChildProps>[]
    | ReactElement<DialogStackChildProps>;
};

export function DialogStackBody({ children, className, ...props }: DialogStackBodyProps) {
  const context = useContext(DialogStackContext);
  const [totalDialogs, setTotalDialogs] = useState(Children.count(children));

  if (!context) throw new Error("DialogStackBody must be used within a DialogStack");
  if (!context.isOpen) return null;

  return (
    <DialogStackContext.Provider value={{ ...context, totalDialogs, setTotalDialogs }}>
      <Portal.Root>
        <div
          className={cn(
            "pointer-events-none fixed inset-0 z-50 mx-auto flex w-full max-w-lg flex-col items-center justify-center",
            className,
          )}
          {...props}
        >
          <div className="pointer-events-auto relative flex w-full flex-col items-center justify-center">
            {Children.map(children, (child, index) => {
              const childElement = child as ReactElement<{
                index: number
                onClick: MouseEventHandler<HTMLButtonElement>
                className?: string
              }>;
              return cloneElement(childElement, { ...childElement.props, index });
            })}
          </div>
        </div>
      </Portal.Root>
    </DialogStackContext.Provider>
  );
}
