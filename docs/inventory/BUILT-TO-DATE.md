# Aetherium — Built to Date

*An independent inventory of what physically exists in this repository as of 2026-04-18.*
*Source of truth for this survey: the code, SQL, config, assets, and git history under `/Users/christopherporto/prototype`. `docs/source-of-truth/` was not consulted — in fact, no `docs/` directory existed before this file was written.*

---

## 1. Repository structure

**Project root:** `/Users/christopherporto/prototype`
**Framework:** Next.js **16.2.1** on React **19.2.4**, Tailwind **v4** (@tailwindcss/postcss), TypeScript 5.9, strict mode.
**App directory:** yes (`app/`, not `src/`). `paths` alias `@/*` → project root.
**Deployment:** There is **no** `vercel.json`, `Dockerfile`, `Procfile`, or CI workflow in-tree. The auth callback comment at [callback/page.tsx:86](app/auth/callback/page.tsx:86) explicitly mentions avoiding `useSearchParams()` because of Vercel build failures, so Vercel is the implied target.
**Runtime dependencies (from `package.json`):** `@supabase/supabase-js ^2.100.1`, `openai ^6.33.0`, `next 16.2.1`, `react` / `react-dom` `19.2.4`. No analytics, email, Stripe, or payment libraries.
**Dev dependencies:** `tsx`, `ts-node`, `eslint`, `typescript`, Tailwind v4 + PostCSS.

### Top-level layout
```
/Users/christopherporto/prototype
├── .claude/                  ← launch.json + settings.local.json
├── .env.local                ← Supabase URL/anon key + OPENAI_API_KEY (all three present)
├── AGENTS.md (5 lines)       ← "This is NOT the Next.js you know" — directs readers to node_modules/next/dist/docs
├── CLAUDE.md (1 line)        ← `@AGENTS.md`
├── README.md                 ← Unchanged create-next-app boilerplate
├── app/                      ← Next.js App Router pages + API routes
├── components/               ← React components (shared + UI primitives + dev)
├── lib/                      ← Domain logic: assessment, scoring, archetypes, canon, engine, persistence, intelligence, pathways, aetherium/system
├── public/                   ← 6 PNGs (temple imagery) + 5 SVGs (create-next-app defaults)
├── scripts/                  ← fetch-dashboard-payload.ts, generate_review_pdf.py
├── supabase/                 ← migrations/ (001–010) + .temp/cli-latest
├── tests/                    ← canon-engine.test.ts, output-review.ts (tsx scripts, no Jest/Vitest config present)
├── tailwind.config.ts        ← Extends with `ae.{purple,fire,air,water,earth}` palette + `Cinzel` + `Cormorant Garamond` fonts
└── tsconfig.json / postcss.config.mjs / eslint.config.mjs / next.config.ts (empty config)
```

No monorepo, no workspaces, no `docs/` folder (this file is the first item inside it).

### `.claude/` harness hints

- `.claude/launch.json` defines a single launch config named `aetherium-dev` running `next dev` on port 3000.
- `.claude/settings.local.json` is a long `allow` list that incidentally references three source documents sitting **outside** the repo at `/Users/christopherporto/Desktop/Aetherium/`:
  - `Aetherium_Master_Spec_v2.docx`
  - `Core Documents - v2/System Intelligence - Source Documents/Aetherium_Locked_Archetype_Breakdown.docx`
  - `Core Documents - v2/System Intelligence - Source Documents/Aetherium_Locked_Master_Canon - SACRED MATH.docx`
  - It also shows an earlier working copy at `/Users/christopherporto/Desktop/Aetherium/prototype/` that was later moved to the current location.

These docs are not in the repo. [lib/archetypes/definitions.ts:7](lib/archetypes/definitions.ts:7) cites them by name as the archetype canon's source of truth.

---

## 2. The live site / landing page

**File:** [app/page.tsx](app/page.tsx) · 637 lines · `'use client'` · default-exported `LandingPage`
**Layout:** [app/layout.tsx](app/layout.tsx) · sets document metadata:
- `title`: `"Aetherium — A Platform for Human Evolution"`
- `description`: `"Discover who you are, where you are misaligned, and how to move toward your highest expression."`
- Injects a persistent `<div className="grain" />` texture and black background `bg-bg`.

### Section architecture (numbered in source comments)

Each section is a `<section className="s-band …">` separated by a `<Kigo />` mark (a `◈` between two hairlines). Order as written in source:

| # | Label in comments | Eyebrow | Headline |
|---|---|---|---|
| 1 | `ARRIVAL — Hero` | — | `Discover Yourself` / `Navigate the Way` |
| 2 | `REFLECTION — Pain` | `Sound familiar?` | `Most People Are Moving Through Life Without a Clear Map` |
| 3 | `STRUCTURE — Five Dimensions` | `The Foundation` | `The Five Dimensions of the Self` |
| 4 | `FLOW — Life Through the System` | `The Mechanism` | `Structure Is Not Enough` |
| 5 | `EXPRESSION — Archetypes` | `Expression` | `You Are Not One Thing` |
| 6 | `THRESHOLD — This Is Different` | `This is where things change` | `This Isn't Another Personality Test` |
| 7 | `INITIATION — Four Steps` (source comment still numbers it `5.`) | `Simple and doable` | `Four Steps. One Clear Profile.` |
| 8 | `REVELATION — What You Get` (source comment numbers `6.`) | `Revelation` | `Your Profile Is Your Map` |
| 9 | `IDENTITY — Avatar` | — | Pure visual (ring SVG + `◈` + "What does yours look like?") |
| 10 | `UTILITY — Daily System` | `Navigation` | `How You Navigate Your Life` |
| 11 | `VALIDATION — Testimonials` | `What people found` | `The Mirror Does Not Flatter` |
| 12 | `Philosophy` | `Built on a simple idea` | `"Know thyself."` attributed `— inscribed at the temple of Apollo at Delphi, 6th century BC` |
| 13 | `COMMITMENT — Final CTA` | `Your journey begins here` | `See Clearly. / Navigate the Way.` |

The `5.`/`6.` numbering in source comments is inconsistent with the visual order — the numbered-comment labels were not updated when sections were re-arranged.

### Five Dimensions (as stated on the landing page)

```
Intention  (purple #9590ec) — "Your deepest purpose and why"
Volition   (fire   #e05a3a) — "Your will and drive to act"
Cognition  (air    #d4853a) — "How you think and process"
Emotion    (water  #4a9fd4) — "How you feel and regulate"
Action     (earth  #2db885) — "What you actually do consistently"
```

The mandala in the hero renders them as concentric rings (Intention innermost, Action outermost). The same five colors are locked in `tailwind.config.ts` as `ae.*` and again as CSS variables in [app/globals.css](app/globals.css) (`--color-ae-purple`, etc.).

### Archetype showcase (landing-page only — not scored here)

