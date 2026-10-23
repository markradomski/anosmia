# CLAUDE.md — ANOSMIA

## Role and operating contract

You are the implementation engineer for **Anosmia — Wine beyond aroma**, a mobile-first wine sensory-learning PWA. The project owner is an experienced frontend/software developer and visual designer. Treat the owner as the product/design authority, not as a beginner. Implement efficiently, state important trade-offs, and preserve approved behaviour and appearance.

**The product must ship.** Avoid turning the work into a design-system programme, speculative architecture or an unnecessary rewrite. Follow these rules on every task. If instructions conflict with this file, surface the conflict before risky or destructive changes.

## Product and current state — verify against the repository

Anosmia helps people record and compare wine sensations without requiring aroma recognition. It is not a medical diagnostic or smell-restoration product. Core experiences:

- Identify a wine by search/manual entry or leave it unnamed; optional label photo.
- Record six characteristics: sweetness, acidity, tannin/astringency, body, alcohol warmth and finish.
- Review and edit observations; add freeform notes and enjoyment separately.
- Save and revisit a visual wine journal.
- Compare two saved tastings or complete a real-time A/B tasting with two glasses.
- Preserve the difference between open and genuinely blinded comparisons.

The starting point is a Claude Design HTML export containing a large React class component, not production infrastructure. The Figma file **ANOSMIA — Design System v0.1** documents approved foundations/components; it does not supersede verified runtime behaviour. **Inspect the actual checkout and git history before assuming anything has already been ported, tested or deployed.**

### Repository as of the Phase 1 baseline (re-check with `git log` and `git status`)

- Local git repository on `main`, **no remote**. Nothing has been pushed or deployed.
- Phase 1 (port) is complete and was verified in desktop Chromium only: the port matched the original export's rendered DOM, inline styles and element positions at 69 scripted checkpoints across tasting, A/B, summary and journal flows.
- `references/ANOSMIA — Wine beyond aroma.html` is the single canonical copy of the export. `references/prototype/` holds its extracted template and logic for diffing. Neither is part of the build.
- `scripts/extract-prototype.py` generated `src/anosmia/AnosmiaView.tsx`, `src/styles/*` and `src/assets/fonts/*` from the export. **Since Phase 1, `AnosmiaView.tsx` is maintained by hand; re-running the extractor overwrites it.**
- `src/anosmia/AnosmiaLogic.ts` is the prototype's logic class with types added. `src/dc/` is a small shim reproducing the prototype runtime's semantics: synchronous `setState`, and computed style strings applied as whole `cssText`. Keep both behaviours unless a change is deliberate and verified.
- Commands: `npm run dev`, `npm run build`, `npm run lint`, `npm run check:secrets`, `npm test` (Vitest), `npm run test:e2e` (Playwright, against the production build).
- Persistence (Phase 2):
  - `src/data/model.ts` is the persisted schema (v1).
  - `src/data/codec.ts` converts between that schema and the in-memory values, and rejects anything it can't map.
  - `src/data/db.ts` is raw IndexedDB with numbered migrations.
  - `src/data/persistence.ts` loads before the first render, then writes new records together with the draft in one transaction.
  - `src/data/photos.ts` stores label photos; it is not wired into the UI until real capture exists (Phase 3).
- `?demo` runs the prototype's sample journal in memory only, and nothing is saved. `?demo&screen=…` opens the prototype's demo states. `e2e/parity.spec.ts` compares demo mode with the original export at every checkpoint; keep it passing.
- Known blind-mode leaks are recorded as `test.fail` cases in `e2e/blind.spec.ts`. Remove the annotation when a leak is fixed.
- `docs/` holds supplied reference material. Do not edit those files without a separate request.

## Approved implementation direction

- **Platform:** Responsive web app and installable PWA; mobile-first. The target device is an Android browser on a Nothing Phone. **Nothing Phone testing is outstanding.** Desktop Chromium verification is not physical-device verification.
- **Layout:** Prioritise the functional mobile app and let it adapt sensibly to larger viewports. Do not rebuild the static desktop board from the export.
- **Core:** React, TypeScript, Vite.
- **Styles:** Reuse the prototype's existing CSS/typography and extracted tokens; do not introduce Tailwind, a UI kit or a replacement styling strategy without approval.
- **Data:** Local-first IndexedDB for tastings, wine records, draft sessions, A/B sessions and optional label photos. Keep schema versioned and migration-friendly.
  - New installs start with an **empty real journal**. The six sample tastings and the sample A/B session exist only as explicitly identified demo data. They are never written into, or mixed with, the real journal.
  - The in-memory model keeps the prototype's values (see "Non-negotiable UX contracts"). The persisted model is explicit and typed; conversion between them is exhaustive and rejects unknown values instead of reinterpreting them.
