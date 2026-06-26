---
title: "Booleans Lie: Modeling State with Discriminated Unions in TypeScript"
author: Jared Schraub
pubDatetime: 2026-06-26T12:00:00Z
featured: true
tags:
  - Functional JavaScript
  - TypeScript
  - JavaScript
  - Functional Programming
description: "Three booleans give you eight states when you only meant four. Discriminated unions make the illegal ones unrepresentable — model a value as exactly one of a fixed set of shapes and let TypeScript hold you to it."
ogImage: ../../assets/images/discriminated-unions-banner.png
---

![Several distinct geometric variant cards with exactly one illuminated and selected by a discriminant, the others dimmed](@/assets/images/discriminated-unions-banner.png)

You've written this component. A thing loads, it might fail, and if it works you show it:

```ts
function UserProfile({ id }: { id: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // ...fetch, set the three pieces of state...

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBanner message={error.message} />;
  if (user) return <Profile user={user} />;
  return null;
}
```

Three pieces of state. Reasonable. Ships every day. But count what those three can spell between them: each is independently on or off, so there are 2 × 2 × 2 = **eight** combinations the types happily allow — and only about four of them mean anything. What is `{ isLoading: true, error: someError, user: someUser }`? Loading, but also failed, but also succeeded? What's the bottom `return null` catching — the state where it's not loading, hasn't errored, and has no user? You wrote that branch to silence a warning, not because it's a real thing.

And the gap isn't theoretical. The classic bug: the user refetches, you set `isLoading` back to `true`, but the old `user` is still sitting in state — so now your render hits `if (isLoading)` and flashes a spinner _over_ stale data, or worse, an earlier `error` never got cleared and shows under a fresh result. Nothing stopped you, because nothing in the types says these three values are supposed to move together. You didn't model a state. You scattered three booleans on the floor and started reading them in an order you hoped was safe.

Here's the thing you've actually been doing: hand-building a state machine out of loose flags and trusting that the combinations that make no sense will never happen. They happen. The fix isn't more `if`s or a careful reset in every handler. It's to stop letting the illegal combinations _exist_.

## Make the impossible states impossible

Your component is never really in eight states. It's in exactly one of three: loading, failed, or loaded. So say that — as one type that is _one of_ three shapes:

```ts
type RemoteData<T> =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "success"; data: T };
```

Read it as "a `RemoteData` is a loading, _or_ an error-with-an-error, _or_ a success-with-data." The `error` field exists **only** inside the error shape; `data` exists **only** inside success. There is no shape with both, and no shape with neither — so `{ status: "loading", error, data }` isn't a bug you guard against, it's a value you _cannot construct_. The eight combinations collapse to the three that were ever real, and the render reads like the state machine it always was:

```ts
switch (state.status) {
  case "loading": return <Spinner />;
  case "error":   return <ErrorBanner message={state.error.message} />;
  case "success": return <Profile user={state.data} />;
}
```

That's a **discriminated union**, and it's one of the most useful tools TypeScript has. Let's take it apart, because the shape above is doing more than it looks like.

## What makes it _discriminated_