Eight tile names rendered in the `EXPRESSION` section: **Seeker, Dreamer, Analyst, Warrior, Builder, Empath, Guardian, Philosopher**. Each has a one-line tagline and a dot-combination of element colors. This list is **not** one of the canonical archetype lists used anywhere else in the codebase (see §17).

### Three testimonials (fictional, hardcoded in `app/page.tsx`)

- `Marcus R.` · `Architect · Integrated Phase`
- `Priya S.` · `Strategist · Emerging Phase`
- `Daniel W.` · `Seeker · Emerging Phase`

### Four-step funnel (the "Initiation" section)

01 `Answer guided questions` · ~8 min · maps identity across five dimensions
02 `Share your story` · ~2 min · brief reflections on past/now/future
03 `Your archetype is revealed` · Instant · "maps your configuration across 32 archetypal states"
04 `Get your full profile` · Instant · Free

### Six what-you-get cards

`Your Archetype Blend` 🧬 · `Full Dimensional Profile` 📊 · `Your Growth Pathway` 🌱 · `Your Aetherium Avatar` ◈ · `Your Growth Edge` 🎯 · `Shadow Pattern Analysis` 🌑 — all with `Free` badge.

### Four "daily system" cards

`Clarity Tool` · `Reflection Space` · `Decision Guide` · `Personal Dashboard`.

### Navigation

- Top nav: "AETHERIUM" wordmark on left; right-hand button switches between `Sign in` → `/auth` and `Dashboard` → `/dashboard` based on Supabase session state (see `useEffect` at [app/page.tsx:52](app/page.tsx:52)).
- Two CTAs link to `/onboarding/welcome`.
- Footer text: `AETHERIUM · A platform for human evolution`.

---

## 3. Discovery prototypes

**There are no standalone HTML discovery prototypes in this repository.** No `.html` files exist outside of `node_modules/` and `.next/` build output. No files are named v1/v2/v3/v46 or similar.

The Discovery experience is implemented entirely as Next.js App Router pages. The canonical flow, as evidenced by the code, is:

| Order | Path | File | Lines | What it does |
|---|---|---|---|---|
| 1 | `/` | [app/page.tsx](app/page.tsx) | 637 | Landing page (see §2) |
| 2 | `/onboarding/welcome` | [app/onboarding/welcome/page.tsx](app/onboarding/welcome/page.tsx) | 356 | "How Well Do You Know Your Self?" — animated 5-ring `LivingDiagram` that reveals Body→Heart→Mind→Soul→Spirit over 1.9s, then legend, then `Begin Exploration` CTA → `/assessment`. |
| 3 | `/assessment` | [app/assessment/page.tsx](app/assessment/page.tsx) | 764 | Four-phase page: **Presencing** (12s cinematic intro — `"What is true about you right now?"` → `"Not what you wish were true…"` → `Begin` button), **Dimension transitions**, **Questions** (Likert 1–5, 10 questions per dimension, 5 dimensions), **Completion transition**. Dimension order: `earth → water → air → fire → aether`. |
| 4 | `/results-preview` | [app/results-preview/page.tsx](app/results-preview/page.tsx) | 492 | "The Mirror" — free preview with archetype name, radar shape, dimension bars, one tension statement, blurred-out depth cards, inline email gate. |
| 5 | `/assessment/identity` | [app/assessment/identity/page.tsx](app/assessment/identity/page.tsx) | 207 | First-name + email only. "Create your profile to unlock your full system." (Referenced as a back-stop — the results-preview email gate routes directly to `/assessment/context` instead.) |
| 6 | `/assessment/context` | [app/assessment/context/page.tsx](app/assessment/context/page.tsx) | 411 | Three narrative prompts: `recent_challenges`, `recurring_pattern`, `desired_direction`. Includes browser-speech-recognition mic button per field. Two CTAs: `Refine My Profile` (uses narrative) vs `Use Baseline Results` (skips narrative). Both route to `/generating`. |
| 7 | `/generating` | [app/generating/page.tsx](app/generating/page.tsx) | 301 | 5-step animated interstitial: `Reading your field` → `Mapping dimensional tension` → `Identifying your pattern` → `Locating your growth edge` → `Assembling your profile`. Runs real scoring + (if available) POSTs to `/api/generate-results` for AI enrichment + persists to Supabase. Routes to `/results`. |
| 8 | `/results` | [app/results/page.tsx](app/results/page.tsx) | 1410 | "Personal Intelligence System" — the full dashboard (see §14). |

### Preview-mode harness
[components/dev/PreviewNav.tsx](components/dev/PreviewNav.tsx) (195 lines) renders a floating bottom-right navigator when `?preview=1` is present. It jumps between Welcome, Identity, steps 1–5 of Assessment, Context, Results. Seeded fixture data lives in [lib/dev/previewMock.ts](lib/dev/previewMock.ts) (150 lines) — an Aether-dominant / Water-deficient profile (scores 72/44/63/38/55) producing a Philosophical Seeker blend with a San Francisco narrative.

### Notable inconsistency in the funnel

- `/results-preview` is the conversion pinchpoint — it captures email inline and routes *directly* to `/assessment/context`, **bypassing** `/assessment/identity` entirely ([app/results-preview/page.tsx:121](app/results-preview/page.tsx:121)).
- `/assessment/identity` still exists and appears to be a leftover from an earlier ordering; its `← Back` link points to `/results-preview` ([app/assessment/identity/page.tsx:110](app/assessment/identity/page.tsx:110)).

---

## 4. The pitch deck

**Not present.** No `.pptx`, `.pdf`, `.key`, `.ai`, `.sketch`, `.fig`, `.html`, or markdown slide file exists in the repo. `scripts/generate_review_pdf.py` generates a codebase review PDF to `~/Desktop/Aetherium_MVP_Review.pdf` but that's a source-code printout, not a pitch deck.

---

## 5. The architecture diagram

**Not present** as a standalone HTML or image file.

The closest written representation of a layered architecture is a text ASCII table at [lib/canon/v1/index.ts:7–17](lib/canon/v1/index.ts:7):

```
│  LAYER              │  PURPOSE           │  QUESTION    │
│  Five Elements      │  Structure of self │  What am I?  │
│  Four Conditions    │  Operating state   │  How am I?   │
│  Twelve Chapters    │  Life context      │  Where am I? │
│  Seven Levels       │  Meaning lens      │  Why?        │
│  Four Aims          │  Energy direction  │  Toward what?│
│  Nine Principles    │  Collective health │  With whom?  │
```

That file also exports an `AETHERIUM_SYSTEM` constant declaring `version: '1.0'`, `status: 'locked'`, and an array of these six layers.

---

## 6. The gateway reel / 60-second experience

**Not present** as a video, `.mp4`, `.gif`, Lottie, or dedicated HTML scene.

There are two places that function as timed cinematic experiences inside the Next.js app:

