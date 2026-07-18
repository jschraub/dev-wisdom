---
title: "State Is a Fold Over Events: Functional State in React and Beyond"
author: Jared Schraub
pubDatetime: 2026-07-17T13:00:00Z
featured: true
tags:
  - Functional JavaScript
  - TypeScript
  - JavaScript
  - Functional Programming
  - State Management
  - React
  - useReducer
  - Event Sourcing
  - Redux
  - Web Development
description: "Your state is the residue of setter calls nobody recorded, which is why the bug won't reproduce. Name what happened as events, let one pure function fold them into state, and every screen your app has ever shown is one replay away."
ogImage: ../../assets/images/state-is-a-fold-over-events-banner.png
---

![A stream of small glowing tokens flowing along a horizontal timeline into a single growing crystalline accumulator, with a luminous vertical playhead partway along the stream marking a moment that can be rebuilt](@/assets/images/state-is-a-fold-over-events-banner.png)

There's a bug on the orders screen this morning. The filter says shipped, the details panel is showing a cancelled order, and the Save button is lit with nothing to save. You've been clicking for twenty minutes and you can't make it happen twice. The state is right there in the devtools (`statusFilter: "shipped"`, `selectedId: "o-118"`, `dirty: true`) and it's useless, because state tells you where the program ended up and nothing about how it got there. A state snapshot is a crime scene photo: the body's final position, none of the events.

[Last piece](/posts/effects-are-values) I argued that the decisions leaving your logic should be values: commands, plain data a shell performs. This piece aims the same argument the opposite direction. The history entering your logic deserves to be a value too. And once you write history down, state stops being something you set and becomes something you compute.

## Written by setters, witnessed by no one

Here's where the morning's bug lives. It's the state of the orders view, and it looks like every React component you've ever inherited:

```tsx
const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
const [selectedId, setSelectedId] = useState<string | null>(null);
const [drafts, setDrafts] = useState<Record<string, Draft>>({});
const [dirty, setDirty] = useState(false);
```

Four slices of state, four setters, and a handler layer that pokes them in combinations:

```tsx
const changeFilter = (status: Status | "all") => {
  setStatusFilter(status);
  setSelectedId(null); // added after bug #412
};

const selectOrder = (id: string) => {
  setSelectedId(id);
  setDirty(false); // ...right?
};

const editNote = (id: string, note: string) => {
  setDrafts(d => ({ ...d, [id]: { ...d[id], note } }));
  setDirty(true);
};
```

Read the comments, because they're the fossil record. `changeFilter` clears the selection because bug #412 taught someone that filtering can hide the selected order. `selectOrder` resets `dirty`, and nobody remembers whether that's a rule or an accident. The rules about how these four slices move *together* live nowhere. Or rather, they live in whichever handler last remembered them, one bug fix at a time, and the next handler is free to forget.

So the devtools show you the residue of every setter call so far, applied in an order nobody wrote down. That's why the bug won't reproduce: reproducing it means guessing the sequence, and the sequence is gone. [The errors piece](/posts/errors-are-values) was about types that permit values which can't be true. This is the same disease in the time dimension. Handlers that permit histories which should never happen.

## Record what happened, not what to change

The move is the one this series keeps making, pointed at a new target. Stop poking the state. Start recording facts:

```ts
type ViewEvent =
  | { kind: "filter_changed"; status: Status | "all" }
  | { kind: "order_selected"; id: string }
  | { kind: "note_edited"; id: string; note: string }
  | { kind: "drafts_saved" };
```

A [discriminated union](/posts/discriminated-unions), taking its fourth job of this series after errors, order states, and commands. And read the tense, because the tense *is* the design. Last piece's `Command` was future tense: `request_shipment`, a wish on its way out to the shell, which might refuse it. An event is past tense: `note_edited`, a fact on its way in. Wishes can fail. Facts have already happened; all they ask is to be written down.

React is going to call these "actions" the moment we touch `useReducer`, and Redux made that the industry's word. The trouble with "action" is that it's agnostic about tense. Half the reducers in production are full of commands wearing action suits, `SET_FILTER`, `FETCH_ORDERS`, and a reducer fed commands drifts into being a place where things get *done*. Name them as events, past tense, and half your design questions answer themselves: a fact carries exactly what happened, a fact can't fetch anything, and recording a fact is never the wrong move, even when acting on it would be.

