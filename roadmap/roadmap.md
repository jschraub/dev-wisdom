# Functional JavaScript — Cluster Roadmap

*Private planning doc. Not for publication. The series is never announced as a set — each piece ships standalone and searchable, the tag accretes, and cross-links get added retroactively (see Linking Discipline).*

**Tag:** `Functional JavaScript`
**Audience:** working TS devs who write JavaScript like it's Java — escalating from "think functionally" to "architect TS like a functional systems engineer."

**House style:**
- Declarative/provocative head + colon + keyword tail.
- Real frontend code, never toy examples. Each piece: a one-line callback to the prior, a running example, a "doorway not room" handoff, and one honest caveat that pre-empts the "well, actually" crowd.
- **Framework stance:** the *thesis* of every piece is framework-agnostic. *Examples* default to React — it's the largest audience and your deepest experience, so React code lands. Reach for another framework or context only when it is the *prime* illustration of the point.
- **Library stance:** teach the concept first, library-free. Name libraries (Effect-TS, zod, valibot, XState, optics-ts, fast-check) only *after* the idea is established, as "this is where it gets productionized." No piece is a tutorial for a specific library — each must still stand if the named libs vanished.

## The arc

1. **Think functionally** — the mindset and the core moves.
2. **Model honestly** — make the types carry the guarantees.
3. **Tame the hard parts** — effects, state, nested data: what imperative code does badly.
4. **Collect the payoffs** — what all that purity buys you.

## Write order

Sequenced so every setup ships before the payoff that needs it. Doubles as the reading order — the arc is pedagogically linear, so the dependency order *is* the publish order.

1. **Your Functions Aren't Functions** — the foundation everything else refers back to.
2. **Six Functional Patterns** — the toolkit; sets up the `Result` doorway.
3. **Errors Are Values** — needs #2's doorway; introduces `Result`/`Option` and illegal-states.
4. **Parse, Don't Validate** — extends #3's illegal-states to the input boundary; tightest follow-on.
5. **Effects Are Values** — introduces decisions-as-data, which #6 is built on.
6. **State Is a Fold Over Events** — needs #5's decisions-as-data; produces the pure reducers #8 tests.
7. **Lenses** — needs #2 (immutability) and #3 (`Option`); otherwise standalone, so it slots in as the deeper cut.
8. **Don't Write Tests, Write Properties** — the payoff; only lands once the pure core it tests (#3 pipelines, #4 parsers, #5 core, #6 reducers) already exists. Always last.

## The running example

One domain throughout: **an orders view**, in React where it fits. Stages 1–2 use the data pipeline (fetch → filter → sort → map → total → immutable update). Stage 3 renders it as a small React **orders-management UI**, which naturally supplies what the bare pipeline lacks — nested settings/config state for Lenses, and an edit/event log for State. A non-React illustration appears only when it's the prime example of a point.

## Voice & rhetoric

Governs every piece.

- **The enemy is dismissal, not fear.** Readers don't fear FP — they dismiss it ("I already know what a function is; this is basics"). The wall is false familiarity: the familiar isn't the trivial. Each piece lands the "you've been using a crippled half of an idea you think you've mastered" beat in its own way.
- **Voice: earned wisdom.** First person, pragmatic — a fellow skeptic converted *by results*. The origin: dismissed FP in college (stale algebra, dead languages, theory with no stakes), too young to see why it mattered; twenty years in big tech and HFT revealed its importance. *Not anti-theory* — the math matters; the younger you just couldn't see it yet.
- **Posture: provocative framing, pragmatic prescriptions.** Provocative in the framing (recipes vs. equations, "your functions aren't functions"); pragmatic in the prescriptions — every technique earns its slot by killing a recognizable pain, and you openly mark where it's *not* worth it. Recurring note: "I'm not asking you to become a Haskell monk, just to make the handful of moves that pay rent."
- **Autobiography lives in #1 only.** The full origin story anchors the opener; later pieces inherit the posture, not the life story.

## Visuals & signature

