import { redirect } from "next/navigation"

import { WORKSPACE_ACCELERATOR_PATH } from "@/lib/workspace/routes"

export default function AcceleratorLayout() {
  redirect(WORKSPACE_ACCELERATOR_PATH)
}
