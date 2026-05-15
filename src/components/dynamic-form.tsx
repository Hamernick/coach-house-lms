"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import type { ZodTypeAny } from "zod"

import { DynamicFormField } from "@/components/dynamic-form-field"
import type {
  DynamicFormProps,
  DynamicFormValues,
} from "@/components/dynamic-form-types"
import {
  buildDynamicFormDefaultValues,
  normalizeDynamicFormInitialValues,
} from "@/components/dynamic-form-zod"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"

export function DynamicForm({
  schema,
  onSubmit,
  isLoading = false,
  initialValues,
  labels,
  columnInfo,
}: DynamicFormProps) {
  const isInitializingRef = useRef(true)
  const schemaShape = schema.shape as Record<string, ZodTypeAny>
  const defaultValues = buildDynamicFormDefaultValues(schemaShape)

  const form = useForm<DynamicFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues,
  })

  useEffect(() => {
    if (initialValues) {
      isInitializingRef.current = true
      form.reset(
        normalizeDynamicFormInitialValues({
          initialValues,
          schemaShape,
        }),
      )
      setTimeout(() => {
        isInitializingRef.current = false
      }, 0)
      return
    }

    isInitializingRef.current = false
  }, [initialValues, form, schemaShape])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {Object.keys(schemaShape).map((fieldName) => (
          <DynamicFormField
            key={fieldName}
            columnInfo={columnInfo}
            control={form.control}
            fieldName={fieldName}
            fieldSchema={schemaShape[fieldName]}
            isInitializingRef={isInitializingRef}
            labels={labels}
          />
        ))}
        <div className="pt-6">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