- **Three bespoke diagrams, one shared style** — only where the concept is genuinely spatial: the railway (#3), functional core / imperative shell (#5), fold-over-events timeline (#6).
- **Recurring motif = the series signature:** a styled before/after "pain → move → payoff" block in every piece. Code is the visual everywhere else — don't force diagrams onto Parse, Lenses, or Testing.

---

## 1 · Your Functions Aren't Functions: Why JavaScript Punishes Your Java Habits  ✓ published
*Stage 1 · ~1,500w · the why*

- **Frame:** recipes vs. equations. "Function" is overloaded — the math function declares an equality; the imperative one is a recipe of steps. You write recipes; the language wants equations.
- **Opening hinge (reclaim the math):** open on the wound — Lisp, theory, felt like stale algebra homework — then flip it: school buried the one familiar, practical piece under fog. The equation is the part you understood at fourteen, not the scary part. The hinge line ("Remember `y = 2x + 1`? That's a pure function — you've understood FP since middle school") has to land in a paragraph, or the math reasserts itself as homework.
- **Arc:** recognition → reframe → six tells as symptoms → payoff (substitution / referential transparency = predictability) → teaser to #2.
- **Six tells, clustered:** describe-what-not-how (pipelines, expressions, composition) · stop hiding state (immutability) · functions are values (HOFs) · reach for a closure, not a class (closures-over-classes). These are the same six #2 fixes. Plus a **"seventh habit" doorway** — make the types tell the truth (→ #3) — mirrored by #2's "seventh move."
- **Examples:** a punchy "you've written this" snippet per tell, React-flavored where it fits; `f(x)=x²+1` only at the reframe beat.

## 2 · Six Functional Patterns to Stop Writing Java in JavaScript  ✓ published
*Stage 1 · ~2,500w · the how*

- **Opening:** self-contained, one-line callback to #1.
- **Spine:** the same six as fixes, accessible tier — act on it Monday.
- **Examples:** the orders pipeline refactored imperative→functional throughout, shown in a React component where natural (immutable state updates; replacing a class component's `this` with closures/hooks). The `class`/`this` tell (fix #6, closures-over-classes) gets its own before/after.
- **Level-up close (doorway):** swap a `T | null` return for a `Result` union + exhaustive `switch`; point to #3.

## 3 · Errors Are Values: Functional Error Handling in TypeScript  ✓ published & featured
*Stage 2 · ~2,800w · failure as types*

- **Opening:** self-contained; callback to #2's `Result` doorway.
- **Spine:** railway first — hand-rolled `Result` and composition (`map`/`flatMap`/`mapError`), success/failure tracks, short-circuiting, exhaustive handling at the edge.
- **Second act:** zoom out — `Result` is one case of *make illegal states unrepresentable*; model a domain as a discriminated union.
- **Reveal:** show the shared shape across `Result`/`Option`/`Promise`, then name it — monad — as the reward. Own the `Promise` asterisk first ("the imperfect cousin").
- **Examples:** the orders pipeline, every step now fallible, flowing through the railway.

---

## 4 · Parse, Don't Validate: Making Bad Input Impossible in TypeScript  ← to write
*Stage 2 · ~2,000w · make bad input impossible*

- **Frame:** recognition — you check `if (!user.email)` in fifteen places because the type says `email?: string` forever. Parse untrusted input *once* at the boundary into a type that can't be invalid, and the fifteen checks vanish.
- **Spine:** validate-vs-parse → the boundary discipline → precise/branded types + discriminated unions for parsed data → *then* name the tools (zod, valibot) that generate these from a schema. Teaches the discipline, not the library. This is #3's illegal-states applied at the input edge.
- **Example:** a React form's input and an API response parsed once at the boundary into a precise `Order`; downstream code never re-checks.
- **Caveat:** parse at the boundary, not in every function — don't sprinkle schemas everywhere.
- **Library note:** reference zod (the common one) and valibot (the lighter one) *after* the concept lands; never a zod walkthrough.
- **Handoff:** ← extends #3; → the boundary is where Effects (#5) live.
- **SEO note:** keep the exact phrase "Parse, Don't Validate" — it's already a searched term.
- *Alt title:* "Stop Checking the Same Thing Fifteen Times."

## 5 · Effects Are Values: Functional Core, Imperative Shell  ← to write
*Stage 3 · ~2,800w · push side effects to the edge*

- **Frame:** the "errors as values" move again, this time for side effects. Recognition: your business logic is knotted together with fetches, logs, and DOM writes, so you can't test or reason about it.
- **Spine:** **functional core / imperative shell** (accessible, library-free). Pure functions *decide* what should happen and return that as data/commands; a thin shell at the edge *performs* it. Then the heavyweight horizon: effects as composable values — the concept — with Effect-TS named afterward as where this goes industrial.
- **Example:** the React orders UI's fetches, logs, and DOM writes pushed out to the shell; the pure core returns "re-fetch these, update that status, log this" as plain values. Punchline: test the core with zero mocks.
- **Caveat (pre-empt "just use Effect"):** you get ~90% of this for free in plain TS — the principle is framework-agnostic; Effect is for when you need the industrial version.
- **Handoff:** decisions-as-data → State (#6); pure core → Property Testing (#8).
- *Alt title:* "Push the Side Effects to the Edge."

## 6 · State Is a Fold Over Events: Functional State in React and Beyond  ← to write
*Stage 3 · ~2,500w · functional state management*

- **Frame:** recognition — your state is a pile of `useState` setters poked from twenty places, and you can't tell how it reached a bad state. Model state as a pure reduction over a stream of events: `state = events.reduce(update, initial)`. Every state becomes reproducible and explainable.
- **Spine:** scattered-setState pain → reducer (`(state, event) => state`) → "state is a fold" → event-sourcing-lite (keep the events, derive state; time-travel debugging falls out). Framework-agnostic thesis; examples in React via `useReducer` (the audience). Ties straight to the HFT world — an order book is a fold over an event stream.
- **Example:** the orders UI's state (filters, selection, edits) modeled as events reduced into state, vs scattered setters.
- **Caveat:** don't reach for this for a toggle — it earns its keep when transitions get genuinely complex.
- **Library note:** name Redux / XState / event-sourcing as callouts only where each is the prime example; not a Redux or XState tutorial.
- **Handoff:** ← purity (#1/#2), decisions-as-data (#5); → pure reducers are trivially property-tested (#8).
- *Alt title:* "Stop Setting State, Start Folding It."

## 7 · Lenses: Immutable Updates Without the Spread Pyramid  ← to write
*Stage 3 · ~2,200w · composable focus into nested data*

- **Frame:** recognition — updating `state.user.preferences.notifications.email` immutably is a five-level spread pyramid that's unreadable and bug-prone. A lens is a first-class, composable "focus" into nested data that hands you immutable updates for free.
- **Spine:** the nested-spread pain → a hand-rolled lens (paired get/set) → composing lenses to reach deep → prisms/optionals for "might not exist" (ties to `Option` from #3) → *then* name a lib. The most abstract piece — ship it later.
- **Example:** a deep update into the orders UI's nested settings/config state via a hand-rolled lens vs a spread pyramid.
- **Caveat:** overkill for shallow updates, and TS optics libs carry a real inference/ergonomics tax — be honest about both.
- **Library note:** reference optics-ts / monocle-ts after the concept; not about either lib.
- **Handoff:** ← immutability (#2) + `Option` (#3).
- *Alt title:* "Stop Building Spread Pyramids."

## 8 · Don't Write Tests, Write Properties: Property-Based Testing in TypeScript  ← to write
*Stage 4 · ~2,200w · the payoff*

- **Frame:** recognition — your tests are a handful of hand-picked examples that miss the input that actually breaks prod. Because the whole cluster made your functions pure, you can assert *properties* over thousands of generated inputs and let the tool find (and shrink) the counterexample.
- **Spine:** example-testing's blind spots → properties (invariants, round-trips, oracles) → generators + shrinking → test the pure core built across the cluster (reducers, parsers, `Result` pipelines) → the payoff framing: purity is what *made* this possible. Closes the loop back to #1's substitution. fast-check named as the tool, not the subject.
- **Example:** property-test the orders reducer ("apply then undo an edit = the original") and the parser ("parse ∘ serialize = identity").
- **Caveat:** properties complement example tests, they don't replace them — and naming good properties is the actual skill.
- **Handoff:** the capstone — cashes in the purity from every prior piece.
- *Alt title:* "Your Examples Miss the Bug That Matters."

---

## Linking discipline (the retroactive cross-linking plan)

The set is never announced. Instead, links accrete as pieces ship:

- **When you publish piece N, do a pass over the earlier pieces** and insert a reference wherever N is the natural "go deeper" or "this is where that idea leads" target.
- **Backward references are free** — a new piece can always link to ones that already exist. Lead each piece with a one-line callback to its prerequisite.
- **Forward references stay light** — at most one in-context line in an older piece ("there's a cleaner way to handle this nested update — more on that later"), so they don't clutter or rot if priorities shift.
- **Keep this doc as the source of truth** for what links where.

**Link map** (added when the *later* piece publishes):

- **Live links** (published posts): #1 → #2 (close) **and #1 → #3** (seventh-habit paragraph); #2 → #1 (open callback) **and #2 → #3** (doorway, last line); #3 → #2 (open callback) **and #3 → primer** (DU section). The primer is standalone (no outbound series links). **#3 → #4 stays light prose with no link** until #4 ships, then it becomes a link and #4 opens with a backward link to #3.
- **#3 (`errors-are-values`) is published & featured.** Its backward-link pass is **done**: #2 → #3 and #1 → #3 are live.
- **Primer (`discriminated-unions`) is published & featured.** Inbound: **#3 → primer is wired** (in #3's DU section); **#4 → primer** and **#6 → primer** to add when those ship. #1/#2 deliberately do **not** link it — it's reached via #3. Outbound: none; the primer body is standalone.
- **#1** ← everything (the foundational "why"); #8 explicitly closes back to #1's substitution.
- **#2** → #7 (immutability section → lenses for deep nesting); → #3 (honest-types doorway, already planned).
- **#3** → #4 (illegal-states → boundary parsing); → #5 (`Result` → effects-as-values parallel); → #8 (testing `Result` pipelines).
- **#4** → #5 (the boundary is where effects live).
- **#5** → #6 (decisions-as-data → events); → #8 (pure core → testable).
- **#6** → #8 (pure reducers → property tests).
- **#7** ← #2, #3.
- **#8** ← #1, #3, #4, #5, #6 (the payoff links back broadly).

## Supporting posts (outside the eight)

Standalone, tag-mates that *support* the arc without being numbered members of it. Same voice, same banner treatment; they exist to be the "go deeper" target the main pieces link to.

- **Discriminated Unions primer** — ✓ **published & featured**. "Booleans Lie: Modeling State with Discriminated Unions in TypeScript" (`src/data/blog/discriminated-unions.md` → `/posts/discriminated-unions`, live + featured, ~1,850w). The shared dependency under #3 (`Result`, `ShipError`, illegal-states `Order`), #4 (parsed types), and #6 (events). Standalone — own hook (the fetch-state boolean soup), `RemoteData` spine + a short checkout state-machine, no series callbacks; **purely conceptual** (no libraries named). Scope: what a DU is, the discriminant convention, narrowing, exhaustiveness with `never`/`assertNever`, the `enum`+optional-vs-DU climax ("make illegal states unrepresentable"), state machines, a nested-union out-of-scope callout, the don't-tag-everything caveat, and a runtime-erasure → boundary-parsing closing bridge. The **#3 → primer link is wired** (in #3's DU section). Primer went **live ahead of #3** (still a draft), so #3 safely links a published primer — the ordering is clean.

## Commitment note

You're writing all eight, in the order above. Ship each one standalone and searchable; never publish a "Part N of 8" header. The tag and the retroactively-added cross-links carry the cohesion, with none of the abandonment debt. Setups always precede payoffs, so the dependency order *is* the publish order.
