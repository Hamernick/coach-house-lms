"use client"

import type { RefObject } from "react"
import type { Control } from "react-hook-form"
import type { ZodTypeAny } from "zod"

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import type {
  DynamicFormColumnInfo,
  DynamicFormLabels,
  DynamicFormValues,
} from "./dynamic-form-types"
import { getZodDef, getZodTypeName, unwrapZodType } from "./dynamic-form-zod"

type DynamicFormFieldProps = {
  columnInfo?: DynamicFormColumnInfo
  control: Control<DynamicFormValues>
  fieldName: string
  fieldSchema: ZodTypeAny
  isInitializingRef: RefObject<boolean>
  labels?: DynamicFormLabels
}

function DynamicFormFieldRow({
  children,
  description,
  label,
  typeDisplay,
}: {
  children: React.ReactNode
  description?: string
  label: string
  typeDisplay: string
}) {
  return (
    <FormItem className="py-6 border-b">
      <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between w-full gap-4 lg:gap-8">
        <div className="flex-1 pr-4">
          <FormLabel>{label}</FormLabel>
          <div className="text-sm text-muted-foreground mt-1">{typeDisplay}</div>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </div>
        <div className="flex-1 lg:max-w-1/2">{children}</div>
      </div>
    </FormItem>
  )
}

export function DynamicFormField({
  columnInfo,
  control,
  fieldName,
  fieldSchema,
  isInitializingRef,
  labels,
}: DynamicFormFieldProps) {
  const baseType = unwrapZodType(fieldSchema)
  const typeName = getZodTypeName(getZodDef(baseType))
  const description = fieldSchema.description

  return (
    <FormField
      key={fieldName}
      control={control}
      name={fieldName}
      render={({ field }) => {
        const labelConfig = labels?.[fieldName]
        const label =
          typeof labelConfig === "string" ? labelConfig : labelConfig?.label || fieldName
        const typeDisplay = columnInfo?.[fieldName]?.data_type || ""

        switch (typeName) {
          case "ZodString":
          case "string":
            return (
              <DynamicFormFieldRow
                description={description}
                label={label}
                typeDisplay={typeDisplay}
              >
                <FormControl>
                  <Input
                    placeholder={`Enter your ${fieldName}`}
                    {...field}
                    value={String(field.value || "")}
                  />
                </FormControl>
              </DynamicFormFieldRow>
            )
          case "ZodNumber":
          case "number":
            return (
              <DynamicFormFieldRow
                description={description}
                label={label}
                typeDisplay={typeDisplay}
              >
                <FormControl>
                  <Input
                    type="number"
                    placeholder={`Enter value for ${fieldName}`}
                    {...field}
                    value={String(field.value ?? "")}
                    onChange={(event) => {
                      const num = parseInt(event.target.value, 10)
                      field.onChange(isNaN(num) ? undefined : num)
                    }}
                  />
                </FormControl>
              </DynamicFormFieldRow>
            )
          case "ZodBoolean":
          case "boolean":
            return (
              <FormItem className="py-6 border-b flex flex-row items-center justify-between gap-8">
                <div>
                  <FormLabel>{label}</FormLabel>
                  <div className="text-sm text-muted-foreground">{typeDisplay}</div>
                  {description ? <FormDescription>{description}</FormDescription> : null}
                  <FormMessage />
                </div>
                <FormControl>
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )
          case "ZodEnum":
          case "enum": {
            const options = getZodDef(baseType).values
            const optionLabels =
              typeof labelConfig === "object" ? labelConfig.options : undefined
            return (
              <DynamicFormFieldRow
                description={description}
                label={label}
                typeDisplay={typeDisplay}
              >
                <Select
                  onValueChange={(value) => {
                    if (!isInitializingRef.current) {
                      field.onChange(value)
                    }
                  }}
                  value={String(field.value || "")}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select a ${fieldName}`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {options.map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {optionLabels?.[option] || option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </DynamicFormFieldRow>
            )
          }
          case "ZodArray":
          case "array":
            return (
              <FormItem className="py-6 border-b">
                <div className="flex flex-row items-center justify-between w-full gap-8">
                  <div className="flex-1 pr-4">
                    <FormLabel>{label}</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Enter as JSON array: [&quot;item1&quot;, &quot;item2&quot;]
                      {columnInfo?.[fieldName]?.is_nullable && " (leave empty for null)"}
                    </div>
                    {description ? <FormDescription>{description}</FormDescription> : null}
                    <FormMessage />
                  </div>
                  <div className="flex-1">
                    <FormControl>
                      <Input
                        placeholder={
                          columnInfo?.[fieldName]?.is_nullable
                            ? `[&quot;item1&quot;, &quot;item2&quot;] or leave empty for null`
                            : `[&quot;item1&quot;, &quot;item2&quot;]`
                        }
                        {...field}
                        value={
                          field.value === null || field.value === undefined
                            ? ""
                            : Array.isArray(field.value)
                              ? JSON.stringify(field.value)
                              : String(field.value || "")
                        }
                        onChange={(event) => {
                          const value = event.target.value
                          if (value.trim() === "") {
                            field.onChange(null)
                            return
                          }
                          try {
                            const parsed = JSON.parse(value)
                            field.onChange(Array.isArray(parsed) ? parsed : value)
                          } catch {
                            field.onChange(value)
                          }
                        }}
                      />
                    </FormControl>
                  </div>
                </div>
              </FormItem>
            )
          default:
            return <></>
        }
      }}
    />
  )
}
