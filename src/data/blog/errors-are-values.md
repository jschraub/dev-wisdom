---
title: "Errors Are Values: Functional Error Handling in TypeScript"
author: Jared Schraub
pubDatetime: 2026-06-26T13:00:00Z
featured: true
tags:
  - Functional JavaScript
  - TypeScript
  - JavaScript
  - Functional Programming
  - Error Handling
  - Result Type
  - Option Type
  - Discriminated Unions
  - Monads
  - Railway Oriented Programming
  - Type Safety
  - Web Development
description: "Stop throwing, start returning. Model failure as a value with Result, compose fallible steps on a railway, make illegal states unrepresentable, and let TypeScript force you to handle every error — no try/catch required."
ogImage: ../../assets/images/errors-are-values-banner.png
---

![Two parallel rails — a success track and a failure track — with orders flowing left to right and one diverging at a switch onto the lower track](@/assets/images/errors-are-values-banner.png)

At the end of [the last piece](/posts/six-functional-patterns) I changed a function's return type from `Order | null` to `Result<Order, "not_found">`, called it a doorway, and walked off. This is what's on the other side.

Here's the pain it opens onto. You've written this handler — find an order, make sure it can ship, ship it:

```ts
const handleShip = (orders: Order[], id: string) => {
  const order = orders.find(o => o.id === id);
  if (!order) return toast("That order doesn't exist.");
  if (order.status === "cancelled") return toast("Cancelled orders can't ship.");
  if (order.status !== "pending") return toast("That order's already on its way.");

  try {
    const shipped = ship(order); // throws if there's no inventory
    commit(shipped);
  } catch {
    toast("Couldn't ship — try again.");
  }
};
```

Look at how many different ways this thing fails. A `null` from `.find`. A sentinel comparison against a string. A thrown exception caught by a `try/catch` that's quietly doing the job of an `if`. Three failure modes, three mechanisms, and here's the part that should bother you: **not one of them shows up in a type.** `ship` is declared to return a `ShippedOrder`. The signature is a flat statement that it succeeds. The throw is a trapdoor in the floor that the type never mentions, and the only way to know it's there is to have read the body — or to have fallen through it in production.

That's the deeper problem with both of JavaScript's built-in failure tools. A thrown exception is a `goto`: it teleports control out of your function to some `catch` you hope exists somewhere up the stack, and the compiler will not stop you from forgetting it. `null` is the same lie in a quieter voice — `Order | null` admits something might be missing but does nothing to make you check, so the day you forget the `if`, the bug ships and the types smile and say everything's fine.

The fix is the same move this whole series keeps making: stop reaching for control flow, reach for a value. **Make failure a thing you return, not a thing that escapes.** A function that can fail should say so in its type, hand you back a value that is either the success or the explanation, and refuse to let you read the success without acknowledging the failure. We started that at the end of the last piece. Let's finish it.

## A value that is success or failure

Here's the type again, the one the last piece left on the table:

```ts
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

That's the whole idea. A `Result` is one of two shapes — a success carrying a `value`, or a failure carrying an `error` — and TypeScript won't let you touch `value` until you've proven you're on the `ok: true` branch. The failure isn't off in a `catch` block; it's right there in your hands, a value like any other, as inspectable as a number. Two tiny constructors make them pleasant to build:

```ts
const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

Now rewrite the three steps so each one _returns_ its failure instead of throwing it, finding it, or hiding it. Errors, for the moment, are just strings that name what went wrong:

```ts
type ShipError = "not_found" | "cancelled" | "already_shipped" | "no_inventory";

const findOrder = (orders: Order[], id: string): Result<Order, ShipError> => {
  const found = orders.find(o => o.id === id);
  return found ? ok(found) : err("not_found");
};

const ensureShippable = (order: Order): Result<Order, ShipError> => {
  if (order.status === "cancelled") return err("cancelled");
  if (order.status !== "pending") return err("already_shipped");
  return ok(order);
};

const applyShipment = (order: Order): Result<Order, ShipError> =>
  inStock(order) ? ok({ ...order, status: "shipped" }) : err("no_inventory");
```

Three honest functions. Each one's type now tells the truth: _give me this, and you'll get back either what you wanted or a reason you didn't._ But honesty alone hasn't bought us much yet — if anything we've made more work, because now every caller has to unwrap a `Result`. String three of these together by hand and you get exactly the nightmare the skeptics warn you about:

```ts
const found = findOrder(orders, id);
if (!found.ok) return found;
const shippable = ensureShippable(found.value);
if (!shippable.ok) return shippable;
const shipped = applyShipment(shippable.value);
if (!shipped.ok) return shipped;
commit(shipped.value);
```

Unwrap, check, unwrap, check. This is the moment people decide functional error handling is a tax and go back to throwing. They're right about the pain and wrong about the cure. The pain isn't `Result` — it's that we're unwrapping by hand. There's a track running underneath all that repetition, and once you see it, the boilerplate disappears.

## The railway

Picture two parallel rails. The top rail is the **success track**; the bottom is the **failure track**. Your data rides in on the top, moving left to right through one step after another. As long as everything succeeds, it stays up top, station to station. The instant a step fails, it gets switched down onto the failure track — and the failure track is express. It runs straight past every remaining station, untouched, to the far end, where you handle it once.

<svg viewBox="0 0 760 300" role="img" aria-labelledby="railway-title railway-desc" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;border-radius:12px;background:#0b1d2c;display:block;margin:1.5rem 0"><title id="railway-title">A Result pipeline as a railway</title><desc id="railway-desc">Orders flow left to right along a success track through findOrder, ensureShippable, and applyShipment to commit. A failing step at ensureShippable diverts the order down a switch onto a parallel failure track, which runs express past the remaining steps straight to a single handler at the right edge.</desc><g stroke="#16324a" stroke-width="1"><line x1="0" y1="70" x2="760" y2="70"/><line x1="0" y1="150" x2="760" y2="150"/><line x1="0" y1="230" x2="760" y2="230"/><line x1="130" y1="0" x2="130" y2="300"/><line x1="320" y1="0" x2="320" y2="300"/><line x1="510" y1="0" x2="510" y2="300"/><line x1="660" y1="0" x2="660" y2="300"/></g><line x1="60" y1="110" x2="690" y2="110" stroke="#1f6f9f" stroke-width="9" opacity="0.35" stroke-linecap="round"/><line x1="60" y1="110" x2="690" y2="110" stroke="#46b0e6" stroke-width="3" stroke-linecap="round"/><line x1="330" y1="220" x2="690" y2="220" stroke="#7a4233" stroke-width="9" opacity="0.4" stroke-linecap="round"/><line x1="360" y1="220" x2="690" y2="220" stroke="#e0875a" stroke-width="3" stroke-dasharray="1 9" stroke-linecap="round"/><path d="M320 122 C 320 175, 330 205, 372 219" fill="none" stroke="#e0875a" stroke-width="3" stroke-linecap="round"/><g fill="#0b1d2c" stroke="#46b0e6" stroke-width="3"><circle cx="130" cy="110" r="11"/><circle cx="320" cy="110" r="11"/><circle cx="510" cy="110" r="11"/></g><circle cx="680" cy="110" r="13" fill="#0b1d2c" stroke="#5ad19a" stroke-width="3"/><path d="M674 110 l4 5 l8 -10" fill="none" stroke="#5ad19a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="680" cy="220" r="13" fill="#0b1d2c" stroke="#e0875a" stroke-width="3"/><path d="M675 215 l10 10 M685 215 l-10 10" stroke="#e0875a" stroke-width="2.5" stroke-linecap="round"/><g fill="#46b0e6"><circle cx="200" cy="110" r="4"/><circle cx="245" cy="110" r="4"/></g><circle cx="352" cy="205" r="4" fill="#e0875a"/><g fill="#c8d6e2" font-family="ui-sans-serif,system-ui,sans-serif" font-size="13" text-anchor="middle"><text x="130" y="142">findOrder</text><text x="320" y="142">ensureShippable</text><text x="510" y="142">applyShipment</text></g><g fill="#8aa0b4" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12.5"><text x="700" y="106">ok → commit</text><text x="700" y="224">error → handle</text></g><text x="455" y="252" fill="#9a6b52" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" font-style="italic">express: skips the rest</text></svg>

That's the whole picture. Now we need exactly one tool to build it: a way to chain a step onto the track that knows to do nothing when we're already on the failure rail. That tool is `flatMap`.

```ts
const flatMap =
  <T, U, E>(f: (value: T) => Result<U, E>) =>
  (r: Result<T, E>): Result<U, E> =>
    r.ok ? f(r.value) : r;
```

