import type { z, ZodTypeAny } from "zod"

export type DynamicFormLabelConfig =
  | string
  | { label: string; options?: Record<string, string> }

export type DynamicFormLabels = Record<string, DynamicFormLabelConfig>

export type DynamicFormColumnInfo = Record<
  string,
  { data_type: string; is_nullable: boolean }
>

export type DynamicFormProps = {
  schema: z.ZodObject<Record<string, ZodTypeAny>>
  onSubmit: (data: any) => void
  isLoading?: boolean
  initialValues?: Record<string, any>
  labels?: DynamicFormLabels
  columnInfo?: DynamicFormColumnInfo
}

export type DynamicFormValues = Record<string, any>