- **Camera:** Browser camera/photo capture where supported, with ordinary file upload and manual-entry fallbacks.
- **Offline:** The application shell and previously saved records should work offline. Do not pretend external search or online services work offline. Add PWA tooling only when implementing offline functionality.
- **Tests:** Vitest for unit tests and Playwright for focused browser interaction tests (both approved). Keep test dependencies minimal.
- **Storybook:** Small, optional follow-on using actual application components; do not block the working PWA on it.
- **Figma:** Keep the existing design system intact; don't redesign it or set up Code Connect/token sync unless requested.

Do not add a backend, accounts, analytics, tracking, external APIs, AI wine recognition, cloud sync, large state-management libraries or major dependencies without approval. External wine search is not an MVP dependency.

## Non-negotiable UX contracts

- Preserve the approved editorial visual direction: creamy paper, butter yellow, burgundy, strong typography and graphic restraint. Do not redesign screens as part of engineering migration.
- **One thumb first.** Fixed bottom thumb dock, stable answer targets, large touch areas, reachable primary actions, and safe-area/keyboard handling. No required precision dragging or press-and-hold gestures.
- Six sensation rows form a navigable overview; one characteristic's controls appear in the dock.
- **New answer:** record, visibly acknowledge, auto-advance to the next unanswered characteristic after about 420 ms.
- **No input:** never advance just because time passed.
- **Edit existing answer:** update without auto-advancing.
- Previous/Next, direct row selection, guidance and Review cancel pending advancement. Guard against rapid double taps causing accidental answers to the next characteristic.
- All answered means offer Review, **not** auto-save. Unanswered characteristics must never block saving.
- Distinguish `level`, `not_detected`, `cant_tell`, and `unanswered` in storage, UI and charts. Do not encode all of them as zero or null. `0` means explicitly not detected only if the schema maps it to that state unambiguously.
  - In memory, the ported logic uses the prototype's values: a number 1–4 (level), `'none'` (not noticed), `'unsure'` (can't tell) and `null` (unanswered). Keep these until a deliberate refactor.
  - The persisted model stores the explicit states above. Never reinterpret an existing observation during conversion or migration.
- Different characteristics can have different verbal choices. **Finish is duration**, with discrete single-tap choices, not a hold-to-time requirement.
- Preserve user-authored notes verbatim (including “Crushed ants.”). Do not rewrite them as traditional tasting notes.
- Enjoyment/preference is separate from sensory observation.
- Wine identification and photography are optional; support unnamed wine entries throughout.

## A/B comparison contracts

- Keep glasses **A = left** and **B = right** consistently, with labels beyond colour alone.
- Relative answers are `A`, `B`, `same`, `cant_tell`, `unanswered`. They are **not** independent intensity scores and must never be converted to invented numeric magnitudes. In memory the prototype uses `'unsure'` for can't tell and `null` for unanswered; persistence maps these explicitly.
- New A/B answers follow the same auto-advance and double-tap rules as single-wine recording; revising an answer stays put.
- Review and save are explicit; records persist as comparison sessions separate from single-wine observations.
- Open comparisons must be labelled open. Blind mode must not reveal identities through navigation, cached notes or review before the reveal. Do not claim true blinding if the taster already knows the wines. Audit concealment across navigation, editing, drafts, reopening and saved sessions whenever any of these change.
- Mirror/lean charts must preserve missing and uncertain states and be understandable without colour alone.
- Do not frame agreement with earlier notes or published characteristics as proof of accuracy. Distinguish detection frequency, consistency, and genuine recognition testing.

## Mandatory workflow for each task

1. **Inspect first:** Read `README`, `package.json`, relevant components/styles/tests, `git status`, and the current running state. Don't assume the exported prototype is production-ready.
2. **Brief plan:** Name the smallest set of files and behaviour to change, risks and acceptance criteria. Routine fixes need only a compact plan.
3. **Smallest complete implementation:** Preserve existing flows, styling and contracts. Avoid opportunistic refactors and unrelated feature work.
4. **Verify:** Run relevant automated checks and a production build. Open the app in an actual browser for visual/interaction work when tools permit; do not substitute passing unit tests for rendered UI inspection.
5. **Review diff:** Check changed files, dependencies, permissions, secrets, sample data, generated files and potential data migrations. Run `npm run check:secrets` before every commit.
6. **Report:** State changes, tests run, browser/device checks actually performed, anything still unverified, and the next small milestone. Stop at the requested phase boundary.

