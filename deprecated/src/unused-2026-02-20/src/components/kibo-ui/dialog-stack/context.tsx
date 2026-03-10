"use client";

import { createContext, useContext } from "react";

export type DialogStackContextType = {
  activeIndex: number;
  setActiveIndex: (updater: number | ((prev: number) => number)) => void;
  totalDialogs: number;
  setTotalDialogs: (updater: number | ((prev: number) => number)) => void;
  isOpen: boolean;
  setIsOpen: (next: boolean) => void;
  clickable: boolean;
};

export const DialogStackContext = createContext<DialogStackContextType | null>(null);

export function useDialogStackContext() {
  const ctx = useContext(DialogStackContext);
  if (!ctx) throw new Error("DialogStack components must be used within a DialogStack");
  return ctx;
}
