.PHONY: export-db
export-db:
	@chmod +x scripts/export_schema.sh
	@SUPABASE_DB_URL=$(SUPABASE_DB_URL) ./scripts/export_schema.sh

