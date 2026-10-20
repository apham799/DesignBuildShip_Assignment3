<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Bucket List: project context

Design, Build, Ship (MPCS 51238), Assignment 3, "Patterns & Flows: An Everyday Tool". A golf tool built around three flows: the **first visit**, the **core task** (log a round hole by hole → get a practice focus → log practice), and **coming back**. The flows are in `flows.md` and the onboarding research is in `docs/research.md`.

## Hard constraints
- Next.js + Tailwind CSS. Data is saved **only** to `localStorage`, under one versioned key `bucket-list:v1`.
- **No** database, backend, accounts, external APIs, or packages we don't need. Push back if one is suggested.
- The course "database" is bundled sample data (`src/data/courses.ts`) behind an async `getCourses()` that fakes a fetch.
- Deployed on Vercel's free Hobby plan from a GitHub repo. Commit in small steps that show progress.

## Design rules (Clubhouse, revised after Assignment 2 feedback)
- Page and card backgrounds are **white**. Cream and tan are accents only. Keep club green, brass and the soft drop shadows.
- **Two typefaces** only (Fraunces for headings and big numbers, a plain sans for body and UI) and **four text roles** (`display`, `heading`, `body`, `label`). Body text is 16px minimum, labels 14px minimum, in ink color.
- Muted text has ≥ 7:1 contrast on white. **Red is for errors only**, always paired with an icon.

## UX rules
- First visit: never an empty screen. Offer "Start a round" and "Practice now" (a starter plan that needs no data).
- Forms: one column, a real `<label>` on every field, errors directly under the field that say what to do next, and typed input kept on error. Focus moves to the first invalid field.
- Use the shared components in `src/components/ui/` everywhere. Don't hand-roll buttons or inputs in pages.
- Every page sits under the shared nav (Home · Play · Practice · History). In-flow pages show a back link and where you are ("Hole 4 of 18").
- Everything works with the keyboard and has visible focus rings.