Read it in English: _if we're still on the success track, run the next step; if we've already failed, pass the failure straight through and don't run anything._ That `: r` is the express track — the short-circuit — in one character. Its quieter siblings round out the kit:

```ts
const map =
  <T, U>(f: (value: T) => U) =>
  <E>(r: Result<T, E>): Result<U, E> =>
    r.ok ? ok(f(r.value)) : r;

const mapError =
  <E, F>(f: (error: E) => F) =>
  <T>(r: Result<T, E>): Result<T, F> =>
    r.ok ? r : err(f(r.error));
```

`map` transforms the success when the step _can't_ fail; `mapError` rewrites the failure (turn a low-level error into a user-facing one) without touching the success. Three functions, and notice every one of them is the same `r.ok ? … : …` shrug — _is this still on the happy path? then act; otherwise get out of the way._

With `flatMap` in hand, remember `pipe` from the last piece — the four-liner that runs a value through a list of functions left to right? This is the job it was waiting for:

```ts
const pipe = <T>(value: T, ...fns: Array<(x: T) => T>): T =>
  fns.reduce((acc, fn) => fn(acc), value);

const result = pipe(
  findOrder(orders, id),
  flatMap(ensureShippable),
  flatMap(applyShipment),
);
```

That is the entire railway. The unwrap-check-unwrap-check ladder collapsed into three lines that read top to bottom like a description of the happy path — because that's what they are. If `findOrder` fails, `ensureShippable` and `applyShipment` never run; the `not_found` rides the express track untouched all the way to `result`. No `try`. No re-checking. The short-circuit you used to spell out by hand is now baked into the one combinator doing the chaining.

## Handle it once, at the edge

The pipeline produces a `Result`, and at the boundary — where you actually talk to the user — you finally split the two tracks apart and deal with each:

```ts
if (result.ok) {
  commit(result.value);
} else {
  switch (result.error) {
    case "not_found":
      return toast("That order doesn't exist.");
    case "cancelled":
      return toast("Cancelled orders can't ship.");
    case "already_shipped":
      return toast("That order's already on its way.");
    case "no_inventory":
      return toast("Out of stock — can't ship yet.");
    default:
      return assertNever(result.error);
  }
}
```

This is the same exhaustiveness trick from the last piece — the `Record<Status, string>` that wouldn't compile if you forgot a status — except now it's load-bearing. `assertNever` is the lock:

```ts
const assertNever = (x: never): never => {
  throw new Error(`Unhandled error: ${JSON.stringify(x)}`);
};
```

Because `result.error` is a finite union of strings, TypeScript narrows it case by case; handle every one and the `default` branch receives `never`, which is fine. Miss one — or, six months from now, add `"address_invalid"` to `ShipError` and forget this `switch` — and the leftover case is no longer `never`, so `assertNever` won't accept it and **the build breaks before the bug does.** That's the trade you've made: the failure that used to slip through a forgotten `if` is now something the compiler refuses to let you ignore.

## When a string isn't enough

Strings name a failure but can't carry anything. The moment a caller needs more than the name — _how many_ were in stock, _which_ tracking number the order already has — the string runs out of room. So let the error grow up into a shape of its own:

```ts
type ShipError =
  | { kind: "not_found" }
  | { kind: "cancelled" }
  | { kind: "already_shipped"; trackingNumber: string }
  | { kind: "no_inventory"; available: number };
```

Each error still announces itself through a literal — the `kind` field — but now it can carry exactly the data that failure has to explain, and only that data. `no_inventory` knows how many are available; `not_found` carries nothing because there's nothing to say. The producers barely change (`err({ kind: "no_inventory", available: stock(order) })`), and the handler gets _richer_ while staying just as exhaustive:

