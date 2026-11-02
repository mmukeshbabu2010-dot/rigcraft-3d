# Supabase catalogue connection

The browser adapter reads verified catalogue rows from the RigCraft Supabase project.

## Behaviour
- Only the five categories currently supported by the builder are queried: cases, motherboards, CPUs, GPUs and PSUs.
- Only rows with `data_status = verified` are returned by the REST query.
- A category is replaced only when at least one valid remote row exists for that category.
- If Supabase is unavailable, or a category has no verified rows, the bundled `parts.json` data remains in use.
- The browser performs read-only requests. It never writes to Supabase.

## Security
The browser uses the project's Supabase publishable key. This key is designed for client-side use and is not a service-role credential. Row-level security remains the enforcement boundary. Never put a service-role key, database password, or other secret in frontend files.

## Data requirements
Each imported row should have a valid category, stable `id`, human-readable `display_name`, and a `specs` JSON object matching the builder's existing field names. Mark a row `verified` only after its source and compatibility data have been checked.

The current database foundation contains no imported parts yet, so the builder continues to use its bundled sample catalogue until verified rows are added.
