---
title: "Break Your Own Code First: Property-Based Testing in TypeScript"
author: Jared Schraub
pubDatetime: 2026-09-08T13:30:00Z
featured: true
tags:
  - Functional JavaScript
  - TypeScript
  - JavaScript
  - Functional Programming
  - Testing
  - Property-Based Testing
  - fast-check
  - Vitest
  - React
  - Web Development
description: "Your tests pass because you chose the inputs, and you chose them with the same mental model that wrote the bug. State the law instead and let a generator hunt the counterexample. Doing this to my own published reducer found a rule I had promised in print and never actually enforced."
ogImage: ../../assets/images/break-your-own-code-first-banner.png
---

![A vast field of faint scattered points funnelling down through a narrowing luminous channel to one single bright fragment held in sharp focus](@/assets/images/break-your-own-code-first-banner.png)

[The last piece](/posts/stop-building-spread-pyramids) ended on two lines that look like documentation and are not:

```ts
l.set(l.get(s), s) === s
l.get(l.set(a, s)) === a
```

Those are claims about every structure `s` and every value `a` that lens will ever see. Which raises an awkward question about the test file sitting next to them, and next to every other pure function this series has built.

Here is that test file. You have written this one before:

```ts
it("selects an order", () => {
  const state = update(initialState, {
    kind: "order_selected",
    id: "o-118",
  });
  expect(state.selectedId).toBe("o-118");
});

it("clears the selection when the filter changes", () => {
  const selected = update(initialState, {
    kind: "order_selected",
    id: "o-118",
  });
  const filtered = update(selected, {
    kind: "filter_changed",
    status: "shipped",
  });
  expect(filtered.selectedId).toBeNull();
});

it("drops all drafts on save", () => {
  const edited = update(initialState, {
    kind: "note_edited",
    id: "o-118",
    note: "hi",
  });
  expect(update(edited, { kind: "drafts_saved" }).drafts).toEqual({});
});
```

Three tests, all green, all reasonable. And every input in them was chosen by the person who wrote the reducer, using the same mental model that wrote the reducer. That is the problem in one sentence.

## You picked the inputs that pass

Example tests do not sample your input space. They sample your imagination, and your imagination has the same blind spots as your code, because it is the thing that produced it. The sequence that breaks you in production is not a sequence you failed to write a test for. It is a sequence you could not think of, which is exactly why it broke you.

Look at what those three tests happen to have in common. Each one runs one or two events. Real users produce forty in a session, in combinations nobody planned. The bug in [the state piece](/posts/state-is-a-fold-over-events) that started all of this arrived as a screenshot precisely because the sequence that caused it was one nobody would have written down.

So stop writing down sequences. Write down what has to be true about all of them.

## State the law, not the case

The easiest law to see is a round trip, and the [boundary parser](/posts/parse-dont-validate) has one sitting right there. That parser turns untrusted JSON into an `Order`. Serializing goes the other way. Do both and you should be exactly where you started, for every order that exists.

That is one test, quantified over all of them:

```ts
import fc from "fast-check";

it("parses back everything it serializes", () => {
  fc.assert(
    fc.property(arbOrder, order => {
      const parsed = parseOrder(JSON.parse(serializeOrder(order)));
      expect(parsed).toEqual({ ok: true, value: order });
    })
  );
});
```

`arbOrder` is an **arbitrary**: a description of how to build a random `Order`. You write it once, out of the shape of your own union:

```ts
const base = fc.record({
  id: fc.string({ minLength: 1, maxLength: 6 }),
  customer: fc.string({ maxLength: 12 }),
  total: fc.integer({ min: 0, max: 500_000 }).map(cents => cents / 100),
  placedAt: iso,
});

const arbOrder: fc.Arbitrary<Order> = fc.oneof(
  base.map(b => ({ ...b, status: "pending" as const })),
  fc.tuple(base, tracking).map(([b, t]) => ({
    ...b,
    status: "shipped" as const,
    trackingNumber: t,
  })),
  // delivered, cancelled…
);
```

`fc.assert` runs that property a hundred times by default, and as many times as you ask for, with a different order each time. That includes the ones you would never type: the empty customer name, the total of zero, the tracking number that is a single backslash. Passing means something categorically different from what your three examples meant.