## One function owns every transition

Facts need a judge: one pure function that rules on what each event means for the state.

```ts
type Draft = { note?: string; quantity?: number };

type ViewState = {
  statusFilter: Status | "all";
  selectedId: string | null;
  drafts: Record<string, Draft>;
};

const update = (state: ViewState, event: ViewEvent): ViewState => {
  switch (event.kind) {
    case "filter_changed":
      return { ...state, statusFilter: event.status, selectedId: null };
    case "order_selected":
      return { ...state, selectedId: event.id };
    case "note_edited":
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [event.id]: { ...state.drafts[event.id], note: event.note },
        },
      };
    case "drafts_saved":
      return { ...state, drafts: {} };
    default:
      return assertNever(event);
  }
};
```

The bug-#412 rule, filter changes clear the selection, is now one line that holds no matter which handler would have forgotten it. `assertNever` is the exhaustiveness lock from [the errors piece](/posts/errors-are-values): add a `ViewEvent` variant and every judge that hasn't ruled on it stops compiling. And `dirty` has left the state entirely, because it was never state. It was an opinion about state:

```ts
const dirty = Object.keys(state.drafts).length > 0;
```

State that could lie, deleted instead of synchronized. The save that `drafts_saved` reports is an effect, and it stays [in the shell](/posts/effects-are-values): the shell performs the POST, then dispatches the fact it made true. (And yes, that `note_edited` case is a three-level spread to change one string. It works, and it offends me. There's a cleaner way to reach that deep; it gets a piece of its own later.)

Now the line that pays for all of it. `update` takes a state and an event and returns a state, which is exactly the shape `reduce` eats:

```ts
const state = events.reduce(update, initialState);
```

Same events in, same state out, every time. It's the [equation](/posts/your-functions-arent-functions) this series opened on, now running your screen. And it changes what a bug report *is*. This morning's mystery arrived as a screenshot and an apology. Here it is as data:

```ts
const report: ViewEvent[] = [
  { kind: "order_selected", id: "o-118" },
  { kind: "note_edited", id: "o-118", note: "leave at the door" },
  { kind: "filter_changed", status: "shipped" },
];
```

Fold it and look: the filter change cleared the selection, because the rule lives in the judge now. Producing this morning's corpse takes a sequence of pokes the judge will never allow. The bug isn't fixed. It's unexpressible.

React has shipped a home for this fold since 16.8:

```tsx
const [state, dispatch] = useReducer(update, initialState);
```

`dispatch` changes nothing. It files a report; React runs it through your judge and keeps the running total. You've stopped setting state. You narrate what happened, and one function decides what it means.

## You've been folding the whole time

You have used this shape a hundred times. In [Six Functional Patterns](/posts/six-functional-patterns), `sumTotals` collapsed an array of orders into a number: a starting value, a combining function, a sequence. Functional programming's name for that shape is a **fold**, and you've been folding for years without the word: totals, groupings, maxes. You've also been using half of it. Every fold you've written pointed at *space*, at an array already sitting in memory. `useReducer` is the identical fold pointed at *time*. Events are a sequence like any other; they just arrive one click apart instead of one index apart.

> State is a fold over everything that has happened.

`selectedId` isn't a thing you have. It's the running total of every selection and every filter change so far. The devtools were never showing you state. They were showing you a subtotal.

<svg viewBox="0 0 760 330" role="img" aria-labelledby="fold1-t fold1-d" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;border-radius:12px;background:#0b1d2c;display:block;margin:1.5rem 0"><title id="fold1-t">State is a fold over events</title><desc id="fold1-d">Three event pills sit on a left-to-right timeline: order selected, note edited, filter changed. Each event feeds the update arrow between state boxes below, producing state one, state two, and state three from the initial state. A dashed bracket under the initial state through state two shows that refolding a prefix of the log reproduces the screen as it was at that moment.</desc><defs><pattern id="fold1-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#16324a" stroke-width="1"/></pattern></defs><rect width="760" height="330" fill="url(#fold1-grid)" opacity="0.6"/><line x1="48" y1="64" x2="698" y2="64" stroke="#1f6f9f" stroke-width="1.5"/><polygon points="698,58 710,64 698,70" fill="#1f6f9f"/><text x="710" y="48" text-anchor="end" fill="#8aa0b4" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11">time</text><g font-family="ui-monospace,monospace" font-size="11.5" text-anchor="middle"><rect x="130" y="46" width="150" height="36" rx="12" fill="#0b3a5e" stroke="#46b0e6" stroke-width="1.5"/><text x="205" y="68" fill="#c8d6e2">order_selected</text><rect x="320" y="46" width="150" height="36" rx="12" fill="#0b3a5e" stroke="#46b0e6" stroke-width="1.5"/><text x="395" y="68" fill="#c8d6e2">note_edited</text><rect x="510" y="46" width="150" height="36" rx="12" fill="#0b3a5e" stroke="#46b0e6" stroke-width="1.5"/><text x="585" y="68" fill="#c8d6e2">filter_changed</text></g><g stroke="#46b0e6" stroke-width="1.5"><line x1="205" y1="82" x2="205" y2="198"/><line x1="395" y1="82" x2="395" y2="198"/><line x1="585" y1="82" x2="585" y2="198"/></g><g fill="#46b0e6"><polygon points="199,198 205,208 211,198"/><polygon points="389,198 395,208 401,198"/><polygon points="579,198 585,208 591,198"/></g><g fill="none" stroke-width="1.5"><rect x="58" y="190" width="104" height="44" rx="8" stroke="#8aa0b4"/><rect x="248" y="190" width="104" height="44" rx="8" stroke="#5ad19a"/><rect x="438" y="190" width="104" height="44" rx="8" stroke="#5ad19a"/><rect x="628" y="190" width="104" height="44" rx="8" stroke="#5ad19a"/></g><g stroke="#5ad19a" stroke-width="2"><line x1="162" y1="212" x2="240" y2="212"/><line x1="352" y1="212" x2="430" y2="212"/><line x1="542" y1="212" x2="620" y2="212"/></g><g fill="#5ad19a"><polygon points="240,206 248,212 240,218"/><polygon points="430,206 438,212 430,218"/><polygon points="620,206 628,212 620,218"/></g><g font-family="ui-sans-serif,system-ui,sans-serif" text-anchor="middle"><text x="110" y="217" fill="#8aa0b4" font-size="12.5">initial</text><text x="300" y="217" fill="#c8d6e2" font-size="12.5">state₁</text><text x="490" y="217" fill="#c8d6e2" font-size="12.5">state₂</text><text x="680" y="217" fill="#c8d6e2" font-size="12.5">state₃</text><text x="205" y="230" fill="#8aa0b4" font-size="10.5">update</text><text x="395" y="230" fill="#8aa0b4" font-size="10.5">update</text><text x="585" y="230" fill="#8aa0b4" font-size="10.5">update</text></g><path d="M58 256 v8 h484 v-8" fill="none" stroke="#8aa0b4" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.8"/><g font-family="ui-sans-serif,system-ui,sans-serif" text-anchor="middle"><text x="300" y="284" fill="#8aa0b4" font-size="11.5" font-style="italic">refold the first two facts and you're looking at state₂</text><text x="380" y="316" fill="#8aa0b4" font-size="12" font-style="italic">dispatch appends a fact · the state is the running total</text></g></svg>

## Keep the events, derive the screen

`useReducer` runs the fold and throws away the tape: it keeps the running total and discards the events. A sensible default. Also a choice, and nothing forces it:

```tsx
const [events, setEvents] = useState<ViewEvent[]>([]);
const dispatch = (event: ViewEvent) => setEvents(prev => [...prev, event]);

const state = useMemo(() => events.reduce(update, initialState), [events]);
```

Keep the tape and features start falling out of the fold. Undo is a slice:

```ts
const undo = () => setEvents(prev => prev.slice(0, -1));
```

No inverse operations, no undo stack drifting out of sync with reality. Fold a shorter history, get an earlier world. Time travel is the same trick with a cursor: fold `events.slice(0, n)` and you're looking at the exact screen from n facts ago. And the unreproducible bug dies for good, because the report can now attach the log. A bug report with an event log is a reproduction, not an anecdote.

You've seen this productionized. Redux DevTools' time-travel debugger, the scrubber demo that sold half the industry on a state library, is this fold with a UI on it: record the events, refold a prefix. No magic was ever involved.

The tape has a price, so pay it only where it pays back. Logs grow without bound, refolding is work (that `useMemo` is doing real lifting), and the fold-and-discard `useReducer` is the right default for most screens. Keep the log where replay is a *feature*: undo, audit, the bug that only appears on the third Tuesday.

## Your orders were already folds

Now look underneath the view state, because [last piece](/posts/effects-are-values) closed on a promise about the data itself: every order in your list is the sum of its events. The `Order` union [from the errors piece](/posts/errors-are-values) says a shipped order has a tracking number and a cancelled one has a reason. It names the stops. It says nothing about the journey, and nothing is born shipped:

```ts
type OrderEvent =
  | { kind: "placed"; id: string; customer: string; total: number; at: string }
  | { kind: "shipped"; trackingNumber: string; at: string }
  | { kind: "delivered"; at: string }
  | { kind: "cancelled"; reason: string; at: string };

const apply = (order: Order, event: OrderEvent): Order => {
  if (order.status === "cancelled") return order; // tombstones don't read their mail
  switch (event.kind) {
    case "shipped":
      return { ...order, status: "shipped", trackingNumber: event.trackingNumber };
    case "cancelled":
      return { ...order, status: "cancelled", reason: event.reason };
    // "placed" seeds the fold; "delivered" mirrors "shipped"
  }
};

const [placed, ...rest] = history;
const order = rest.reduce(apply, fromPlaced(placed));
```

(`fromPlaced` copies four fields onto `status: "pending"`; ten seconds of typing.) The errors piece made illegal *states* unrepresentable: no shipped order without a tracking number, by construction. `apply` finishes the thought for illegal *histories*: a cancelled order that receives a late `shipped` event returns unchanged, every time, in one auditable place. The type ruled out the impossible noun. The fold rules on the impossible sentence.

Two details are worth stealing even if you never keep a log in production. First, `at` rides in on the event. `apply` never asks the clock, because asking the clock is an effect and [effects live in the shell](/posts/effects-are-values); the shell stamps the fact when it records it, and replays stay honest forever. Second, notice what the folded state can't tell you. `{ status: "cancelled", reason: "customer request" }` answers *what*. Only the log answers the questions that arrive at 5pm: the cancellation came ninety seconds after the second failed payment retry, from the support console, before the shipment went out. State shrugs. The log testifies.

The backend world built a whole discipline on that observation (keep the events as the source of truth, derive state as a view) and named it **event sourcing**. Be clear-eyed about the price tag: it's a commitment, not a default. Events are forever, and every event shape you ever emit becomes a document format you'll be reading until the end of time. Adopt it where the history *is* the business. Which, in at least one industry, it literally is.

## The most expensive fold in the world

An exchange's order book, the data structure real money moves through, is a fold over an event stream. Adds, cancels, fills, tens of thousands a second; the book you see quoted is the running accumulator. And when something needs explaining, and in markets something always needs explaining, nobody flips through screenshots of state. They refold: the book at 09:31:07.114 is the fold of every event up to 09:31:07.114, reconstructed on demand, bit for bit. The most reliability-obsessed systems on the planet do not store the state of the market. They store what happened and compute the market. Your orders screen can afford the same honesty.

<svg viewBox="0 0 760 320" role="img" aria-labelledby="fold2-t fold2-d" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;border-radius:12px;background:#0b1d2c;display:block;margin:1.5rem 0"><title id="fold2-t">Replay: refold the log to any moment</title><desc id="fold2-d">Order events placed, shipped, and delivered sit on a timeline. A playhead line crosses the timeline between shipped and delivered. The events before the playhead fold down into a solid card holding the current order value, status shipped with a tracking number. The delivered event after the playhead is dimmed and labeled not yet folded, with a dashed arrow into a ghosted card showing the delivered state the fold would produce next.</desc><defs><pattern id="fold2-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#16324a" stroke-width="1"/></pattern><marker id="fold2-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#5ad19a"/></marker></defs><rect width="760" height="320" fill="url(#fold2-grid)" opacity="0.6"/><line x1="48" y1="70" x2="698" y2="70" stroke="#1f6f9f" stroke-width="1.5"/><polygon points="698,64 710,70 698,76" fill="#1f6f9f"/><text x="710" y="48" text-anchor="end" fill="#8aa0b4" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11">time</text><g font-family="ui-monospace,monospace" font-size="11.5" text-anchor="middle"><rect x="95" y="52" width="110" height="36" rx="12" fill="#0b3a5e" stroke="#46b0e6" stroke-width="1.5"/><text x="150" y="74" fill="#c8d6e2">placed</text><rect x="275" y="52" width="110" height="36" rx="12" fill="#0b3a5e" stroke="#46b0e6" stroke-width="1.5"/><text x="330" y="74" fill="#c8d6e2">shipped</text><rect x="505" y="52" width="120" height="36" rx="12" fill="#0f2436" stroke="#46b0e6" stroke-opacity="0.35" stroke-width="1.5"/><text x="565" y="74" fill="#c8d6e2" fill-opacity="0.45">delivered</text></g><text x="525" y="128" text-anchor="middle" fill="#8aa0b4" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11" opacity="0.8">not yet folded</text><line x1="445" y1="34" x2="445" y2="262" stroke="#e0875a" stroke-width="2" stroke-dasharray="6 4"/><polygon points="439,30 451,30 445,42" fill="#e0875a"/><text x="453" y="40" text-anchor="start" fill="#e0875a" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11.5">refold to this moment</text><line x1="150" y1="88" x2="185" y2="186" stroke="#5ad19a" stroke-width="1.5" marker-end="url(#fold2-arr)"/><line x1="330" y1="88" x2="305" y2="186" stroke="#5ad19a" stroke-width="1.5" marker-end="url(#fold2-arr)"/><rect x="105" y="190" width="280" height="64" rx="8" fill="#0b3a5e" stroke="#5ad19a" stroke-width="1.5"/><g font-family="ui-monospace,monospace" font-size="11.5" text-anchor="start" fill="#5ad19a"><text x="125" y="216">{ status: "shipped",</text><text x="139" y="234">trackingNumber: "TRK-88112" }</text></g><g opacity="0.35"><line x1="590" y1="88" x2="600" y2="184" stroke="#5ad19a" stroke-width="1.5" stroke-dasharray="4 4" marker-end="url(#fold2-arr)"/></g><rect x="475" y="190" width="230" height="64" rx="8" fill="none" stroke="#5ad19a" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="4 4"/><text x="493" y="226" font-family="ui-monospace,monospace" font-size="11.5" text-anchor="start" fill="#5ad19a" fill-opacity="0.45">{ status: "delivered", … }</text><text x="380" y="300" text-anchor="middle" fill="#8aa0b4" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" font-style="italic">nobody stores the state · they store what happened, and compute the state</text></svg>

## The whole engine

Set this piece beside the last one. [Effects Are Values](/posts/effects-are-values) made the core's outputs data: commands a shell performs. This piece made the core's inputs data: events a fold consumes. One signature holds both:

```ts
type Update = (state: State, event: Event) => [State, Command[]];
```

Events in. State folded. Commands out. That line is the entire Elm architecture, the one React borrowed its rendering half from. It's a Redux store with its middleware, drawn in one type. And you've now hand-rolled all of it, in plain TypeScript, with nothing installed.

## Where a fold is overkill

A checkbox does not need an event log. `useState` remains the right tool for the toggle, the input draft, the hover flag: state with one writer, no rules binding it to its neighbors, and nobody asking how it got that way. Reducers earn their keep when transitions branch, when fields move together, when yesterday's sequence is today's bug report. The kept log earns its keep one notch later still: when undo, audit, or replay is a *feature*, and a growing array is a fair price for it. It's the same test this series runs on every technique: pay for structure exactly where the pain is, and nowhere else.

## Ask what happened

One more thing came out of the fold, and it's the biggest. `update` and `apply` are pure. No clock, no network, no mocks: feed events, check state, the same [zero-mock tests](/posts/effects-are-values) the core earned last piece. But a pure reducer deserves better than the three examples you'll think up over coffee. A machine can generate ten thousand event sequences you'd never imagine, fold every one, and check that the laws survive: an edit followed by its undo restores the original; no sequence of facts leaves a hidden order selected; cancelled stays cancelled no matter what arrives late. You don't write those test cases. You state the law, and a tool hunts down the counterexample and shrinks it to the three-event story that breaks you. That's a piece of its own, and it's the one this whole series has been building toward: **Don't Write Tests, Write Properties**.

Next time a screen ends up somewhere strange, ask the only two questions that ever mattered: what happened, and in what order. If you kept the events, the answer is one fold away. State was never the story. It's the running total of one. Keep the story.
