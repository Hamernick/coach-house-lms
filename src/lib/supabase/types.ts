import type { PublicEnums } from "./schema/enums"
import type { PublicFunctions } from "./schema/functions"
import type { PublicTables } from "./schema/tables"
import type { PublicViews } from "./schema/views"

export type { Json } from "./schema/json"

export type Database = {
  public: {
    Tables: PublicTables
    Views: PublicViews
    Functions: PublicFunctions
    Enums: PublicEnums
    CompositeTypes: Record<string, never>
  }
}