Notice the money. `fc.integer(...).map(cents => cents / 100)` is not decoration. Left as a raw double, this property fails on `-0`, because `JSON.stringify(-0)` is `"0"` and the round trip does not survive it. That is a true fact about your serializer and a useless one about your business, since orders are not priced in negative zero. Constraining the generator to the values your domain can actually hold is most of the skill, and you learn it by getting a counterexample you have to think about for a minute before deciding it does not count.

## Check the new code against the old code

The second kind of law is an **oracle**: something you already trust that should agree with the thing you just wrote.

This series opened by asking you to replace hand-built loops with pipelines. [The first patterns piece](/posts/six-functional-patterns) did exactly that to the orders total, turning an index-walking loop into `sumTotals(activeOrders(orders))`. Every reader who tried it had the same thought, and it is the correct thought: *how do I know the new one does the same thing?*

Keep the loop. Make it the test.

```ts
it("agrees with the loop it replaced", () => {
  fc.assert(
    fc.property(arbOrders, orders => {
      const viaPipeline = sumTotals(activeOrders(orders));
      expect(viaPipeline).toBeCloseTo(totalsTheOldWay(orders), 10);
    })
  );
});
```

That is a refactor with a safety net rather than a leap of faith. Run it green over a few hundred generated order lists, delete the loop, and the deletion is evidence-backed. It is the single most useful thing in this piece for anyone with a legacy codebase, and it works far outside functional code. Any rewrite where the old implementation still exists can be checked against it this way, once, and then thrown away.

## The law I promised and never enforced

The third kind is an **invariant**: something that must be true after every operation, no matter what came before.

At the end of the state piece I listed [the laws a generated event log could check](/posts/state-is-a-fold-over-events) against that reducer. One of them was that no sequence of facts should leave a hidden order selected. That rule arrived as a bug report, and the reducer supposedly absorbed it when `filter_changed` started clearing the selection.

To state it at all, something has to know what is on screen, so `ViewState` carries the orders and a small function derives the visible ones:

```ts
const visible = (state: ViewState): Order[] =>
  state.statusFilter === "all"
    ? state.orders
    : state.orders.filter(o => o.status === state.statusFilter);
```

And the law, over any sequence of events at all:

```ts
it("never leaves a hidden order selected", () => {
  fc.assert(
    fc.property(arbEvents(sampleOrders.map(o => o.id)), log => {
      const state = log.reduce(update, startFrom(sampleOrders));
      if (state.selectedId === null) return;
      const shown = visible(state).some(o => o.id === state.selectedId);
      expect(shown).toBe(true);
    })
  );
});
```

I expected this to pass. I wrote the reducer, I published the reducer, and I told you in print that this rule held. Here is what actually happened:

```text
Error: Property failed after 9 tests
{ seed: -1760290322, path: "8:1:4:4:4", endOnFailure: true }
Counterexample: [[
  {"kind":"filter_changed","status":"delivered"},
  {"kind":"order_selected","id":"o-117"}
]]
Shrunk 4 time(s)
```

Two events. Filter the board to delivered orders, then select `o-117`, which is pending. `update` handles `order_selected` by writing the id down, unconditionally, because I reasoned about it the way you reason about a UI: you can only click an order you can see. The reducer never knew that. It just believed whatever it was told, and it took nine random sequences to find out.

The rule I fixed in the state piece was that *changing the filter* must not strand a selection. The rule I never wrote was that *making a selection* must respect the filter. One direction, tested. The other, assumed. My three example tests covered the direction I had thought about, which is the only direction I was ever going to think about.

## The tool hands you the smallest story

That two-event counterexample is what the tool handed back. It is not what the tool found. What it found was this:

```text
- [{"kind":"filter_changed","status":"shipped"},
   {"kind":"drafts_saved"},
   {"kind":"order_selected","id":"o-117"},
   {"kind":"filter_changed","status":"pending"},
   {"kind":"filter_changed","status":"delivered"},
   {"kind":"order_selected","id":"o-119"},
   {"kind":"order_selected","id":"o-120"},
   {"kind":"drafts_saved"}]
- [{"kind":"filter_changed","status":"delivered"},
   {"kind":"order_selected","id":"o-119"},
   {"kind":"order_selected","id":"o-120"},
   {"kind":"drafts_saved"}]
- [{"kind":"filter_changed","status":"delivered"},
   {"kind":"order_selected","id":"o-120"},
   {"kind":"drafts_saved"}]
- [{"kind":"filter_changed","status":"delivered"},
   {"kind":"order_selected","id":"o-117"},
   {"kind":"drafts_saved"}]
- [{"kind":"filter_changed","status":"delivered"},
   {"kind":"order_selected","id":"o-117"}]
```

