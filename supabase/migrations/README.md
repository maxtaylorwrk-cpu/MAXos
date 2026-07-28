# Migrations guidance

Keep database migrations or SQL schema dumps here. Do NOT commit secrets or DB dumps that contain sensitive data.

Recommended workflow
- Export migrations from Supabase (or use pg_dump for a schema-only dump).
- Commit migration files to this directory.
- If you must store backups that contain data, store them encrypted and outside this repository.

If you do not yet have migration files
- Document the current schema in a SQL or markdown file and add it here.
- Prioritize exporting migrations from the Supabase project as soon as possible so recovery is possible.