```ts
switch (result.error.kind) {
  case "no_inventory":
    return toast(`Only ${result.error.available} left — can't ship the full order.`);
  case "already_shipped":
    return toast(`Already shipped under ${result.error.trackingNumber}.`);
  // …the rest, still compiler-enforced
}
```

Inside `case "no_inventory"`, TypeScript knows `result.error` has an `available: number`; inside `already_shipped`, it knows there's a `trackingNumber`. Each branch is narrowed to precisely the fields that error carries, and reaching for a field that doesn't belong to this case won't compile.

That little `{ kind: … }` union has a name — a **discriminated union** — and it's one of the most useful tools in TypeScript's whole box. (You've actually been using one this entire time: `Result` itself is a discriminated union, split on `ok`.) It deserves a piece of its own — and [gets one here](/posts/discriminated-unions); for now you only need the shape. Because here's where it stops being a tidy way to model errors and becomes something bigger.

## Make the illegal states impossible

Look back at the `Order` type the last piece has been carrying around:

```ts
type Order = {
  id: string;
  customer: string;
  total: number;
  status: Status; // "pending" | "shipped" | "delivered" | "cancelled"
  placedAt: string;
};
```

This type lies, and it lies in the same way `Order | null` did — by permitting things that can't be true. A `"shipped"` order with no tracking number. A `"cancelled"` order with no reason. A `"delivered"` order that was never shipped. Every one of those is a value this type happily lets you build, and every one is why the codebase is salted with defensive checks — `if (order.status === "shipped" && order.trackingNumber)` — and the non-null assertions (`order.trackingNumber!`) you write to shut the compiler up when you _know_ it's there. You know, but the type doesn't.

Use the discriminated union to make the type know. Split `Order` on `status`, and give each variant exactly the fields that status requires:

```ts
type OrderBase = {
  id: string;
  customer: string;
  total: number;
  placedAt: string;
};

type Order =
  | (OrderBase & { status: "pending" })
  | (OrderBase & { status: "shipped"; trackingNumber: string })
  | (OrderBase & { status: "delivered"; trackingNumber: string; deliveredAt: string })
  | (OrderBase & { status: "cancelled"; reason: string });

type ShippedOrder = Extract<Order, { status: "shipped" }>;
```

Now `trackingNumber` _exists only when_ `status` is `"shipped"` or `"delivered"`. There is no such thing as a shipped order without one — not because you remembered to check, but because the type can't represent it. The defensive `if`s don't get fixed; they get _deleted_, because the situation they guarded against can no longer occur. The `!` assertions go with them. This is the principle the whole second half of the series turns on: **make illegal states unrepresentable.** Don't validate that the data is well-formed all over the codebase — shape the type so malformed data can't be constructed in the first place.

And it pays off the railway directly. Sharpen `applyShipment` to return the shipped variant:

```ts
const applyShipment = (order: Order): Result<ShippedOrder, ShipError> =>
  inStock(order)
    ? ok({ ...order, status: "shipped", trackingNumber: nextTracking() })
    : err({ kind: "no_inventory", available: stock(order) });
```

Try to ship without producing a tracking number — `ok({ ...order, status: "shipped" })` — and it no longer compiles, because a `ShippedOrder` _is_ an order with a tracking number, by definition. The guarantee `ensureShippable` enforced at runtime, the type now enforces at compile time. The railway was about handling failure gracefully when it happens; this is about deleting a whole class of failure so it can't.

## The shape underneath

Step back and look at `flatMap` again, because you've quietly built something with a much longer history than "error handling."

A `Result` is a box that holds one of two things and lets you keep working on the inside without prying the lid off. `Option` — the cousin for a value that's simply _absent_, with no error to explain, no story to tell — is the same box with a plainer label:

```ts
type Option<T> = { some: true; value: T } | { some: false };

const flatMapOption =
  <T, U>(f: (value: T) => Option<U>) =>
  (o: Option<T>): Option<U> =>
    o.some ? f(o.value) : o;
```

Look at the body. It's `flatMap` for `Result` with the words changed. _Reach inside if there's something there; otherwise pass the emptiness through untouched._ Reach for `Result` when a missing thing comes with a reason ("not found, because…"); reach for `Option` when it's just not there. Same machine, different cargo.

And here's the one you use a hundred times a day without thinking of it this way:

```ts
fetchOrder(id) // Promise<Order>
  .then(order => fetchCustomer(order.customerId)); // Promise<Customer>