Eight events, then four, then three, then three again with a different order selected, then two. Every line still fails. That is **shrinking**, and it is the feature that makes the difference between a tool you use and a tool you abandon. A random eight-event failure is a puzzle. A two-event failure is a sentence: filter to delivered, select a pending order. You can read the bug directly off the output.

<svg viewBox="0 0 760 340" role="img" aria-labelledby="shrink-t shrink-d" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;border-radius:12px;background:#0b1d2c;display:block;margin:1.5rem 0"><title id="shrink-t">Shrinking walks a random failure down to the smallest one</title><desc id="shrink-d">A wide field represents every event sequence a user could produce, with small dots scattered across it and a shaded band marking the sequences that fail. A random hit lands deep in the band at eight events. Arrows step left through failures at four, then three, then two events, each still inside the failing band, ending at a bright marker labelled the smallest sequence that still fails. The horizontal axis is labelled events in the sequence, increasing to the right.</desc><defs><pattern id="shrink-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#16324a" stroke-width="1"/></pattern></defs><rect width="760" height="340" fill="url(#shrink-grid)" opacity="0.6"/><rect x="60" y="40" width="640" height="220" rx="10" fill="none" stroke="#1f6f9f" stroke-width="1.3"/><text x="72" y="62" fill="#8aa0b4" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11.5">every sequence your users can produce</text><path d="M92 96 C 200 84, 330 120, 430 108 C 540 96, 620 130, 690 118 L 690 214 C 610 226, 520 196, 420 208 C 320 220, 190 190, 92 202 Z" fill="#e0875a" fill-opacity="0.13" stroke="#e0875a" stroke-opacity="0.5" stroke-width="1.2"/><text x="660" y="152" text-anchor="end" fill="#e0875a" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11.5" font-style="italic">sequences that fail</text><g fill="#8aa0b4" fill-opacity="0.5"><circle cx="130" cy="74" r="2.5"/><circle cx="228" cy="86" r="2.5"/><circle cx="332" cy="70" r="2.5"/><circle cx="452" cy="82" r="2.5"/><circle cx="560" cy="72" r="2.5"/><circle cx="648" cy="88" r="2.5"/><circle cx="150" cy="238" r="2.5"/><circle cx="268" cy="246" r="2.5"/><circle cx="392" cy="236" r="2.5"/><circle cx="512" cy="248" r="2.5"/><circle cx="626" cy="238" r="2.5"/><circle cx="200" cy="160" r="2.5"/><circle cx="356" cy="176" r="2.5"/></g><circle cx="612" cy="158" r="7" fill="#e0875a"/><text x="612" y="136" text-anchor="middle" fill="#e0875a" font-family="ui-monospace,monospace" font-size="11">8 events</text><circle cx="470" cy="164" r="5.5" fill="#e0875a" fill-opacity="0.75"/><text x="470" y="142" text-anchor="middle" fill="#8aa0b4" font-family="ui-monospace,monospace" font-size="10.5">4</text><circle cx="360" cy="158" r="5.5" fill="#e0875a" fill-opacity="0.75"/><text x="360" y="136" text-anchor="middle" fill="#8aa0b4" font-family="ui-monospace,monospace" font-size="10.5">3</text><circle cx="232" cy="162" r="8" fill="#5ad19a"/><text x="232" y="136" text-anchor="middle" fill="#5ad19a" font-family="ui-monospace,monospace" font-size="11">2 events</text><g stroke="#46b0e6" stroke-width="1.6" fill="none"><path d="M604 160 L 480 163"/><path d="M462 163 L 370 159"/><path d="M351 159 L 243 161"/></g><g fill="#46b0e6"><polygon points="486,158 476,163 486,168"/><polygon points="376,154 366,159 376,164"/><polygon points="249,156 239,161 249,166"/></g><text x="232" y="196" text-anchor="middle" fill="#5ad19a" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11">the smallest sequence</text><text x="232" y="211" text-anchor="middle" fill="#5ad19a" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11">that still fails</text><line x1="60" y1="286" x2="700" y2="286" stroke="#1f6f9f" stroke-width="1.5"/><polygon points="700,280 712,286 700,292" fill="#1f6f9f"/><text x="380" y="308" text-anchor="middle" fill="#8aa0b4" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11.5">events in the sequence</text><text x="380" y="330" text-anchor="middle" fill="#8aa0b4" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" font-style="italic">it finds a failure at random, then walks it down to the one you can read</text></svg>

