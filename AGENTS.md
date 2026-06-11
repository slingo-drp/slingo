# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Project Conventions

- When working on auth, session, or schema-related code, inspect both the Supabase-facing code and the Drizzle schema/types as needed before making changes.
- Prioritize code that is clean, elegant, and idiomatic. Prefer small focused components, clear data flow, and maintainable abstractions over quick patches.
- Keep styling aligned with the existing visual theme of the project instead of introducing a new visual language.
- Prefer NativeWind utility classes and the `cn` helper for styling and class composition when possible, instead of introducing new `StyleSheet` usage.