1. **`WelcomePage`** ([app/onboarding/welcome/page.tsx:189–356](app/onboarding/welcome/page.tsx:189)) — 2.4 second reveal sequence: 5 concentric energy bands appear one per 350ms (Body→Heart→Mind→Soul→Spirit), ending with a legend fade-in. Total on-screen time is controlled by setTimeout chain `t0=200ms, t1=500ms, t2=850ms, t3=1200ms, t4=1550ms, t5=1900ms, t6=2400ms`.
2. **`PresencingScreen`** ([app/assessment/page.tsx:40–240](app/assessment/page.tsx:40)) — 4-phase 12-second sequence:
   - 0–1.5s: darkness, single point of light
   - 1.5–5s: light expands, first line appears (`"What is true about you right now?"`)
   - 5–8.5s: second line (`"Not what you wish were true. Not what used to be true. What is true right now."`), breathing ring
   - 8.5–10.5s: everything fades, `Begin` button appears

Neither is labeled a "gateway reel" in source.

---

## 7. Guide personas

**No file in the repository contains the names Iris, Mira, Aria, Phoenix, or Stella** (grep across the entire tree excluding `node_modules`/`.next` returns zero matches).

The only named persona/agent is **Trinity**, defined at [lib/engine/trinity.ts](lib/engine/trinity.ts) (145 lines) and referenced in 5 files:

- [lib/engine/trinity.ts](lib/engine/trinity.ts) — system prompt + OpenAI call (`gpt-4o`, temperature `0.5`, structured JSON output).
- [app/api/trinity/route.ts](app/api/trinity/route.ts) — POST endpoint.
- [app/dashboard/page.tsx](app/dashboard/page.tsx) — `VoiceCard` component labeled `Speak to Trinity`.
- [lib/engine/know-me.ts](lib/engine/know-me.ts) — mentions Trinity in a docstring about a structured self-discovery question bank.
- [app/vault/page.tsx](app/vault/page.tsx) — tags memories coming from Trinity.

### Trinity — voice / tone / modes (verbatim excerpts)

The system prompt identifies Trinity as the listening intelligence at the heart of Aetherium:
- `"You are not a chatbot. You are not a therapist. You are not an advice machine."`
- Tone directive: `Warm but not soft. Precise but not clinical. Deep but not heavy. Calm but not distant.`
- Self-image: `"a brilliant friend who has known you for years, says very little, and what they say always lands."`

Trinity operates in **exactly one of five modes per response**, chosen per-turn:

| Mode | Use when | Example |
|---|---|---|
| `REFLECT` | the person needs to feel heard | `"That sounds less like disappointment and more like feeling unseen."` |
| `DEEPEN` | there's something beneath that wants to emerge | `"What did that moment teach you about yourself?"` |
| `PATTERN` | the same thread is appearing again | `"You keep returning to this tension between freedom and belonging."` |
| `PRESERVE` | something identity-defining was said | `"That feels like a core belief worth holding onto."` |
| `GUIDE` | person is circling and needs a push | `"You already know the next step. What are you avoiding?"` |

Response shape (strict JSON):
```ts
{ mode, response, followUp, memoryWorthy, extractedThemes, suggestedTitle }
```

Rules include: never more than one mode per response; 1–3 sentences max; always exactly one follow-up question; use the person's actual words when reflecting.

There are no other named characters or personas.

---

## 8. The seven-day journey

**Not present.** No file describes a Monday-through-Sunday arc, a 7-day program, or a multi-day sequence.

Weekly data exists, but only as an analytics layer:
- [supabase/migrations/008_weekly_insights.sql](supabase/migrations/008_weekly_insights.sql) defines a `weekly_insights` table with a `week_start date` column, comment `"(Monday of the week)"`, AI-generated `summary`, `key_pattern`, `recommendation`, and a `dimension_deltas` jsonb.
- No code currently writes to this table. No cron/scheduler exists in-tree.

The 12 `TWELVE_CHAPTERS` at [lib/canon/v1/twelve-chapters.ts](lib/canon/v1/twelve-chapters.ts) describe life terrains (Initiation, Expansion, Stability, Plateau, Transition, Disruption, Contraction, Reconstruction, Integration, Emergence, Overload, Renewal) but are explicitly **not** a day-by-day arc — the source comment says *"A person may revisit many chapters multiple times across life."*

---

## 9. Practice structure

**There is no file defining a 10-minute practice, a five-segment arc, or a combined Meditation / Movement / Reflection / Contemplation / Integration ritual.**

What **does** exist are four distinct "practice" surfaces:

### 9a. Growth-edge practices (keyed by dimension, 3 strings each)
[lib/pathways/growth.ts:80–105](lib/pathways/growth.ts:80) — `GROWTH_PRACTICES` maps each of aether/fire/air/water/earth to three prescriptive actions. Sample:
- fire: `"Identify one important action you have been avoiding — do it within 24 hours."`
- earth: `"Establish one morning routine and hold it for 21 days without exception."`

### 9b. Today's Alignment — three named time slots
[lib/intelligence/index.ts:92–144](lib/intelligence/index.ts:92) defines `MORNING_ACTIONS`, `FOCUS_ACTIONS`, `EVENING_ACTIONS` — one string per dimension per slot. `deriveTodayAlignment()` returns an array of `{ slot: 'Morning' | 'Focus Block' | 'Evening', action, dimension, priority }`.

### 9c. Dashboard ritual cards
The live [app/dashboard/page.tsx](app/dashboard/page.tsx) (818 lines) renders **six** cards per the header comment:
1. Header (greeting + archetype)
2. `Speak to Trinity` (voice capture)
3. `Meditation` (timer 5/15/30)
4. `Reflection` (prompt + journal + AI insight)
5. `Movement` (body check-in)
6. `Mission` (persistent daily tasks)
7. `System` (radar + coherence + streak)

So the dashboard surfaces a five-activity-adjacent set — **Meditation, Reflection, Movement, Mission, System** — but there is no explicit "5-segment 10-minute arc" contract defining ordering, timing, or integration.

### 9d. Canonical practices from the second archetype system
[lib/aetherium/system/practices.ts](lib/aetherium/system/practices.ts) (201 lines) exports a `PRACTICES` catalog consumed by the `buildUserState` entry point at [lib/aetherium/system/index.ts:23](lib/aetherium/system/index.ts:23). See §17.

---

## 10. Dashboard / cosmic calendar

### What exists as a dashboard

[app/dashboard/page.tsx](app/dashboard/page.tsx) — 818 lines, `'use client'`. Docstring header lists seven cards:
```
1. Header (greeting + archetype + guidance)
2. Speak to Trinity (voice capture)
3. Meditation (timer 5/15/30)
4. Reflection (prompt + journal + AI insight)
5. Movement (body check-in)
6. Mission (persistent daily tasks)
7. System (radar + coherence + streak)
```