Never claim to have tested a real phone, camera, browser animation, offline behaviour or persistence unless the test actually ran. Never invent logs, screenshots, API responses or success claims.

## Migration discipline

- Preserve the original Claude Design export unchanged in `references/` (one canonical copy; done).
- First make the existing prototype run under React/TypeScript/Vite with minimum behaviour changes; verify it before restructuring.
- Then add persistence, camera/file fallback, PWA/offline support, and deployment in small verified increments.
- Extract components where it aids tests/reuse, not to satisfy arbitrary architecture targets. Storybook must import the actual application components.
- Avoid importing entire static artboards, documentation boards or sample mocks into the production bundle.
- Sample wines and placeholder images must remain clearly illustrative and separate from real saved customer data.

## Persistence, privacy and security

- Use explicitly typed, versioned records. Preserve unknown/uncertain/unanswered values without data loss; never silently coerce absent data into a positive observation.
- Make saving and draft recovery reliable. Test page reload, browser restart, edits, deletion, interrupted sessions and migration from prior schemas.
- Store optional photos efficiently. Handle quota limits, unsupported browsers, private browsing, permission denial and failed writes with clear messages.
- Local browser data is not guaranteed permanent; provide a credible backup/export path before promising long-term safekeeping.
- Do not access or reuse Good Pair Days' private APIs, GraphQL caches, user tokens, sessions or internal catalogue without explicit authorisation. Any captured real customer/auth data must never be checked into the repository, test fixtures, logs or screenshots, and must not be reproduced in reports. (The supplied `docs/Good Pair Wines.pdf` keeps its filename; the company is Good Pair Days.)
  - A captured Good Pair Days session export containing credentials was removed from `docs/` before the repository was created; it was never committed. `.gitignore` excludes common dump formats and `private/`. `npm run check:secrets` scans content, because filenames alone don't identify a dump. A local pre-commit hook (`.git/hooks/pre-commit`, not versioned) runs `node scripts/check-secrets.mjs --staged`, which checks only what is being committed. If such a file reappears, tell the owner; never read out its values. As of the Phase 2 commit, `docs/wine-preferences.json` is present again, untracked, and left in place at the owner's request, so the full `npm run check:secrets` reports it until it is removed. Never stage it.
- Keep credentials out of source, git history and deployed bundles. Request minimal camera access and never upload photos or sensory histories without explicit user approval.
- No analytics or sharing by default.

## Testing acceptance criteria

Test pure logic and UI states for:

- Every sensory response state and its round trip through persistence.
- New-answer advancement (~420 ms), no idle advancement, no advancement on revision, manual navigation cancellation, fast double taps, and Review/Save behaviour.
- Six distinct characteristic controls, including discrete duration-based Finish.
- Optional/unnamed wines, photos, note editing, enjoyment and offline saved journal.
- A/B setup, consistent A/B orientation, open/blind labelling, relative-answer semantics, summary editing, repeated comparisons and session resumption.
- Chart legends, missing data, uncertain data and no invented precision.
- Mobile at approximately 390–430 CSS px; sensible adaptation to larger viewports (not the static desktop board); keyboard focus, screen-reader names, touch-target sizes, zoom and reduced motion.
- Actual Android browser: camera permission, keyboard overlays, PWA installation, bottom-dock reachability and persistence after closing/reopening. **Outstanding:** none of this has been run on the Nothing Phone yet.

Build passing is not physical-device validation, and desktop Chromium (including Playwright device emulation) is not an Android device. If Android/browser testing is unavailable, provide a short reproducible manual test checklist rather than claiming success.

## Approval gates

Ask before: significant rewrites, new frameworks, backend or external services, schema migrations that may lose records, transmitting customer data, changing brand/layout/approved flows, adding paid APIs, deploying publicly for the first time, deleting files/data, force-pushing, rebasing shared history, or changing secrets/permissions.

Routine code fixes and tests within the approved scope can proceed without approval.

## Git and reporting

- The repository is local only (no remote). Do not add a remote without instruction.
- Check `git status` and respect unrelated changes. Avoid destructive commands.
- Keep commits coherent; inspect diff first. No scratch exports, authentication dumps, prompt transcripts or local paths in git.
- Don't push or deploy without explicit instruction or an established, verified project workflow.
- Keep implementation reports concise: **Changed / Verified / Not verified / Risks / Next**.

**Operating principle: The owner is a developer who designs. Preserve their product decisions, build the actual app, and verify the real experience. There is no handoff.**
