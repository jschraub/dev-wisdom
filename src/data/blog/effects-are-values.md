---
title: "Effects Are Values: Functional Core, Imperative Shell"
author: Jared Schraub
pubDatetime: 2026-07-10T13:00:00Z
featured: true
tags:
  - Functional JavaScript
  - TypeScript
  - JavaScript
  - Functional Programming
  - Side Effects
  - Functional Core Imperative Shell
  - Pure Functions
  - Testing
  - Effect
  - React
  - Web Development
description: "Your business rules can't be tested because they're welded to fetches, toasts, and analytics calls. Split the program in two: a pure core that decides what should happen and returns it as plain data, and a thin shell that performs it. The mock count drops to zero."
ogImage: ../../assets/images/effects-are-values-banner.png
---

![A calm luminous core at the center of a concentric ring of busy effectful machinery, with data shapes flowing in from the left and an ordered row of command tokens flowing out to the right](@/assets/images/effects-are-values-banner.png)

At the end of [the last piece](/posts/parse-dont-validate) I pointed out something about the boundary: the seams where untrusted data enters your program are the same seams where your side effects live. The fetch, the form, the storage read. Parsing was the first thing we pushed out to that edge. This piece evicts the rest.

Here's the tenant in question. It's the ship handler from our orders UI, and it's not the tidy railway version from [two pieces ago](/posts/errors-are-values). It's the one you actually have in production, the one with the toasts:

```ts
const handleShip = async (id: string) => {
  setPending(true);
  try {
    const res = await fetch(`/api/orders/${id}`);
    const order = parseOrder(await res.json());
    if (!order.ok) {
      toast("Couldn't load that order.");
      return;
    }
    if (order.value.status === "cancelled") {
      toast("Cancelled orders can't ship.");
      analytics.track("ship_blocked", { id });
      return;
    }
    await fetch(`/api/orders/${id}/ship`, { method: "POST" });
    toast(`Order ${id} is on its way.`);
    analytics.track("order_shipped", { id });
    await refetchOrders();
  } finally {
    setPending(false);
  }
};
```

Now answer a simple question: what are the rules for shipping an order? They're in there somewhere. A cancelled order can't ship. A blocked attempt gets recorded. A successful one notifies the customer, tracks the event, refreshes the list. Maybe five lines of actual business decision, and every one of them is welded to a wire: two network calls, two toasts, two analytics hits, a spinner flag, a refetch.

Now write the unit test for "cancelled orders can't ship." Go ahead. You'll need a fetch stub for the load, a `jest.mock` for the analytics module, a spy on the toast, and a component harness for `setPending`, all to verify one `if` statement. The rule under test is a single comparison. The scaffolding is forty lines that break every time a mock drifts, and drift is what mocks do. You've felt this. It's why that handler doesn't have a test.

## Two jobs welded together

Every handler like this is doing two different jobs and refusing to admit it. The first job is _deciding_: is this order shippable, what should the user hear, what should the record show. The second job is _doing_: moving bytes over the network, painting a toast, feeding the analytics SDK. Deciding is logic. Doing is traffic. The `if` is a decision. The `toast` is a deed.

"But I separate my concerns." I know. You have an `api/` folder and a `hooks/` folder and maybe a services layer, and every one of them separates effects by _kind_. Network code here. UI code there. Analytics behind its own wrapper. Meanwhile the decisions, the only part of that handler your business actually owns, stay smeared across all of it, one `if` at a time. That's the crippled half of an idea you've been using for years. The separation that pays isn't network-versus-UI. It's decide versus do.

[Two pieces ago](/posts/errors-are-values) we made this exact move on failure. A thrown exception is control flow escaping your function, so we stopped throwing and started returning: errors became values. A side effect is the same escape with better manners. Every `await fetch` in the middle of your logic is a decision half-made and instantly acted on, unrecoverable, untestable, gone. So arrest it the same way. Don't perform the effect. _Describe it._

## The decision is a value

Here's the whole trick, and it's a type:

```ts
type Command =
  | { kind: "request_shipment"; orderId: string }
  | { kind: "refetch_orders" }
  | { kind: "notify"; message: string }
  | { kind: "track"; event: string; orderId: string };
```

A `Command` is a [discriminated union](/posts/discriminated-unions) doing its third job of this series, after modeling our errors and our order states. Each variant names one thing the outside world can be asked to do and carries exactly the data that deed needs. And notice what this type does: nothing. A `Command` performs nothing, promises nothing, awaits nothing. It's as inert as a number, and that inertness is the entire point.

Now the decision function. `findOrder` and `ensureShippable` are the railway steps from [Errors Are Values](/posts/errors-are-values), unchanged, and `messageFor` is the exhaustive `ShipError` switch from the same piece, returning copy instead of toasting it:

