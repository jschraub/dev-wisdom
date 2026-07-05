---
title: "Parse, Don't Validate: Making Bad Input Impossible in TypeScript"
author: Jared Schraub
pubDatetime: 2026-07-04T13:00:00Z
featured: true
tags:
  - Functional JavaScript
  - TypeScript
  - JavaScript
  - Functional Programming
  - Data Validation
  - Schema Validation
  - Parsing
  - Type Safety
  - Branded Types
  - Discriminated Unions
  - Zod
  - React
  - Web Development
description: "Stop checking the same field in fifteen places. Parse untrusted input once at the boundary into a type that can't be invalid — validation forgets what it learned, parsing keeps the proof in the type — and every downstream check disappears."
ogImage: ../../assets/images/parse-dont-validate-banner.png
---

![Ragged, mismatched fragments of untrusted data funneling into a single boundary gate and emerging on the far side as one clean, uniform row of typed shapes](@/assets/images/parse-dont-validate-banner.png)

At the end of [the last piece](/posts/errors-are-values) I made illegal states unrepresentable _inside_ the program — and then, in the last paragraph, admitted the front door was still wide open. The `orders` our railway ran on came off the network as `any`, parsed from JSON some server _promised_ us, not the compiler. Every honest type we built downstream was standing on a value nobody ever actually checked.

Here's what that looks like in the wild. You fetch the orders and get to work:

```ts
const res = await fetch("/api/orders");
const orders = (await res.json()) as Order[];

setOrders(orders); // and off it goes into the railway
```

That `as Order[]` is not a check. It's a lie the compiler agrees to believe. `res.json()` hands back `any`; the cast just paints a type over it and waves it through. The day the API renames `total` to `amount`, or sends back `status: "processing"` — a value that isn't in our union — or ships an order with no `trackingNumber`, nothing stops it at the door. The bad data flows in wearing an `Order` badge, and you find out three components deep when `sumTotals` returns `NaN` and a `switch` falls through a case that "can't happen."

So you get responsible and you check. And this is where the real trap springs — not the naïve cast, but the diligent thing you do to replace it.

## Validation forgets what it learned

You've written the responsible version. A guard, run at the edge:

```ts
const isValidOrder = (o: any): boolean =>
  typeof o.id === "string" &&
  typeof o.total === "number" &&
  typeof o.status === "string";
```

You call it, you branch on it, you feel safe. But look at what `isValidOrder` gives back: a `boolean`. It answers one question — _is this shaped right?_ — and then throws the answer away. After `if (isValidOrder(o))`, the type of `o` is exactly as wide as it was before: still `any`, still a shrug. You did the work of checking and TypeScript learned _nothing_ from it. So the next function down the line, holding the same loosely-typed value, has no idea it was ever vetted — and checks again. And the one after that checks again.

That's the recognition. It's the `email?: string` that stays optional forever, so you write `if (!user.email) return` in the mailer, and again in the CSV export, and again in the receipt, fifteen guards for one fact you established at the boundary and had no way to _record_. The field is optional in the type, so it's optional everywhere, so everywhere re-asks.

This is the crippled half of an idea you already use every day. Everyone validates. The trouble is that validation is a function that returns a `boolean` and forgets — it checks the data and hands you back a verdict instead of a value. You keep the input; you lose the knowledge.

The fix is the move this whole series keeps making. Don't check and forget — check and _keep the answer in the type_.

## Parsing keeps the proof

Change the return type. A validator answers `unknown → boolean`. A **parser** answers `unknown → Result<Order, ParseError>` — the same `Result` from last piece, and yes, that means a parser is just a fallible step that belongs on the railway.

```ts
type ParseError =
  | { kind: "not_an_object" }
  | { kind: "missing_field"; field: string }
  | { kind: "wrong_type"; field: string; expected: string }
  | { kind: "unknown_status"; got: string };

const parseOrder = (raw: unknown): Result<Order, ParseError> => {
  // ...check each field, returning err() on the first thing that's wrong...
  // and on success, hand back a real Order:
  return ok(order);
};
```