Key behavior:
- Loads the user's latest `profile_state` + archetype + full reading.
- `VoiceCard` (`Speak to Trinity`) uses browser `SpeechRecognition` + `MediaRecorder` (webm/mp4) — transcript sent to `/api/trinity`; raw audio blob sent to `/api/audio`.
- Fifteen voice categories: `Daily Reflection, Life Story, Childhood, Relationship, Business, Philosophy, Pain / Healing, Insight, Lesson Learned, Dream / Vision, Creativity, Parenting, Spirituality, Current Chapter, Free Speak`.
- Time-of-day greeting (`Good morning` / `Good afternoon` / `Good evening`).
- Radar chart via [components/DimensionChart.tsx](components/DimensionChart.tsx).

### Cosmic calendar

**No file named "cosmic calendar" or "calendar" exists.** There is no calendar component, view, or database table. The dashboard's "streak" element uses reflection-history data but is not calendar-shaped in the code.

### [app/vault/page.tsx](app/vault/page.tsx) — Memory Vault (253 lines)

Related post-Discovery surface. Eight filters: `All, Starred, Voice, Stories, Beliefs, Teachings, Insights, Dreams`. Renders up to 50 memory rows with title, content preview, AI themes, star toggle. Title: `Your Collected Self`.

---

## 11. Music spec

**Not present.** No file references `Alex`, frequencies in Hz, solfeggio, binaural, or instrument names. No `.mp3`, `.wav`, `.m4a`, `.ogg`, or `.flac` files exist in `public/` or elsewhere.

The `Meditation` card on `/dashboard` provides timer options (5/15/30 min) but there is no audio implementation code in the repo.

---

## 12. The Aetherium Bathhouse

**Not present.** No file references `Bathhouse`, `Fishtown`, `temple` as a physical venue, or any financial model / spreadsheet. No `.xlsx`, `.numbers`, `.csv` files exist outside `node_modules`.

The word **`Temple`** appears only in two places:
- As a background image filename — [public/Temple.png](public/Temple.png) and [public/Aetherium Temple v3.33.png](public/Aetherium Temple v3.33.png), used as the landing-page hero.
- As a Delphi reference in the "Philosophy" section of the landing page: `"inscribed at the temple of Apollo at Delphi, 6th century BC"`.

---

## 13. Brand assets

### Images — `public/` (6 total, all 1536×1024 PNGs)

| File | Size | Used in |
|---|---:|---|
| [Aetherium Temple v3.33.png](public/Aetherium%20Temple%20v3.33.png) | 2,904 KB | Landing-page hero background |
| [2. Entrance.png](public/2.%20Entrance.png) | 2,904 KB | Landing-page chapter marker after Pain section |
| [3. Passage.png](public/3.%20Passage.png) | 2,160 KB | Landing-page marker after Flow section |
| [4. Courtyard.png](public/4.%20Courtyard.png) | 2,920 KB | Landing-page marker before Flow section |
| [5. Chamber.png](public/5.%20Chamber.png) | 2,192 KB | Not currently referenced in `app/page.tsx` |
| [Temple.png](public/Temple.png) | 2,868 KB | Not currently referenced |

(The numbered filenames `2.`–`5.` imply an intended `1.`–`6.` sequence; only `Temple.png` and `Aetherium Temple v3.33.png` could be the missing bookends.)

### SVG icons — create-next-app defaults (unchanged)
`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`.

### Colors — three sources that agree

**From [tailwind.config.ts](tailwind.config.ts) and [app/globals.css](app/globals.css):**
```
ae-purple #9590ec  ·  ae-fire #e05a3a  ·  ae-air #d4853a
ae-water  #4a9fd4  ·  ae-earth #2db885
Surface:  bg #08080e · surface #0d0d18 · surface-2 #141420 · surface-3 #1c1c2e
Text:     #eae8f2 (85% opacity tiers)
```
[lib/canon/v1/five-elements.ts](lib/canon/v1/five-elements.ts) uses the same palette.
**Inconsistency:** [lib/aetherium/system/constants.ts:17](lib/aetherium/system/constants.ts:17) defines a *different* palette for the same names: `aether #7B61FF, fire #FF4D4D, air #FF9F1C, water #3A86FF, earth #2DC653`. These are never imported by the UI but they sit in the exported `AETHERIUM_ROSETTA` object.

### Typography

- `Cinzel` (400, 500) — uppercase labels, eyebrows, nav, buttons
- `Cormorant Garamond` (300, 400, 500 + italic) — body, headlines, quotes
- Loaded via Google Fonts `@import` at [app/globals.css:1](app/globals.css:1)
- Registered in Tailwind as `font-cinzel` and `font-cormorant`.

### Brand marks in code

No logo SVG exists in `public/`. The brand mark that appears throughout the app is the typographic glyph **`◈`** (U+25C8) — used as the avatar `core`, section divider in `<Kigo />`, and next to archetype text. The word `AETHERIUM` is rendered in Cinzel as the nav brand.

### Branding glossary (from metadata)

- `Aetherium — A Platform for Human Evolution` (page title)
- Landing footer: `AETHERIUM · A platform for human evolution`
- Results header anchor: `"Discovery Complete"` → `"Your pattern has been mapped."`

---

## 14. Copy & content

### 14a. Landing-page copy

See §2 for section structure. Key lines (≤15 words each) defining concepts:
- Hero sub: `"There is an underlying structure to human life."` / `"You are already moving through it."`
- Pain closer: `"Aetherium changes that."` / `"It gives you the map."`
- Structure closer: `"You are not a type. You are a configuration."`
- Mechanism: `"Blockage · Distortion · Misalignment"` are the three flow-failure states.
- Philosophy: `"Know thyself."`
- Final CTA: `"See Clearly. Navigate the Way."`

### 14b. Assessment questions (two versions coexist)

**Active version** ([lib/assessment/questions.ts](lib/assessment/questions.ts), 195 lines): **50 Likert items**, 10 per dimension, with three sub-categories per dimension:
- Aether: `purpose / alignment / meaning`
- Fire: `initiative / commitment / drive`
- Air: `clarity / analysis / communication`
- Water: `awareness / connection / regulation`
- Earth: `execution / consistency / grounding`

Scale: `Never (1) · Rarely (2) · Sometimes (3) · Often (4) · Always (5)`. Dimension order `earth → water → air → fire → aether`, with source comment: *"begin with observable reality, move through emotion and cognition, end with purpose when the user is most open and self-aware."*

**Parallel "final" version** ([lib/assessment/questions-v1-final.ts](lib/assessment/questions-v1-final.ts), 246 lines): `QUESTIONS_V1` — same 50 IDs, rewritten wording, annotated with `[NEW]` / `[REWRITTEN]` / `[REPLACED]` comments documenting audit decisions. **Not imported by any file** — the app still reads from `questions.ts`. This is a staged-but-not-switched-in replacement.

### 14c. Narrative context prompts