```ts
const decideShipment = (orders: Order[], id: string): Command[] => {
  const shippable = pipe(findOrder(orders, id), flatMap(ensureShippable));

  if (!shippable.ok) {
    return [
      { kind: "notify", message: messageFor(shippable.error) },
      { kind: "track", event: "ship_blocked", orderId: id },
    ];
  }

  return [
    { kind: "request_shipment", orderId: id },
    { kind: "notify", message: `Order ${id} is on its way.` },
    { kind: "track", event: "order_shipped", orderId: id },
    { kind: "refetch_orders" },
  ];
};
```

Read what happened. Every rule from the tangled handler is here: the railway checks shippability, failure picks one set of consequences, success picks another. And the function does none of it. No fetch, no toast, no SDK. Same orders in, same list out, every time. It's the equation from [the first piece](/posts/your-functions-arent-functions), now deciding things that matter. `decideShipment` doesn't ship an order. It returns the _intention_ of shipping one, as data you can read, log, diff, or hold in a test.

This shape has a name. Gary Bernhardt coined it in a [2012 screencast](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell), and the name is the whole design: **functional core, imperative shell**. A pure core makes every decision the program will ever make. A thin imperative shell wraps it and talks to the world. The core decides. The shell obeys.

<svg viewBox="0 0 760 340" role="img" aria-labelledby="fcis-t fcis-d" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;border-radius:12px;background:#0b1d2c;display:block;margin:1.5rem 0"><title id="fcis-t">Functional core, imperative shell</title><desc id="fcis-d">A glowing pure core circle sits at the center of a larger imperative shell ring. Parsed values flow in from the left, through the shell, into the core. The core returns commands as plain data flowing out to the right, where the shell performs them. The effectful stations, fetch, DOM, clock, and analytics, sit on the shell ring itself, never inside the core.</desc><defs><pattern id="fcis-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#16324a" stroke-width="1"/></pattern><filter id="fcis-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="760" height="340" fill="url(#fcis-grid)" opacity="0.6"/><circle cx="380" cy="170" r="128" fill="none" stroke="#7a4233" stroke-width="26" opacity="0.3"/><circle cx="380" cy="170" r="128" fill="none" stroke="#e0875a" stroke-width="2"/><line x1="36" y1="170" x2="304" y2="170" stroke="#46b0e6" stroke-width="2.5" stroke-linecap="round"/><polygon points="304,164 316,170 304,176" fill="#46b0e6"/><circle cx="120" cy="170" r="4" fill="#46b0e6"/><circle cx="190" cy="170" r="4" fill="#46b0e6"/><line x1="444" y1="170" x2="700" y2="170" stroke="#5ad19a" stroke-width="2.5" stroke-linecap="round"/><polygon points="700,164 712,170 700,176" fill="#5ad19a"/><circle cx="530" cy="170" r="4" fill="#5ad19a"/><circle cx="610" cy="170" r="4" fill="#5ad19a"/><circle cx="380" cy="170" r="64" fill="#0b3a5e" stroke="#46b0e6" stroke-width="2.5" filter="url(#fcis-glow)"/><g fill="#0b1d2c" stroke="#e0875a" stroke-width="2"><circle cx="289" cy="79" r="17"/><circle cx="471" cy="79" r="17"/><circle cx="289" cy="261" r="17"/><circle cx="471" cy="261" r="17"/></g><g font-family="ui-sans-serif,system-ui,sans-serif" text-anchor="middle"><text x="380" y="164" fill="#c8d6e2" font-size="14">pure core</text><text x="380" y="184" fill="#8aa0b4" font-size="12">decides · returns data</text><text x="380" y="30" fill="#e0875a" font-size="12.5">imperative shell</text><text x="289" y="113" fill="#8aa0b4" font-size="11">fetch</text><text x="471" y="113" fill="#8aa0b4" font-size="11">DOM</text><text x="289" y="240" fill="#8aa0b4" font-size="11">clock</text><text x="471" y="240" fill="#8aa0b4" font-size="11">analytics</text><text x="144" y="150" fill="#c8d6e2" font-size="12.5">values in</text><text x="144" y="194" fill="#8aa0b4" font-size="11.5">parsed at the boundary</text><text x="578" y="150" fill="#c8d6e2" font-size="12.5">commands out</text><text x="578" y="194" fill="#8aa0b4" font-size="11" font-family="ui-monospace,monospace">{ kind: "request_shipment" }</text><text x="380" y="326" fill="#8aa0b4" font-size="12" font-style="italic">the core never touches the world · the shell never makes a decision</text></g></svg>

## You already ship this pattern

If commands-as-data still feels exotic, look at what your components return. JSX is not DOM manipulation. It's a _description_ of the DOM you want, a value, and React's reconciler is the imperative shell that goes and makes it true. You've been handing decisions-as-data to an imperative shell every working day of your React career. The framework even confessed where the leftovers live: the escape hatch for everything that isn't a value is named `useEffect`. This piece is asking you to do for your business logic exactly what React already did for your markup.

## A shell too simple to be wrong

Someone still has to do the deeds. That's the shell, and this is all of it:

```ts
const run = async (command: Command): Promise<void> => {
  switch (command.kind) {
    case "request_shipment":
      await fetch(`/api/orders/${command.orderId}/ship`, { method: "POST" });
      return;
    case "refetch_orders":
      await refetchOrders();
      return;
    case "notify":
      toast(command.message);
      return;
    case "track":
      analytics.track(command.event, { orderId: command.orderId });
      return;
    default:
      return assertNever(command);
  }
};
```

Look at what `run` doesn't contain: a single opinion about orders. It can't block a cancelled shipment, can't skip the analytics on the failure path, can't announce the wrong outcome, because it makes no choices. One case per kind of deed, with `assertNever` (the exhaustiveness lock from [the errors piece](/posts/errors-are-values)) holding the door: add a new command variant and every shell that hasn't learned it stops compiling. All the code that can be wrong in interesting ways now lives in the core. The shell can only be wrong in boring ways, a wrong URL, a misspelled event name, the kind of wrong you catch the first time you click the button.

The handler collapses into choreography:

```ts
const handleShip = async (id: string) => {
  const commands = decideShipment(orders, id);
  for (const command of commands) await run(command);
};
```

Gather, decide, perform. The shell gathers inputs at the boundary, where the fetch-and-parse discipline from [last piece](/posts/parse-dont-validate) already keeps `orders` honest. It hands those values to the core, and it works through the to-do list the core hands back. That loop is the shape of the whole program now. Everything interesting happens in the middle, where nothing else does.

## The test with zero mocks

Here's what you bought:

```ts
test("cancelled orders don't ship", () => {
  const orders = [
    { ...base, id: "o-42", status: "cancelled", reason: "customer request" },
  ];

  expect(decideShipment(orders, "o-42")).toEqual([
    { kind: "notify", message: "Cancelled orders can't ship." },
    { kind: "track", event: "ship_blocked", orderId: "o-42" },
  ]);
});
```

Count the mocks. Zero. No `jest.mock`, no fetch stub, no toast spy, no renderer, no `async`. Data goes in, data comes out, `toEqual` does the rest. You're not verifying that a toast fired. You're verifying that the _decision_ to toast was made, which is the thing every spy assertion you've ever written was trying to prove from the outside. The effects themselves still deserve a few integration tests at the shell, but a shell with no branches needs very few. And when this test fails, business logic changed. Nothing else is capable of breaking it.

Every hard thing about testing that original handler was an effect. Purity didn't make these tests easier to write. It deleted the part that was hard.

## Where the ceremony isn't worth it

Honesty, before you command-ify your whole app. A click handler that flips a modal open does not need a command union. `setOpen(true)` is a fine effect to just perform: the decision is trivial, the deed is local, and a `Command` wrapper would be ceremony with no payoff. This is the same test the series keeps applying: `Result` stays at the seams, brands go where invalid states exist, and the core/shell split earns its keep where decisions are genuinely worth testing on their own, rules that branch, fan out into several effects, or change with the business.

The hand-rolled version has a real ceiling too. It handles decide-then-perform in one clean round, but when effect three depends on the result of effect two, which needs a fresh decision first, your command list wants to become a conversation. You'll feel the pull to build a little interpreter, with sequencing and retries and error channels. Don't. That machine already exists.

## The machine that already exists

[Effect](https://effect.website/) is where this pattern goes industrial. In Effect, every step (the fetch, the decision, the log) is a lazy value describing work, with its error type and its dependencies carried in the signature, composed with the same `pipe`-and-`flatMap` moves you learned on `Result`. Nothing runs until the edge of the program says run. It's "errors are values" and "effects are values" revealed as the same sentence. Elm made this the entire language a decade ago: every update returns new state plus commands, and the runtime is the shell. React borrowed Elm's rendering half. Effect industrializes the rest.

You don't need either to start. The principle costs nothing, installs nothing, and works this afternoon. Reach for the machinery when the hand-rolled version starts to chafe, the same rule as always.

## Decisions go out, events come in

Take one more look at `decideShipment`, because its signature is hiding the next piece. Its output is data: commands describing what should happen next. Its input is data too: the current `orders`. But where did that array's shape come from? A history of things that happened. Placed. Paid. Shipped. Cancelled. Every order in that list is the sum of its events, and right now that history is trapped in whatever your setters last did to your state. If the decisions leaving the core deserve to be values, so does the history entering it. The moment you write that down, state stops being a thing you mutate and becomes a thing you _compute_: a fold over everything that has happened. That's the next piece: **State Is a Fold Over Events**. (And the pure core you just built, with its data-in, data-out tests? It's the raw material a later piece will feed to property-based testing.)

You walked in with business rules you couldn't test without impersonating half the internet. Now a pure core makes every decision and returns its intentions as plain data, a shell with no opinions carries them out, and the logic your business actually owns fits in functions a unit test can hold in one hand. Your side effects aren't things that happen to your logic anymore. They're part of what your functions _return_.