A discriminated union (you'll also hear "tagged union" or "sum type") is a union of object types that all share one field — the **discriminant** — whose type is a _literal_. Here the discriminant is `status`, and its literal values — `"loading"`, `"error"`, `"success"` — are the labels TypeScript uses to tell the three shapes apart.

That literal field is the whole trick, and it's what separates a discriminated union from two things that look similar but aren't:

- A bare union of primitives — `type Status = "loading" | "error" | "success"` — is a union, but there's nothing to discriminate; it carries no data.
- An _untagged_ union of objects — `{ data: T } | { error: Error }` — has data but no common label, so TypeScript can't cleanly tell which one you're holding. You end up writing `"data" in value` checks and hoping.

Add the shared literal field and the union gets a handle TypeScript can grab.

## The discriminant is a field you name

Nothing about the name `status` is special. TypeScript will discriminate on _any_ field that's common to every member and has literal types. The community leans on a handful of conventions — `kind`, `type`, `tag`, `_tag` (the underscore comes from the fp-ts/Effect lineage) — and they're all equivalent to the compiler. Pick one and stay consistent. I avoid `type` (it collides with the word "type" in every conversation about the code) and reach for `kind`, or a domain word like `status` or `step` when one reads naturally.

## Narrowing: the field exists where it's valid

Here's the payoff over the boolean soup. When you test the discriminant, TypeScript **narrows** the union to the matching member and unlocks exactly that member's fields:

```ts
if (state.status === "success") {
  state.data;  // ✓ TypeScript knows we're in the success shape
  state.error; // ✗ doesn't exist here — compile error
}
```

In the boolean version, `user` was `User | null` _everywhere_, so you sprinkled `user?.` and the occasional `user!` through the whole component to promise the compiler it was really there. In the union, `data` is a plain `T` precisely where it's valid and is absent everywhere else. The optionality didn't get handled — it got _deleted_, because the type now encodes the one place the field exists. A `switch` on the discriminant narrows the same way in every `case`, which sets up the second gift.

## Exhaustiveness: the compiler keeps your TODO list

Model state as a fixed set of shapes and you can ask TypeScript to guarantee you've handled all of them:

```ts
const assertNever = (x: never): never => {
  throw new Error(`Unhandled variant: ${JSON.stringify(x)}`);
};

function render(state: RemoteData<User>) {
  switch (state.status) {
    case "loading": return <Spinner />;
    case "error":   return <ErrorBanner message={state.error.message} />;
    case "success": return <Profile user={state.data} />;
    default:        return assertNever(state);
  }
}
```

By the `default`, all three cases have been narrowed away, so `state` has type `never` — the empty type — and `assertNever` accepts it. Now add a fourth shape, say `{ status: "refetching"; data: T }`. Suddenly `state` in that `default` isn't `never` anymore; it's the new variant, and `assertNever` _won't compile_. Every `switch` across the codebase that didn't add a `"refetching"` case lights up red, pointing you at exactly the spots that now have a hole. You didn't write a test for that. The type system walked you to every call site that has to change the moment you added a state.

## "Why not just an enum and some optional fields?"

This is the objection worth answering head-on, because it's the move most people reach for first:

```ts
enum Status { Loading, Error, Success }

type State<T> = {
  status: Status;
  error?: Error;
  data?: T;
};
```

It looks tidier than a three-armed union. It's the boolean soup in a nicer coat. `{ status: Status.Success, data: undefined }` typechecks. So does `{ status: Status.Loading, error: anError, data: someData }`. The enum _names_ the states but never _binds_ the data to them — `error` and `data` float at the top level, optional, available (and absent) in every state — so every consumer is right back to `if (state.data)` and `state.data!`, because as far as the type knows, success might still have no data.

The discriminated union binds. `data` lives _inside_ the success shape and nowhere else, so the inconsistent combinations have no representation at all. That principle has a name worth carrying around: **make illegal states unrepresentable.** Don't write runtime checks that the data agrees with the state — build a type in which disagreeing data can't be constructed in the first place. The checks you delete are the bugs you'll never file.

## It's not just for fetch state

Anytime something moves through a fixed sequence of stages, the stages are your variants and the discriminant is the current stage. A checkout flow:

```ts
type Checkout =
  | { step: "cart"; items: Item[] }
  | { step: "shipping"; items: Item[]; address: Address }
  | { step: "payment"; items: Item[]; address: Address; method: PaymentMethod }
  | { step: "confirmed"; orderId: string };
```

Each step carries _only_ what it has by then — there's no `address` until shipping, no `orderId` until it's confirmed — so reading a field before it exists isn't a precaution you take, it's a line that won't compile. And transitions become functions from one shape to the next:

```ts
const toShipping = (
  s: Extract<Checkout, { step: "cart" }>,
  address: Address
): Checkout => ({ step: "shipping", items: s.items, address });
```

The transition's _type_ says which state it starts from. Trying to collect payment before there's an address isn't a bug you defend against with an `if` — it's a function call that doesn't typecheck.

> One honest ceiling: when variants nest unions of their own, or you need to match on two discriminants at once, a plain `switch` gets unwieldy, and there's a deeper world of nested and recursive unions plus real pattern-matching beyond it. That's a bigger topic than this primer — just know the room keeps going up from the floor we're laying here.

## Where it's _not_ worth it

A discriminated union earns its keep when a value has several states with genuinely different shapes and some combinations are illegal. That's a lot of your state — but it isn't everything. A plain record like `{ id: string; name: string; email: string }` has no illegal states to rule out; wrapping it in a single-variant union is ceremony with no payoff. And the honest cost: variants repeat their shared fields, which gets verbose, so lift the common part into a base type and intersect it back in —

```ts
type Base = { items: Item[] };
type Cart = Base & { step: "cart" };
type Shipping = Base & { step: "shipping"; address: Address };
```

— and reach for the union where the _states_ differ, not as a reflex on every type you declare.

## The one thing the compiler can't do for you

The discriminant is your only _runtime_ trace of which shape you're holding. Types vanish when the code runs; the string `"success"` sitting in the `status` field is what actually survives. So a discriminated union is exactly as trustworthy as the data carrying it — which means when a value comes from somewhere you don't control (a JSON response, `localStorage`, a form submission), you have to genuinely _parse_ it into the union at the boundary, not just assert that it probably matches. That's a discipline of its own, for another day. But once a value is safely one of a fixed set of honest shapes, an entire category of "wait — how did it get into _this_ state?" bug simply stops existing.

Three booleans promised you four states and quietly handed you eight. A discriminated union gives you back exactly the ones that are real — a value that can only ever be one honest thing at a time.