Three shown in `/assessment/context` ([app/assessment/context/page.tsx:26](app/assessment/context/page.tsx:26)):
1. `recent_challenges` — `"What's actually happening in your life right now? Where are you feeling the most friction…"`
2. `recurring_pattern` — `"What keeps repeating that you haven't fully resolved?"`
3. `desired_direction` — `"Where do you feel pulled to go next?"`

Type definition [lib/assessment/narrative.ts](lib/assessment/narrative.ts) lists **9** fields total (the 3 above plus `life_phase, environment, avoidance, deeper_pull, energy_state, energy_sources`) but the live UI only collects 3. `EnergyState` is typed as `'Scattered' | 'Stuck' | 'Stable' | 'Focused' | 'Driven'` but no UI collects it.

### 14d. Archetype interpretation copy

[lib/archetypes/definitions.ts](lib/archetypes/definitions.ts) — each of 32 archetypes carries seven strings: `corePattern`, `coreTension`, `primaryBlock`, `whenAligned`, `whenMisaligned`, `rebalancingPath`, `practiceOrientation`, `aiOutput`. The `aiOutput` is the canonical mirror statement shown on the preview page (e.g. for The Strategist: `"You are currently operating as The Strategist. You see clearly—but you are not moving. Your next step is not more thinking. It is action."`).

### 14e. Dimension tension map (dominant × growth-edge)

[lib/intelligence/index.ts:49–79](lib/intelligence/index.ts:49) — `TENSION_MAP` provides one mirror line for each of the 20 non-identity pairs. Example (aether dominant, earth growth): `"The intention is present. What is missing is the sustained discipline to make it real."`

### 14f. Dimension interpretations by balance

[lib/scoring/engine.ts:273–303](lib/scoring/engine.ts:273) — `getDimensionInterpretation()` returns one of three strings (`low/medium/high`) per dimension.

### 14g. Growth-edge prose

[lib/pathways/growth.ts:71–77](lib/pathways/growth.ts:71) — `GROWTH_EDGE_DESCRIPTIONS` has one longer paragraph per dimension.

### 14h. Evolution-state descriptions

[lib/assessment/stateEngine.ts:154](lib/assessment/stateEngine.ts:154) — five states (`fragmented / emerging / integrated / advanced / unified`) each with a color and a 1-sentence description.

### 14i. Know-Me question bank (not wired in UI)

[lib/engine/know-me.ts](lib/engine/know-me.ts) — 210 lines. 21 categories including `identity, childhood, family, love, heartbreak, career, money, spirituality, failures, strengths, travel, regrets, turning-points, values, philosophy, dreams, health, legacy, joy, shadow, teachings`. Questions at three depths 1/2/3. **No UI surfaces these questions** — file is only imported conceptually. The Dashboard voice categories partially overlap but don't use these IDs.

### 14j. Marketing emails / waitlist copy

**None.** No email templates, no MJML, no text or html email files. No landing-page waitlist form.

---

## 15. Technical infrastructure

### 15a. Environment — `.env.local`

