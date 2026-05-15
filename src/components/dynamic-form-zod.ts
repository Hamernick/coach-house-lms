import type { ZodTypeAny } from "zod"

import type { DynamicFormValues } from "@/components/dynamic-form-types"

export function getZodDef(schema: ZodTypeAny): Record<string, any> {
  return (schema as any)._def || (schema as any).def
}

export function getZodTypeName(def: Record<string, any>) {
  return def.typeName || def.type
}

export function unwrapZodType(fieldSchema: ZodTypeAny): ZodTypeAny {
  if (
    !fieldSchema ||
    typeof getZodDef(fieldSchema) !== "object" ||
    getZodDef(fieldSchema) === null
  ) {
    throw new Error(
      "unwrapZodType received an invalid Zod schema object. Check the console for the problematic schema/key."
    )
  }
  let currentSchema = fieldSchema

  while (
    getZodTypeName(getZodDef(currentSchema)) === "ZodOptional" ||
    getZodTypeName(getZodDef(currentSchema)) === "optional" ||
    getZodTypeName(getZodDef(currentSchema)) === "ZodDefault" ||
    getZodTypeName(getZodDef(currentSchema)) === "default" ||
    getZodTypeName(getZodDef(currentSchema)) === "ZodNullable" ||
    getZodTypeName(getZodDef(currentSchema)) === "nullable" ||
    getZodTypeName(getZodDef(currentSchema)) === "ZodEffects" ||
    getZodTypeName(getZodDef(currentSchema)) === "effects"
  ) {
    const typeName = getZodTypeName(getZodDef(currentSchema))
    if (typeName === "ZodEffects" || typeName === "effects") {
      currentSchema = getZodDef(currentSchema).schema
    } else {
      currentSchema = getZodDef(currentSchema).innerType
    }
  }
  return currentSchema
}

function parsePostgresArray(value: string) {
  try {
    const innerContent = value.slice(1, -1)
    return innerContent.trim() === ""
      ? []
      : innerContent.split(",").map((item) => item.trim())
  } catch {
    return []
  }
}

export function buildDynamicFormDefaultValues(
  schemaShape: Record<string, ZodTypeAny>,
): DynamicFormValues {
  return Object.keys(schemaShape).reduce((acc, key) => {
    const originalFieldSchema = schemaShape[key]
    if (typeof originalFieldSchema === "undefined") {
      throw new Error(
        `Schema error: schema.shape['${key}'] is undefined. Check schema definition.`
      )
    }

    if (
      getZodTypeName(getZodDef(originalFieldSchema)) === "ZodDefault" ||
      getZodTypeName(getZodDef(originalFieldSchema)) === "default"
    ) {
      acc[key] = getZodDef(originalFieldSchema).defaultValue()
      return acc
    }

    const baseType = unwrapZodType(originalFieldSchema)

    switch (getZodTypeName(getZodDef(baseType))) {
      case "ZodString":
      case "string":
        acc[key] = ""
        break
      case "ZodBoolean":
      case "boolean":
        acc[key] = false
        break
      case "ZodEnum":
      case "enum": {
        const enumValues = getZodDef(baseType).values || []
        acc[key] = enumValues.length > 0 ? enumValues[0] : ""
        break
      }
      case "ZodNumber":
      case "number":
        acc[key] = 0
        break
      case "ZodArray":
      case "array":
        acc[key] = []
        break
      default:
        acc[key] = undefined
        break
    }
    return acc
  }, {} as DynamicFormValues)
}

export function normalizeDynamicFormInitialValues({
  initialValues,
  schemaShape,
}: {
  initialValues: Record<string, unknown>
  schemaShape: Record<string, ZodTypeAny>
}): DynamicFormValues {
  return Object.keys(schemaShape).reduce((acc, key) => {
    const fieldDefFromSchema = schemaShape[key]
    if (typeof fieldDefFromSchema === "undefined") {
      throw new Error(`Schema error in useEffect: schema.shape['${key}'] is undefined.`)
    }
    const value = Object.prototype.hasOwnProperty.call(initialValues, key)
      ? initialValues[key]
      : undefined
    const baseFieldType = unwrapZodType(fieldDefFromSchema)
    const fieldTypeName = getZodTypeName(getZodDef(baseFieldType))

    if (fieldTypeName === "ZodBoolean" || fieldTypeName === "boolean") {
      acc[key] = !!value
    } else if (fieldTypeName === "ZodString" || fieldTypeName === "string") {
      acc[key] = value === null || value === undefined ? "" : String(value)
    } else if (fieldTypeName === "ZodEnum" || fieldTypeName === "enum") {
      const enumValues = getZodDef(baseFieldType).values || []
      acc[key] =
        value === null || value === undefined || !enumValues.includes(value)
          ? enumValues[0] || ""
          : String(value)
    } else if (fieldTypeName === "ZodNumber" || fieldTypeName === "number") {
      const num = Number(value)
      acc[key] = isNaN(num) ? 0 : num
    } else if (fieldTypeName === "ZodArray" || fieldTypeName === "array") {
      if (Array.isArray(value)) {
        acc[key] = value
      } else if (value === null || value === undefined) {
        acc[key] = []
      } else if (
        typeof value === "string" &&
        value.startsWith("{") &&
        value.endsWith("}")
      ) {
        acc[key] = parsePostgresArray(value)
      } else {
        acc[key] = []
      }
    } else {
      acc[key] = value
    }
    return acc
  }, {} as DynamicFormValues)
}
