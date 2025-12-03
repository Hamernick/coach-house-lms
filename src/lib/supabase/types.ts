import type { PublicEnums } from "./schema/enums"
import type { PublicFunctions } from "./schema/functions"
import type { PublicTables } from "./schema/tables"

export type { Json } from "./schema/json"

export type Database = {
  public: {
    Tables: PublicTables
    Views: Record<string, never>
    Functions: PublicFunctions
    Enums: PublicEnums
    CompositeTypes: Record<string, never>
  }
}