Three variables exist (values redacted):
- `NEXT_PUBLIC_SUPABASE_URL` — points to `https://hojbkwarfptzhshvszhy.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — `sb_publishable_…` (the newer Supabase key format)
- `OPENAI_API_KEY` — live `sk-proj-…` key

**⚠ Security note:** This file is **not** gitignored selectively — `.env*` is in `.gitignore`, but the file IS present in the checkout with real-looking credentials. This is a fact worth flagging to the collaborator, not a recommendation.

### 15b. Supabase schema — 11 migrations

All migrations additive, RLS enabled. Full list by file:

| # | File | Purpose | New tables |
|---|---|---|---|
| 001 | [001_initial_schema.sql](supabase/migrations/001_initial_schema.sql) | MVP baseline | `assessments`, `assessment_answers`, `profile_states` |
| 002a | [002_schema_v2.sql](supabase/migrations/002_schema_v2.sql) | Versioning + extended columns | adds `archetype_results`, `ai_generations` (stub) |
| 002b | [002_assessment_engine.sql](supabase/migrations/002_assessment_engine.sql) | **Duplicate 002** — a second, cleaner v2 bundle with a conflicting numbering |
| 003 | [003_current_alignment.sql](supabase/migrations/003_current_alignment.sql) | `profiles` table, `profile_id` FK on assessments/profile_states, `narrative_context` jsonb |
| 004 | [004_reflection_engine.sql](supabase/migrations/004_reflection_engine.sql) | `reflections`, `framework_readings`, `guidance_outputs` |
| 005 | [005_canon_profile_states.sql](supabase/migrations/005_canon_profile_states.sql) | Adds canon-aligned columns to `profile_states` (`archetype_category, signal_quality, life_chapter, meaning_level, flow_state, calling_orientation, shadow_trigger, growth_edge_label, growth_dimension, canon_version`) |
| 006 | [006_canon_framework_readings.sql](supabase/migrations/006_canon_framework_readings.sql) | Same canon columns on `framework_readings` |
| 007 | [007_daily_checkins.sql](supabase/migrations/007_daily_checkins.sql) | `daily_checkins` — one per user per day |
| 008 | [008_weekly_insights.sql](supabase/migrations/008_weekly_insights.sql) | `weekly_insights` |
| 009 | [009_voice_notes.sql](supabase/migrations/009_voice_notes.sql) | `voice_notes` — Supabase Storage metadata |
| 010 | [010_memory_vault_missions.sql](supabase/migrations/010_memory_vault_missions.sql) | `memories` (9 memory_types, 4 sources, tags gin index, starred/archived flags) + `missions` |

**Duplicate migration numbering:** `002_schema_v2.sql` and `002_assessment_engine.sql` both exist. Whichever runs second will see most operations idempotent (all `ADD COLUMN IF NOT EXISTS`), but the file collision is preserved verbatim in source.

**Framework-reading columns also preserve the legacy "Rite/Stage" system:** [004_reflection_engine.sql:69–86](supabase/migrations/004_reflection_engine.sql:69) defines enum-constrained `rite` (`ORIGIN, AWAKENING, INITIATION, CROSSING, ORDEAL, SURRENDER, ILLUMINATION, OFFERING, EMBODIMENT`) and `stage` (`REACTIVE, CONFORMING, AWAKENING, BUILDING, AUTHORING, INTEGRATING, TRANSCENDING`). Migration 006 then adds `life_chapter` + `meaning_level` columns *alongside* these — the transition isn't complete. [app/api/reflect/route.ts:178–189](app/api/reflect/route.ts:178) carries explicit mapping tables from new canon values back to the old enum labels for backward-compat writes.

Also present: `supabase/.temp/cli-latest` (metadata from a `supabase` CLI invocation).

### 15c. Auth

[app/auth/page.tsx](app/auth/page.tsx) — two methods:
1. Google OAuth via `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: origin+'/auth/callback' })`
2. Magic-link email OTP via `supabase.auth.signInWithOtp({ email, emailRedirectTo: origin+'/auth/callback', shouldCreateUser: true })`

[app/auth/callback/page.tsx](app/auth/callback/page.tsx) — three redundant strategies (PKCE code exchange, session check, `SIGNED_IN` event listener) + a 10-second timeout guard. Handles identity stitching via [lib/persistence/profiles.ts `linkUserToProfile`](lib/persistence/profiles.ts) by matching normalized email, then redirects to `/dashboard` or `/onboarding/welcome`.

**Also offered:** a `"Continue without an account"` link on `/auth` pointing to `/onboarding/welcome`.

### 15d. API routes — 5 total

| Route | File | Method | Purpose |
|---|---|---|---|
| `/api/generate-results` | [route.ts](app/api/generate-results/route.ts) | POST | Canon-aware enrichment; calls `generateAetheriumResults()` → OpenAI `gpt-4o` (via [lib/engine/generateResults.ts](lib/engine/generateResults.ts), 369 lines). Validates dimensionScores 0–100, requires `past/present/future` narrative strings. |
| `/api/reflect` | [route.ts](app/api/reflect/route.ts) | POST | Daily reflection analysis. Saves reflection → runs `runFrameworkAnalysis()` ([lib/engine/framework-analysis.ts](lib/engine/framework-analysis.ts), 346 lines) → saves framework_reading + guidance_output. Uses GPT-4o. |
| `/api/trinity` | [route.ts](app/api/trinity/route.ts) | POST | Trinity conversation. Fetches recent memories for pattern context, calls `askTrinity()`, saves memory, optionally stars "memoryWorthy" entries. |
| `/api/voice` | [route.ts](app/api/voice/route.ts) | POST | Accepts a transcript; saves as both reflection and memory. |
| `/api/audio` | [route.ts](app/api/audio/route.ts) | POST | Accepts FormData with `audioBlob`; uploads to Supabase Storage bucket `voice-notes` (private), creates `voice_notes` row. |

All server routes use `'server-only'` on the OpenAI helper and validate `accessToken` by calling `client.auth.getUser()` and comparing `user.id === userId`.

### 15e. OpenAI integration

[lib/openai.ts](lib/openai.ts) — 6 lines. `new OpenAI({ apiKey: process.env.OPENAI_API_KEY })`. All three callers use `model: 'gpt-4o'` with `response_format: json_schema` (strict) except where noted.

### 15f. Payments / analytics / email

**None.** No Stripe, Paddle, LemonSqueezy, Plausible, PostHog, Segment, SendGrid, Resend, Postmark, or Mailgun. No email templates. No tracking scripts.

### 15g. Scripts
- [scripts/fetch-dashboard-payload.ts](scripts/fetch-dashboard-payload.ts) — 233 lines. Service-role Supabase script that assembles the closest-possible dashboard payload for a hardcoded email `contact@chrisporto.me`. Notes which tables "did not exist yet" at the time of writing (reflections, framework_readings) — those now exist.
- [scripts/generate_review_pdf.py](scripts/generate_review_pdf.py) — 256 lines. Uses `reportlab` to produce `~/Desktop/Aetherium_MVP_Review.pdf` — a styled source-code review document.

### 15h. Tests

- [tests/canon-engine.test.ts](tests/canon-engine.test.ts) — 475 lines. Custom tsx-based test runner (`npx tsx tests/canon-engine.test.ts`) asserting archetype matching, growth-edge derivation, shadow derivation, balanced-system detection, signal-quality checks. Header names it the `25-PERSONA TRUTH TEST SUITE`.
- [tests/output-review.ts](tests/output-review.ts) — 171 lines. Generates 10 realistic full-engine outputs for copy review.
- **No Jest, no Vitest, no Playwright, no testing-library, no CI workflow.**

---

## 16. Git history

**Branch:** `reflection-engine-v1` (currently checked out, clean working tree, up-to-date with `origin/reflection-engine-v1`).
**Branches:** local `main` + `reflection-engine-v1`; remotes mirror both. 2 commits ahead of `main`.

### Full commit log (17 commits)

```
5844d34 2026-04-16  Finalize Aetherium V1 dashboard polish
152f32b 2026-04-16  Lock onboarding, welcome page, and discovery flow v1
bd2bab9 2026-04-07  Fix results page null identity fields for production build
86cfeb2 2026-04-07  Fix results saveProfile optional identity typing
65dd094 2026-04-07  Funnel V2: refined results UX, added signal integrity notice,
                    balanced system logic, improved CTA and practices framing
8819e6a 2026-04-07  V2 dashboard: mode-based layout with primary vector and reflection workspace
e85aff2 2026-03-27  Fix auth callback build by removing useSearchParams
5b576bb 2026-03-27  Improve homepage mobile spacing and hero rendering
5e05385 2026-03-27  Fix authenticated navigation and OAuth callback redirect
ada4d1b 2026-03-27  Fix identity stitching with normalized email matching
74af200 2026-03-27  Complete auth return loop and surface canonical role on dashboard
fa5f51e 2026-03-27  Add profile save flow and persistence alignment
eae0a14 2026-03-27  Make alignment migration idempotent
85e061e 2026-03-26  Refine onboarding flow, context expansion, generating logic, and CTA updates
a45ef62 2026-03-26  Add Supabase JS dependency
60d890d 2026-03-26  Aetherium prototype v1
5c1ff5f 2026-03-24  Initial commit from Create Next App
```

### Observable rhythm

- **2026-03-24:** repo scaffolded from create-next-app.
- **2026-03-26:** Aetherium v1 prototype landed as one large commit + Supabase dependency.
- **2026-03-27 (single day):** 7 commits wiring auth end-to-end (magic link + OAuth callback, profile stitching, OAuth build fix).
- **2026-04-06:** (no commit, but migration 004 is dated this day in its header)
- **2026-04-07 (single day):** 4 commits around "Funnel V2" + "V2 dashboard" + production-build hotfixes.
- **2026-04-16:** 2 commits — lock onboarding/welcome/discovery v1, then polish the V1 dashboard.

The last nine days (2026-04-07 → today 2026-04-18) have produced only 3 commits, all on 2026-04-07 and 2026-04-16. Current branch name `reflection-engine-v1` implies work ahead on reflection features, but the two commits on this branch so far are dashboard and onboarding polish.

No tags. No signed commits. No stashes visible.

---

## 17. Anything else

### 17a. Three parallel archetype ontologies

The codebase contains **three distinct archetype systems that don't reconcile with each other**:

**System A — `lib/archetypes/definitions.ts`** (713 lines) — the one the live app uses.
32 archetypes with 0–5 element vectors and explicit category tags `core / expansion / shadow / transcendent`:
```
Core (10)         Strategist, Builder, Seeker, Guardian, Catalyst, Creator,
                  Integrator, Visionary, Refiner, Connector
