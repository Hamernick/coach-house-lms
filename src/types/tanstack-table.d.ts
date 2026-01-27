import "@tanstack/table-core";
import "@tanstack/react-table";

declare module "@tanstack/table-core" {
  interface ColumnMeta<TData, TValue> {
    align?: "left" | "right" | "center";
  }
}

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    align?: "left" | "right" | "center";
  }
}