The fix is small, and the property tells you the moment you have it right:

```ts
case "order_selected": {
  const isVisible = visible(state).some(o => o.id === event.id);
  return isVisible ? { ...state, selectedId: event.id } : state;
}
```

There is a second fix, and it is the move the state piece already made when it [deleted `dirty`](/posts/state-is-a-fold-over-events). A selection that can go stale is a sign that the selected *id* is state and the selected *order* never was. Derive the order at the edge instead, and a selection that is not visible resolves to nothing on its own. Both fixes are defensible. The property does not care which you pick. It cares that you picked.

## The law that makes replay honest

One more law, and this one is holding up a feature. The state piece claimed you could [rebuild any past screen by refolding a prefix of the log](/posts/state-is-a-fold-over-events). That claim is an algebraic property, and it is checkable:

```ts
it("folding a whole log equals folding a prefix then continuing", () => {
  fc.assert(
    fc.property(events, fc.nat(), (log, cut) => {
      const at = cut % (log.length + 1);
      const whole = log.reduce(update, initial);
      const upToCut = log.slice(0, at).reduce(update, initial);
      const inTwo = log.slice(at).reduce(update, upToCut);
      expect(inTwo).toEqual(whole);
    })
  );
});
```

Split the log anywhere, fold the two parts in sequence, land in the same place. That is time-travel debugging and undo, stated as an equation and checked against every split point of a few hundred generated logs. It passes, and now it passes on purpose rather than by reputation.

## Properties do not replace your examples

Two honest limits.

The first: keep the example tests. A property says "for all inputs, this holds." An example says "this specific case, which a customer hit and which cost us a Thursday, does this specific thing." That second kind is documentation and a regression test with a story attached. The three tests at the top of this piece are still worth having. They are just not worth *trusting* the way you were trusting them.

The second, and larger: naming the property is the whole skill, and it is harder than writing the test. Anyone can run a generator. Deciding that "the selected order is always visible" is a law your system must obey is design work, done in the same part of your brain that decided the reducer should exist. When you cannot think of a property, that is information, and usually it means the function does too many things to have a single law worth stating.

The obvious trap is the tautology. Assert that your reducer does what your reducer does, by reimplementing it inside the test, and you have written an expensive way of running the same code twice. Good properties come from somewhere the implementation is not: a round trip, an old implementation, a business rule, an algebraic identity.

## Now try it on sequences of events

Everything above generates one input: an order, a list of orders, a log. The next rung generates *operations* rather than values. You hand the tool a set of moves your system allows, it produces random sequences of them, and it checks your invariant after every single step rather than only at the end. That is **model-based** or stateful property testing, and if you have a reducer, you already have exactly the shape it wants: a set of events, a transition function, and laws that should hold at every point in the fold. It is the same idea as this whole piece, applied to time.

## What purity was buying you the whole time

None of this works on the code you had before.

You cannot generate ten thousand inputs for a function that reaches for the network. You cannot re-run a handler a thousand times when each run fires analytics and paints a toast. You cannot compare two implementations that both mutate the world. Every property in this piece is possible for exactly one reason: the functions under test are [pure](/posts/effects-are-values), so calling them is free, repeatable, and the same every time.

That is [the equation](/posts/your-functions-arent-functions) this all started with, cashing in. Same inputs, same outputs, no trace left behind. It was a nice property to reason about. It turns out to be the precondition for handing your code to a machine that will try ten thousand times to break it.

So go find something you wrote that has a rule you have only ever asserted in a comment. Write the rule down as code. Then let something less imaginative than you go looking for the sequence you would never have typed. You will find out today what you were going to find out on a Thursday.

I did, and the bug was in the piece I had already published.