```

`.then` takes the value out of a `Promise`, runs a function that returns _another_ `Promise`, and hands you back a single flattened `Promise` — it doesn't nest. That's `flatMap`. A `Promise` is a box holding a value-that-isn't-here-yet, and `.then` is how you keep working on the inside without cracking it open. You've been doing functional error handling's central move on every async call in your career.

Three boxes — `Result`, `Option`, `Promise` — each holding their own kind of "maybe not a plain value," and each with the _same_ way of chaining a next step that knows how to do nothing when there's nothing to do. When a shape recurs that insistently, it earns a name. This one is called a **monad** — a box with a `flatMap` (and a way to put a value in). That's it. That's the word that launched a thousand impenetrable tutorials, and you just built three of them from scratch and used them to ship an order. The abstraction was never the hard part; it was only ever the _name_ for the pattern you'd have arrived at anyway.

One honest asterisk, since a pedant will raise it if I don't: `Promise` is the imperfect cousin. A real monad nests — a `Result<Result<T>>` is a genuine thing you `flatMap` flat on purpose — but `Promise` auto-flattens (there's no `Promise<Promise<T>>`), and its `.then` is overloaded to do both `map` and `flatMap` at once. So it breaks the laws a purist cares about. It's still the most useful intuition pump you've got for what `flatMap` _feels_ like, which is why I'm using it and flagging it in the same breath.

If you go looking for these in the wild, the vocabulary shifts: the functional world has carried `Result` for decades under the name **`Either`** — `Either<E, A>`, the same two-shape box with the error conventionally on the `Left` and the success on the `Right`. Same idea, older name. Now you can read both.

## Where it's not worth it

A pattern you can't say no to is a religion, not a tool, so here's the line. `Result` is for _expected, recoverable_ failures — the ones that are part of your domain. An order isn't found. A shipment has no stock. A form field is malformed. Those aren't exceptional; they're Tuesday, and they belong in your types.

A genuinely _exceptional_ condition is different, and exceptions are still the right tool for it. A broken invariant, a config that should exist and doesn't, an "this should be impossible" branch, an out-of-memory — those mean the program is in a state you have no recovery for, and a thrown exception that crashes loud and early is exactly what you want. Don't wrap your null-pointer bugs in a `Result`; let them blow up where you'll see them. The rule of thumb: if a caller can _sensibly do something_ about the failure, return it as a value; if there's nothing to do but abort, throw. And keep `Result` at the seams where real fallibility lives — the fetch, the parse, the transition — not threaded through every pure leaf helper, which just turns simple code into plumbing.

## Where this gets industrial

Everything above is hand-rolled on purpose — eleven lines of `Result`, `ok`, `err`, `map`, `flatMap`, `mapError` and you have a working railway with nothing installed. That's the point: the concept owes nothing to a library. But it does get verbose. A long `flatMap` chain has more ceremony than a `try/catch`, the hand-rolled `pipe` stops type-checking cleanly the moment a step changes the value's type (watch it strain when `applyShipment` turns an `Order` into a `ShippedOrder`), and async drags `Promise<Result<T, E>>` into everything. That friction is exactly where the libraries earn their keep:

- **[neverthrow](https://github.com/supermacro/neverthrow)** is the closest to what you just built — a focused `Result` with chainable methods and a `ResultAsync` that handles the `Promise<Result>` knot we sidestepped here. The lightest possible upgrade from hand-rolled.
- **[Effect](https://effect.website/)** is the industrial end: typed errors, dependencies, and async all modeled as composable values, with the whole pipeline machinery built in. It's where this thinking goes when "errors as values" grows into "effects as values" — which, not coincidentally, is a later piece.
- **[fp-ts](https://github.com/gcanti/fp-ts)** is the classic, Haskell-faithful lineage where `Either` and `Option` come from, if you want the vocabulary at its source.

Reach for one when the hand-rolled version starts to chafe — not before. The idea is the asset; the library is just where it gets comfortable at scale.

## The doorway

The railway is only ever as honest as the data that boards it. Every step above trusted that `orders` was a real array of well-formed `Order`s — but that array came off the network as `any`, parsed from JSON that some server promised, not your compiler. We made illegal states unrepresentable _inside_ the program; the front door is still wide open. The move that closes it — parsing untrusted input exactly once, at the boundary, into a type that cannot be invalid, so nothing downstream ever has to check again — is the next piece: [**Parse, Don't Validate**](/posts/parse-dont-validate).

You walked in throwing exceptions and forgetting null checks. Now failure is a value you return, a railway composes your fallible steps without a single `try`, illegal states won't compile, and the scary word turned out to be a box with a `flatMap`. Your errors aren't accidents that escape your functions anymore. They're part of what your functions _are_.