Expansion (8)     Leader, Operator, Explorer, Healer, Teacher, Performer, Analyst, Rebel
Shadow (7)        Overthinker, Drifter, Controller, Avoider, People-Pleaser,
                  Perfectionist, Burnout
Transcendent (7)  Alchemist, Sage, Orchestrator, Harmonizer, Magician,
                  Embodied Self, Unified Being
```
Source attribution in the file header: `"Aetherium_Locked_Master_Canon - SACRED MATH.docx"` and `"Aetherium_Locked_Archetype_Breakdown - INTERPRETATION.docx"` (neither in repo).

**System B — `lib/aetherium/system/archetypes.ts`** (856 lines) — a full parallel engine, exported from [lib/aetherium/system/index.ts](lib/aetherium/system/index.ts) as `AETHERIUM_ROSETTA` with `version: '1.0.0'`.
32 archetypes using `key` + `signature` instead of `id` + `vector`. Mostly different names:
```
Shadow        Fragmented, Drifter, Reactor, Suppressor, Overthinker, Escapist,
              Performer, Dependent
Emerging      Initiator, Striver, Analyst, Strategist, Empath, Connector,
              Operator, Builder
Integrated    Warrior, Architect, Scholar, Visionary, Guide, Guardian,
              Alchemist, Harmonizer
Unified       Leader, Healer, Sage, Creator, Integrator, Seeker, Orchestrator, Avatar
```
Ships with its own `PRACTICES`, `PATHWAY_STAGES`, `DIMENSIONS`, visuals, scoring, and `buildUserState(rawScores)` entry point. Uses a completely different color palette (`aether #7B61FF` vs `#9590ec`). **Not imported by any page or API route** — it is a complete, parallel, unused engine.

**System C — `lib/canon/aetherium_canon_v1.json`** (391 lines) + runtime layer [lib/canon/index.ts](lib/canon/index.ts).
Reframes the "archetype" concept as **"Roles"** grouped by element:
```
Fire     Warrior, Creator, Performer, Storyteller, Visionary, Igniter
Water    Healer, Guide, Mediator, Partner, Advocate, Anchor
Earth    Builder, Operator, Maker, Engineer, Organizer, Steward
Air      Strategist, Analyst, Researcher, Teacher, Advisor, Navigator
Aether   Leader, Orchestrator, Architect, Connector, Catalyst, Alchemist
Meta     Explorer, Founder
```
Introduces a `Role / Context / Direction` core triad. Has correct and incorrect language patterns (correct: `"You are currently operating as…"`; incorrect: `"You are permanently…"`). Names "overlap risks" e.g. `[Guide, Teacher, Advisor]`. **The live results page and scoring engine do not import from this canon file** — it exists as reference data.

**Shared names across systems:** Strategist, Builder, Creator, Visionary, Leader, Connector, Guardian, Alchemist, Performer, Analyst, Healer — but they mean different things in each ontology (different element weights, different categories).

### 17b. Six-framework canon v1 (separate from the archetype systems)

[lib/canon/v1/](lib/canon/v1/) — 7 files, all labeled `LOCKED` / `v1.0`, each citing a `.docx` source document name in the header (none in repo):
- `five-elements.ts` — Aether/Fire/Air/Water/Earth with ring order (1–5), `coreFaculty`, `function`, `discipline`, `essentialQuestion`, `essence`, `healthy/weak/excess` expressions.
- `twelve-chapters.ts` — 12 life chapters (full prose per chapter; see §8).
- `seven-levels.ts` — `survival, desire, belonging, achievement, awakening, integration, transcendence`, each with `identityLogic`, `shadowExpression`, `coreFear`.
- `four-conditions.ts` — Flow compass: `activation 🔥, alignment ➡️, attunement ↔️, attentiveness ⬤`.
- `four-aims.ts` — `connection, contribution, creativity, capability` with `expression`, `distortionNeglected`, `distortionOverused`.
- `nine-principles.ts` — three layers (`foundations / integration / vitality`): `trust, respect, belonging, autonomy, communion, stewardship, diversity, dynamism, growth`.

[lib/canon/v1/index.ts:93–111](lib/canon/v1/index.ts:93) exports an `AETHERIUM_SYSTEM` summary constant whose `coreInsight` begins: *"A person is not broken. A person is often simply misaligned, underdeveloped in one dimension, overidentified with another, disconnected from their deeper orientation, or lacking integrated practice."*

### 17c. Scoring pipeline — deterministic layer

Pure functions, no network:
- [lib/scoring/engine.ts](lib/scoring/engine.ts) (305 lines) — `scoreAssessment()`, `computeDimensionScores()`, dimension balance bucketing (`low < 34 < medium < 67 ≤ high`), evolution-state thresholds (`<25 fragmented · <45 emerging · <63 integrated · <80 advanced · ≥80 unified`).
- [lib/scoring/coherence.ts](lib/scoring/coherence.ts) — per-dimension + global coherence with 5-tier labels (`fragmented, inconsistent, moderate, consistent, integrated`).
- [lib/scoring/signal.ts](lib/scoring/signal.ts) (130 lines) — signal-quality layer. Balanced-system detection (`±0.5` on 0–5 scale), inflation bias (`>75%` max-value answers), low variance, flat profile → confidence `high/moderate/low`.
- [lib/scoring/normalize.ts](lib/scoring/normalize.ts) + [lib/scoring/runner.ts](lib/scoring/runner.ts) — helpers.
- [lib/archetypes/matcher.ts](lib/archetypes/matcher.ts) (388 lines) — weighted Euclidean distance; canon weights `1.25×` on user's deficient dimension, `1.10×` on dominant, `1.00×` otherwise. Normalizes 0–100 to 0–5 first.
- [lib/archetypes/shadow.ts](lib/archetypes/shadow.ts) (229 lines) — derives shadow from weakest dimension + trigger rules. Special case: all ≤ 1.0 on 0–5 scale → Burnout.
- [lib/pathways/growth.ts](lib/pathways/growth.ts) (288 lines) — growth profile + pathway options.

### 17d. Intelligence derivations (static)

[lib/intelligence/index.ts](lib/intelligence/index.ts) (362 lines) — pure-function layer producing:
- `TENSION_MAP` — 20 mirror lines (dominant × growth-edge)
- `deriveTodayAlignment()` — 3 time slots × 5 dimensions = 15 `MORNING_ACTIONS`, 15 `FOCUS_ACTIONS`, 15 `EVENING_ACTIONS`
- `deriveImbalanceInsight()` — uses `BEHAVIORAL_PATTERNS` (20 pairs) + `EDGE_INTERVENTIONS` (5 dimensions)
- `PRACTICE_META` with `why / impact / timeframe`
- `loadScoreHistory` / `saveScoreSnapshot` — localStorage-backed history tracking for the progress panel

### 17e. Visual components

