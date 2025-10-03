import { redirect } from "next/navigation"

import { TrainingShell } from "@/components/training/training-shell"
import { CLASSES } from "@/components/training/data"

export default function TrainingPage() {

  return (
    <div className="px-4 lg:px-6">
      <TrainingShell classes={CLASSES} />
    </div>
  )
}