The difference is the whole point. On success you don't get `true` — you get an `Order`, a value that _could not exist_ if the check had failed. The proof isn't a fact you have to remember; it's welded to the type of the thing in your hand. Downstream code that receives an `Order` doesn't re-check, because there's nothing left to doubt: the only way to hold an `Order` is to have come through the parser. You checked once, and the type carries the receipt everywhere it goes.

Notice `ParseError` is a discriminated union — the same shape as `ShipError` last piece — so a parse failure rides the failure track and gets handled exhaustively at the edge, right next to every other way the pipeline can fail. The parser isn't a new mechanism bolted on. It's the first station on the railway you already built, and its input type is honest: `unknown`, not `any`. `unknown` is the one that _forces_ you to parse before you touch anything.

## Parse once, at the boundary

Alexis King named this discipline in a [2019 essay](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/) whose title I'm borrowing: **parse, don't validate.** The rule is about _where_ the check lives as much as what it returns. Untrusted data enters your program at a small number of seams — a `fetch` response, a form submit, a `localStorage` read, a URL param, a webhook body. Those seams are the boundary. You parse there, once, turning `unknown` into a precise type, and everything on the inside gets to be honest code that never re-checks a thing.

<svg viewBox="0 0 760 280" role="img" aria-labelledby="pv-t pv-d" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;border-radius:12px;background:linear-gradient(180deg,#16283b 0%,#0b1725 100%);display:block;margin:1.5rem 0"><title id="pv-t">Parsing at the boundary</title><desc id="pv-d">Ragged grey fragments of untrusted data, typed as unknown, drift from the left toward a single vertical gate labelled parseOrder. They pass through and emerge on the right as a row of identical glowing hexagons — well-typed Order values. One malformed fragment is turned away at the gate. The check happens only at the gate, once.</desc><defs><pattern id="pv-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#25405a" stroke-width="1"/></pattern><pattern id="pv-grid2" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M120 0H0V120" fill="none" stroke="#31506e" stroke-width="1"/></pattern><filter id="pv-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="0" y="0" width="760" height="280" fill="url(#pv-grid)" opacity="0.5"/><rect x="0" y="0" width="760" height="280" fill="url(#pv-grid2)" opacity="0.55"/><g fill="#63727f" stroke="#8fa0ad" stroke-width="1.5"><polygon points="44,96 78,84 96,112 60,126"/><polygon points="120,150 154,140 172,166 142,182 116,172"/><polygon points="60,190 92,180 106,208 70,216"/><polygon points="150,92 182,86 196,116 160,122"/><polygon points="96,58 122,52 134,78 104,84"/><polygon points="210,120 240,110 254,136 224,148"/></g><g stroke="#4fc3f0" fill="none" stroke-linecap="round"><line x1="380" y1="64" x2="380" y2="118" stroke-width="3"/><line x1="380" y1="162" x2="380" y2="226" stroke-width="3"/><line x1="373" y1="118" x2="387" y2="118" stroke-width="2.4"/><line x1="373" y1="162" x2="387" y2="162" stroke-width="2.4"/></g><polygon points="336,126 362,122 372,146 346,156" fill="#4a5560" stroke="#7d6b70" stroke-width="1.3" opacity="0.78"/><path d="M348 134 l11 11 M359 134 l-11 11" fill="none" stroke="#ef5a5a" stroke-width="2.6" stroke-linecap="round"/><line x1="404" y1="140" x2="438" y2="140" stroke="#4fc3f0" stroke-width="2" stroke-linecap="round"/><polygon points="438,134 448,140 438,146" fill="#4fc3f0"/><g filter="url(#pv-glow)" fill="#0b3a5e" stroke="#4fc3f0" stroke-width="2"><polygon points="466,123 481,132 481,148 466,157 451,148 451,132"/><polygon points="524,123 539,132 539,148 524,157 509,148 509,132"/><polygon points="582,123 597,132 597,148 582,157 567,148 567,132"/><polygon points="640,123 655,132 655,148 640,157 625,148 625,132"/><polygon points="698,123 713,132 713,148 698,157 683,148 683,132"/></g><g fill="none" stroke="#5ad19a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M459 140 l4 5 l9 -11"/><path d="M517 140 l4 5 l9 -11"/><path d="M575 140 l4 5 l9 -11"/><path d="M633 140 l4 5 l9 -11"/><path d="M691 140 l4 5 l9 -11"/></g><text x="380" y="50" text-anchor="middle" fill="#cfe4f2" font-family="ui-sans-serif,system-ui,sans-serif" font-size="13.5">parseOrder</text><g font-family="ui-sans-serif,system-ui,sans-serif" font-size="12.5" fill="#8aa0b4"><text x="44" y="256">unknown · untrusted</text><text x="582" y="184" text-anchor="middle">Order · typed</text></g></svg>

The fifteen `if (!user.email)` guards don't get tidied up. They get _deleted_ — the same way the defensive `if (order.status === "shipped" && order.trackingNumber)` checks got deleted last piece when we made the illegal state unrepresentable. Same principle, moved to the front door: shape a type that bad input can't inhabit, then parse into it at the one place bad input arrives.

## A type that can't be invalid

For this to pay off, the type you parse _into_ has to be worth trusting — precise enough that holding it actually means something. Two moves get you there.

The first is **branded types**, for the values a plain primitive can't keep honest. An email is a `string`, but not every `string` is an email, and `email: string` can't tell the difference — which is exactly why you re-check it fifteen times. So make a type that a raw string can't sneak into:

```ts
type Email = string & { readonly __brand: "Email" };

const parseEmail = (raw: unknown): Result<Email, ParseError> =>
  typeof raw === "string" && /^[^@\s]+@[^@\s]+$/.test(raw)
    ? ok(raw as Email)
    : err({ kind: "wrong_type", field: "email", expected: "Email" });
```

That single `as Email` is the _only_ sanctioned cast in the codebase, and it lives one line away from the check that earns it. Everywhere else, an `Email` is unforgeable — the sole way to get one is through `parseEmail`. So a function that asks for an `Email`:

```ts
const sendReceipt = (to: Email, order: Order) => { /* ... */ };
```

_cannot_ be handed an unvalidated string. `sendReceipt(rawInput, order)` won't compile. The question "is this a real email?" is asked once, at the boundary, and its answer rides along in the type forever after. An invalid email isn't something you guard against downstream; it's a value that can't reach downstream.

The orders view captures that email on a form — a customer typing their contact address on the way in — and that submit handler _is_ the boundary. It's the one place the raw string has to earn the `Email` type:

```ts
const onSubmit = (form: FormData) => {
  const email = parseEmail(form.get("email"));
  if (!email.ok) return setError(email.error);
  sendReceipt(email.value, order); // email.value is an Email — proven, no re-check
};
```

Past that `if`, `email.value` is an `Email`, and it stays one through every function it's handed to. The fifteen `if (!email.includes("@"))` guards scattered downstream never get written, because the type already says the thing they were checking for.

The second move is to parse into the **discriminated union** from last piece, instead of a loose bag of fields. Remember the honest `Order` — the one where a `"shipped"` order _must_ carry a `trackingNumber`, by construction? The parser is the only place raw data becomes a member of that union, and it's where the union's guarantees get enforced against reality. With the shared fields already parsed into a `base`, the discriminant picks the variant and demands exactly its fields:

```ts
switch (o.status) {
  case "pending":
    return ok({ ...base, status: "pending" });
  case "shipped":
    return typeof o.trackingNumber === "string"
      ? ok({ ...base, status: "shipped", trackingNumber: o.trackingNumber })
      : err({ kind: "missing_field", field: "trackingNumber" });
  // delivered, cancelled…
  default:
    return err({ kind: "unknown_status", got: String(o.status) });
}
```

A raw `{ status: "shipped" }` with no tracking number _cannot_ produce an `Order` — the parser refuses it at the door, so the illegal state the type forbids can never get constructed from untrusted input in the first place. This is the thing the [discriminated unions primer](/posts/discriminated-unions) promised and left for later: a union is only as trustworthy as the data carrying its discriminant, so when the value comes from outside, you have to _genuinely parse_ it into the union — not assert that it probably matches. This is that parse.

## Generate the parser, don't write it

There's a quiet flaw in every parser I just hand-wrote: nothing actually ties its runtime checks to the type it claims to return. `parseOrder` promises an `Order`, but the `typeof` ladder inside it is kept honest by my attention and nothing else — add a field to `Order`, forget the matching check, and the `ok(...)` at the end casts the gap away without a word. One parser you can hold in your head. A whole app's worth of them, quietly drifting out of sync with the types they promise, is a bug farm.

So don't write the parser — describe the shape once, and let a tool derive both the type _and_ the check from that single description:

```ts
import { z } from "zod";

const Base = z.object({
  id: z.string(),
  customer: z.string(),
  total: z.number(),
  placedAt: z.string(),
});

const OrderSchema = z.discriminatedUnion("status", [
  Base.extend({ status: z.literal("pending") }),
  Base.extend({ status: z.literal("shipped"), trackingNumber: z.string() }),
  Base.extend({ status: z.literal("delivered"), trackingNumber: z.string(), deliveredAt: z.string() }),
  Base.extend({ status: z.literal("cancelled"), reason: z.string() }),
]);

type Order = z.infer<typeof OrderSchema>; // the exact union we hand-wrote last piece

const parsed = OrderSchema.safeParse(raw); // Result-shaped: { success } | { success: false; error }
```

Now there's one source of truth for the shape: `z.infer` reads the type _off_ the schema and `safeParse` is the parser _from_ it, so the two can't disagree — there's a single thing to edit. **[zod](https://zod.dev/)** is what most people reach for; **[valibot](https://valibot.dev/)** spells the same idea in a fraction of the bundle when that weight matters on the client. The schema is a convenience, though, not the lesson. The lesson is the boundary — untrusted input parsed into an honest type exactly once, at the edge — and a schema is just the least error-prone way to write that down.

## Parse at the edge, not everywhere

The failure mode here is turning "parse at the boundary" into "parse everywhere," which is just validation wearing a schema. If you find yourself re-running `OrderSchema.parse` in a component three layers deep on data that already came through the boundary, stop — you've re-introduced the fifteen checks with more ceremony. The entire payoff is that the interior _doesn't_ re-verify, because the types already guarantee it. Parse at the seams where untrusted data actually enters — the fetch, the form, the storage read — and let the honest types carry it from there. Don't brand every string into a nominal type, either; a `customer` name that has no invalid values to exclude gains nothing from a `Brand` but noise. Reach for precision where a value has states worth ruling out, not as a reflex on every field.

## What else lives at the boundary

Notice what that boundary actually is. The place where untrusted data crosses into your program — the `fetch`, the form submit, the storage read — is the exact same place your _side effects_ live: the network call, the DOM, the clock, the log. Parsing was just the first thing we shoved out to that thin outer edge to keep the inside pure; it won't be the last. Push the effects out there too and the core of your program becomes pure functions that only ever _decide_ what should happen, while a thin shell at the edge actually does it — parse on the way in, perform on the way out. That's where this goes next: **Effects Are Values**.

The trade is small and it's total: one honest checkpoint at the door in place of fifteen anxious ones scattered behind it. Parse the input where it enters, into a type that can't be wrong, and "is this data even real?" stops being a question the rest of your code has to keep asking — it was answered once, at the boundary, and the answer rides the type the whole way down.