| File | Lines | Purpose |
|---|---:|---|
| [components/DimensionChart.tsx](components/DimensionChart.tsx) | 133 | SVG radar chart |
| [components/DimensionMandala.tsx](components/DimensionMandala.tsx) | 241 | 5-ring concentric mandala (used on landing + generating interstitial) |
| [components/EnergyField.tsx](components/EnergyField.tsx) | 176 | Ambient background energy field |
| [components/HomepageMandala.tsx](components/HomepageMandala.tsx) | 150 | Canvas-based animated mandala for hero |
| [components/HomepageBgCanvas.tsx](components/HomepageBgCanvas.tsx) | 70 | Scrolling starfield background |
| [components/ProfileCard.tsx](components/ProfileCard.tsx) | 33 | Profile display snippet |
| [components/ProfileForm.tsx](components/ProfileForm.tsx) | 101 | Profile editing form |
| [components/ScrollReveal.tsx](components/ScrollReveal.tsx) | 37 | IntersectionObserver fade-in wrapper |
| [components/ui/*](components/ui/) | ~270 total | Button, Card, Container, Input, Progress, Section primitives (all use `ae-*` class names from `globals.css`) |
| [components/dev/PreviewNav.tsx](components/dev/PreviewNav.tsx) | 195 | `?preview=1` floating nav |

### 17f. Generated/build artifacts present in checkout

- `.next/` — compiled build output (server HTML for every route, static chunks, instrumentation)
- `tsconfig.tsbuildinfo` — incremental build cache (150 KB)
- `node_modules/` (310 top-level packages)
- `.DS_Store` files at repo root (8 KB) — not gitignored per individual rule but covered by `.gitignore` `.DS_Store` entry.

### 17g. TODOs / notes-to-self verbatim

The only inline note resembling a TODO is a comment at [app/page.tsx:627](app/page.tsx:627) explaining the re-used `Kigo` component, and a detailed explanation at [app/auth/callback/page.tsx:83](app/auth/callback/page.tsx:83) about why `useSearchParams()` is intentionally avoided. There are no `TODO`, `FIXME`, `XXX`, or `HACK` tokens grep-able in the live source (`app/`, `components/`, `lib/`).

[lib/engine/payload.ts:36–46](lib/engine/payload.ts:36) contains a long docstring section titled `'`values' — not yet collected"`' describing exactly how to add a values field to `/assessment/identity` — not a TODO marker but an explicit "not-yet-wired" note that's worth preserving.

[scripts/fetch-dashboard-payload.ts:12–16](scripts/fetch-dashboard-payload.ts:12) preserves stale commentary claiming `reflections`, `framework_readings`, and `ai_generations` tables "did not exist yet" — they *do* exist now (migration 004).

### 17h. Storage bucket expected but not in migrations

[app/api/audio/route.ts:45](app/api/audio/route.ts:45) uploads to Supabase Storage bucket `voice-notes` and handles missing-bucket errors with the helpful message: *"Create it in Supabase Dashboard → Storage → New bucket → name: voice-notes, private."* The bucket is referenced in code but **not** provisioned by any SQL migration in-tree.

---

## Repository Shape

This is a **Next.js 16 + Supabase + OpenAI prototype** roughly four weeks old at the commit level (2026-03-24 → 2026-04-16), weighing about **14,000 lines** of TypeScript and SQL across 86 files (not counting node_modules / .next / tests). It is a single, real, live web product — not a slide deck, not a document vault, not a marketing site — and the repo contains none of the adjacent artifact categories one might expect for a larger "Aetherium" ecosystem (no pitch deck, no architecture HTML, no gateway reel, no bathhouse / Fishtown docs, no music spec, no seven-day arc, no Iris/Mira/Aria/Phoenix/Stella persona files). The only named persona implemented in code is **Trinity**, the listening intelligence on `/dashboard` and in `/api/trinity`. The physical/brand layer of "Aetherium" exists here mostly as atmosphere: six temple/chamber PNGs, a two-font Cinzel/Cormorant typography system, the `◈` glyph as the default mark, and a five-color element palette that's locked in three places (Tailwind, globals.css, canon/v1/five-elements) and inconsistently duplicated in a fourth (`aetherium/system/constants.ts`).

**Weight is concentrated in three places.** First, the Discovery funnel — `/` (637 L), `/onboarding/welcome` (356 L), `/assessment` (764 L), `/results-preview` (492 L), `/generating` (301 L), `/results` (1,410 L). This is the product's spine and its biggest component surface, polished through several passes ("Funnel V2", "V1 dashboard polish"). Second, a deep deterministic scoring + archetype system — ~50 Likert questions, matcher, shadow derivation, growth pathway, coherence, signal quality, 32 archetypes with seven-field interpretation copy each, plus tension/practice/alignment maps — all pure functions that run client-side and produce a full profile without calling any API. Third, a post-Discovery daily-use layer — dashboard cards (Trinity, Meditation, Reflection, Movement, Mission, System), a Memory Vault (`/vault`), and five API routes for AI enrichment (`/api/generate-results`, `/api/reflect`, `/api/trinity`, `/api/voice`, `/api/audio`).

**Three inconsistencies stand out.** (1) There are **three distinct 32-archetype/role ontologies** in-tree — the live one at `lib/archetypes/definitions.ts`, a complete parallel engine at `lib/aetherium/system/*` that nothing imports, and a role-based JSON canon at `lib/canon/aetherium_canon_v1.json`. They share some names (Strategist, Builder, Creator, etc.) but have different categories, different vectors, and different palettes. (2) The reflection engine has a **hybrid rite/stage + canon** schema — the old `ORIGIN/AWAKENING/…` rite enum and `REACTIVE/CONFORMING/…` stage enum are still live in `framework_readings`, with the new `life_chapter` and `meaning_level` canon columns added alongside and a mapping table at [/api/reflect:178](app/api/reflect/route.ts:178) bridging them. (3) Two migrations share the number **002** (`002_schema_v2.sql` + `002_assessment_engine.sql`) and two versions of the question bank coexist — the live `questions.ts` and the audited, unused `questions-v1-final.ts`.

**Current focus**, read from branch name + recent commits, is `reflection-engine-v1` — but the two commits on that branch so far are "Lock onboarding, welcome page, and discovery flow v1" and "Finalize Aetherium V1 dashboard polish," both landed on 2026-04-16. The branch suggests a push toward the reflection/framework-analysis workflow (migrations 004–010 all support this direction), but the actual work recorded on-branch is a lock-down of the pre-existing Discovery surface rather than new reflection-engine code. There has been no commit in the past 14 days.

**Infrastructure state:** Supabase project is live at `hojbkwarfptzhshvszhy.supabase.co` with 11 migrations applied (RLS enabled throughout, anon-insert allowed for assessment tables). OpenAI is wired (GPT-4o, strict JSON schemas). No analytics, no email, no payments, no CI, no test runner beyond two tsx scripts. `.env.local` is checked into the working tree with what appear to be real credentials — worth flagging to whoever picks this up next.
