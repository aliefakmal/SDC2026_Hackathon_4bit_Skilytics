# TVET portal

Reviewed: 24 October 2026.

## Pages and navigation

- Dashboard: current institution learning counts and gaps, kept separate from synthetic employment history.
- Students: CV review modal and immutable completed Holland result, cached trilingual summary, then guarded Intake → Matcher → Pathway. An activated pathway opens its progress view on revisit.
- Courses: the shared public catalogue plus institution-required courses. Unknown-duration courses cannot be required. Legacy `/tvet/programmes` redirects to `/tvet/courses`.
- Grads Future: institution overview first, followed by the shared public AI-at-work, growing-career and skills-demand tabs. One walkthrough sits at the upper right of each page.

All pages provide English, Bahasa Melayu and Simplified Chinese and mobile bottom navigation.

## Synthetic reference data

Canonical fixture: `src/synthetic-data/tvet/graduate-employment-2024-2026.json`. Nine aggregate programme/year rows cover 2024–2026. They are fictional reference outcomes, not the signed-in institution's actual employment measurements. No student identifiers are included.

Employment rate = employed within six months / all graduates. Further study is not employment; unknown outcomes remain in the denominator. The planning slider adds an assumed 2 percentage points per year to the synthetic 2026 baseline, capped at 100%. It is an illustrative scenario, not an employment forecast.

Identical JSON is copied into the frontend public download and root `synthetic data/`. The root folder also contains the three unchanged fictional demo CV fixtures, using their repository filenames. The fixture README defines every field and limitation.

## Required learning and progress

Settings use existing `predictions` JSON rows, scoped to TVET organisation. Plans use an optional `compulsory` JSON flag; no schema migration is required. Policy saves and activations share an organisation advisory lock. New plans contain required courses first, then personalised gap learning and workplace AI advancement. Required costs must fit the student's budget before plan generation.

Changing requirements updates unfinished plans while preserving existing check-ins and course dates; newly added courses extend the timeline. Removing a requirement makes an existing item personalised rather than erasing its progress. Already completed pathways and awards remain unchanged. Activation checks the current policy again so an outdated draft cannot bypass requirements. Course lists can be filtered to compulsory or personalised learning.

## AI and access

Shared employer endpoints allow authenticated HR or TVET accounts and enforce organisation/profile and saved-analysis ownership. Student summaries reuse Holland; Grads Future reuses Analyst; institution chat reuses Company Advisor. Three languages are generated and saved together. Raw CVs and student names are excluded from future-analysis prompts. Synthetic provenance and scenario assumptions are explicit in the context. See `ai-routing.md`.

## Verification

`institution.test.ts` covers fixture totals/copies, role and tenant boundaries, locked Holland, guarded transitions, mandatory-course insertion, progress/date preservation, completed awards, saved translations and chat references. AI calls are mocked. Existing enterprise and journey regression tests exercise the shared flow.
