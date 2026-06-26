---
title: "Six Functional Patterns to Stop Writing Java in JavaScript"
author: Jared Schraub
pubDatetime: 2026-06-25T07:00:00Z
featured: true
tags:
  - Functional JavaScript
  - TypeScript
  - JavaScript
  - Functional Programming
description: "Six concrete moves that turn functional thinking into TypeScript you can ship on Monday — pipelines over loops, expressions over statements, immutable updates, higher-order functions, composition, and closures over classes — refactored on a real orders view."
ogImage: ../../assets/images/six-functional-patterns-banner.png
---

![Six minimalist glyphs for the functional patterns — pipeline, branch, immutability, composition, higher-order, and closure](@/assets/images/six-functional-patterns-banner.png)

In [the last piece](/posts/your-functions-arent-functions) I made a claim that probably sounded like a word game: your functions aren't functions. You write *recipes* — ordered lists of steps that do things — in a language that quietly rewards *equations*, the kind that just declare what a result is. That was the *why*. The trouble with a why is that you finish it nodding, then sit down Monday with the same cursor blinking in the same file and no idea what to actually do differently.

So this is the what-to-do. Those six tells, flipped into six moves — concrete fixes that carry the equation mindset from "nice idea" into your next pull request. Here's the part that should annoy you: you already half-know every one of them. You've called `map`. You've spread an object. You've passed a callback. You've been using these as *syntax* — little conveniences — without noticing they're the whole paradigm wearing work clothes. The shift isn't learning new tools. It's changing which tool you reach for first.

No libraries. No build changes. No becoming a Haskell monk. Just new defaults.

Throughout this series I'll keep refactoring one thing: an **orders view**. Fetch some orders, drop the dead ones, sort them, total them, render them — a screen you've built a hundred times.

```ts
type Status = "pending" | "shipped" | "delivered" | "cancelled";

type Order = {
  id: string;
  customer: string;
  total: number;
  status: Status;
  placedAt: string; // ISO timestamp
};
```

## Describe the result, not the steps

The most common Java accent in JavaScript is the hand-built loop. You want a list, so you assemble one by hand — declare an empty array, walk the input, push as you go:

```ts
const totals: number[] = [];
for (let i = 0; i < orders.length; i++) {
  if (orders[i].status !== "cancelled") {
    totals.push(orders[i].total);
  }
}
```

Every line is a step. But you didn't want steps — you wanted *the totals of the orders that aren't cancelled*. So say that:

```ts
const totals = orders.filter(o => o.status !== "cancelled").map(o => o.total);
```

`filter` and `map` aren't shorthand for the loop; they're the *equation* version of it. Each call names a transformation, the result reads left to right, and when the requirements grow a clause — "and only this quarter" — you add a step instead of rewiring an index and an off-by-one. The loop made you the machine. The pipeline lets you describe the answer and hand the machine work back to the machine.

## Compute the value, don't accumulate it

The loop's smaller cousin is the mutable variable you fill in with an `if`:

```ts
let label: string;
if (order.status === "shipped") {
  label = "On its way";
} else if (order.status === "delivered") {
  label = "Delivered";
} else {
  label = "Processing";
}
```

`label` is born empty and gets assigned from somewhere — you have to read every branch to know what it ends up as, and TypeScript can't stop you from leaving a path unset. Make it a value instead:

```ts
const STATUS_LABEL: Record<Status, string> = {
  pending: "Processing",
  shipped: "On its way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const label = STATUS_LABEL[order.status];
```

Now `label` is `const` — defined once, where you can see it — and the `Record<Status, string>` makes the compiler *reject* the code the day you add a status and forget its label. Most `let`s are an expression you haven't finished writing; the reach for one is the recipe leaking back in. (Hold onto that exhaustiveness trick. It comes back at the end with teeth.)

## Make a new value, don't mutate the old one

Here's where mutation stops being a style note and starts shipping bugs. A user marks an order shipped, and the Java instinct reaches in and changes it where it sits:

```ts
function ship(orders: Order[], index: number) {
  orders[index].status = "shipped"; // reaches into the original
}
```

In plain code that's merely risky — anyone else holding `orders` just had the ground move under them. In React it's an actual bug, because state changes are detected by *reference*, and you just changed an object without changing the reference to it:

```ts
// the order mutates, but `orders` is the same array — React may never re-render
orders[index].status = "shipped";
setOrders(orders);
```

The equation move is to produce a new value and leave the old one untouched:

```ts
const shipOrder = (orders: Order[], id: string): Order[] =>
  orders.map(o => (o.id === id ? { ...o, status: "shipped" } : o));

setOrders(prev => shipOrder(prev, id));
```

`shipOrder` is pure: same input, same output, touches nothing outside itself. React sees a brand-new array and re-renders without being asked twice; the old state is still intact for memoization, undo, and "how did we get *here*" debugging. You traded a mutation you have to trust for a value you can see.

## Pass functions, don't just call them

When a function is only ever a thing you invoke, you end up copy-pasting it with one word changed:

```ts
const pendingOrders = (orders: Order[]) => orders.filter(o => o.status === "pending");
const shippedOrders = (orders: Order[]) => orders.filter(o => o.status === "shipped");
// ...and so on, once per status
```

But a function is a *value*. You can build one on the spot and hand it back:

```ts
const byStatus = (status: Status) => (o: Order) => o.status === status;

orders.filter(byStatus("pending"));
orders.filter(byStatus("shipped"));
```

`byStatus` is a function that returns a function — the inner one *closes over* the `status` you gave it. One definition replaces the whole family, and since the result is just a predicate, it drops into `filter`, `find`, `some`, anywhere a function fits. This is the move that makes the rest of functional programming stop looking weird: once functions are values you can build and pass, handing one to `filter` is no more exotic than handing it a number.

## Name your steps, then compose them

Stack the first four moves and a pipeline can still drift into write-only — a nest you have to read inside-out:

```ts
const summary = sumTotals(newestFirst(activeOrders(orders)));
```

To follow that you start in the middle and work outward. Name each transformation as its own function, and the nest becomes a sequence of steps you can read, test, and reuse on their own:

```ts
const activeOrders = (orders: Order[]) => orders.filter(o => o.status !== "cancelled");
const newestFirst = (orders: Order[]) => [...orders].sort((a, b) => b.placedAt.localeCompare(a.placedAt));
const sumTotals = (orders: Order[]) => orders.reduce((sum, o) => sum + o.total, 0);
```

(Note the `[...orders]` — even `sort` mutates in place, so you copy first. Old habits hide in the standard library.) You already compose every time you chain `.filter().map()`; this is the same move with the steps pulled out and named. To read standalone functions in order instead of inside-out, a four-line `pipe` does it:

```ts
const pipe = <T>(value: T, ...fns: Array<(x: T) => T>): T =>
  fns.reduce((acc, fn) => fn(acc), value);

const prepared = pipe(orders, activeOrders, newestFirst); // Order[] in, Order[] out
const summary = sumTotals(prepared);
```

Composition is just that: small, honest functions snapped together, the output of one becoming the input of the next. That hand-rolled `pipe` only types cleanly while the type stays the same the whole way through — the moment a step turns `Order[]` into a `number`, you want a real one. Ramda, lodash/fp, and Effect's `pipe` are the fully-typed versions, but you don't need them to start, and method chaining carries most days on its own.

## Reach for a closure, not a class

The deepest Java habit isn't in any one line — it's the class. If you came up in OO, your instinct for "a thing that holds state *and* behavior" is a class, with `this`, a constructor, and handlers you have to remember to bind:

```ts
class OrdersView extends React.Component<Props, State> {
  state: State = { orders: [], filter: "all" };

  constructor(props: Props) {
    super(props);
    this.handleShip = this.handleShip.bind(this);
  }

  handleShip(id: string) {
    this.setState(prev => ({ orders: shipOrder(prev.orders, id) }));
  }

  render() {
    return <OrderList orders={this.state.orders} onShip={this.handleShip} />;
  }
}
```

Half of that is ceremony — `this`, `super`, the bind that fails silently if you forget it — and none of it is your feature. The function version throws the ceremony out:

```ts
function OrdersView({ initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders);

  const handleShip = (id: string) => setOrders(prev => shipOrder(prev, id));

  return <OrderList orders={orders} onShip={handleShip} />;
}
```

No `this`, no constructor, no binding. `handleShip` is a plain closure over the state it needs, and the real logic — `shipOrder` — is the pure function from earlier, testable without ever mounting a component. Hooks aren't a quirky API to memorize; they're closures doing the job a class used to do. The class made state-plus-behavior *a thing you instantiate*. The closure makes it what it always was: values, and the functions that transform them.

## Put the six together

No single move earns its keep alone; the point is what they do combined. Here's the summary an orders dashboard needs, written the way you'd reach for it in Java — one loop doing four jobs at once, a running total, an array sorted in place:

```ts
function summarize(orders: Order[]) {
  let total = 0;
  const active: Order[] = [];
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].status !== "cancelled") {
      active.push(orders[i]);
      total += orders[i].total;
    }
  }
  active.sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1)); // sorts in place
  return { active, total, count: active.length };
}
```

To know what that returns you have to *run* it in your head — track `total` and `active` as the loop turns. Here's the same summary built from the named steps we already have:

```ts
const summarize = (orders: Order[]) => {
  const active = newestFirst(activeOrders(orders));
  return { active, total: sumTotals(active), count: active.length };
};
```

Every line is one of the moves. `activeOrders` and `newestFirst` describe the result instead of assembling it; each returns a new value instead of mutating one; `sumTotals` folds with a function you handed it; and the whole thing is three small pieces composed, each testable on its own. Drop it into the component and the last move falls out for free — a closure over props, no `this` in sight:

```ts
function OrdersDashboard({ orders }: { orders: Order[] }) {
  const { active, total, count } = summarize(orders);
  return <Summary orders={active} total={total} count={count} />;
}
```

The imperative version wasn't *wrong*. It was a recipe — something you have to execute to understand. The functional one is closer to a statement of what the summary *is*.

## When a loop is just a loop

Now the honesty, because a pattern you can't say no to is a religion, not a tool. None of these are laws. A `for...of` loop is perfectly clear, and in a genuinely hot path — tens of thousands of items, every frame — the intermediate arrays `map` and `filter` allocate can matter, so measure before you care. Immutability isn't free either: spreading a large object on every keystroke has a cost, which is the exact niche Immer fills. And composition curdles fast — a value piped through nine point-free helpers is as write-only as the nest you were escaping. The goal was never a purity score. It's to make the equation your *default* reach, and to step off it deliberately, out loud, when the situation pays you to.

## One last move: let the type carry the failure

There's a seventh move I've been holding back, because it's the bridge to everything after this. Look at what you do when an order might not be there:

```ts
function findOrder(orders: Order[], id: string): Order | null {
  return orders.find(o => o.id === id) ?? null;
}

const order = findOrder(orders, id);
if (order === null) {
  // ...handle it, if you remembered to
}
```

`Order | null` says *something might be missing* but not *what went wrong*, and nothing forces the caller to check. Forget the `if`, and the bug ships. Let the return type carry the outcome instead:

```ts
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function findOrder(orders: Order[], id: string): Result<Order, "not_found"> {
  const found = orders.find(o => o.id === id);
  return found ? { ok: true, value: found } : { ok: false, error: "not_found" };
}

const result = findOrder(orders, id);
switch (result.ok) {
  case true:
    return renderOrder(result.value);
  case false:
    return renderMissing(result.error);
}
```

Same exhaustiveness from the label trick, now load-bearing: the type splits into success and failure, and the compiler won't let you handle one and forget the other. This is the doorway. On its own a `Result` is just a tidy return type — but make every fallible step return one and they start to *chain*: a whole pipeline of things-that-might-fail flowing through without a single `try/catch`. That's the next piece — [**Errors Are Values**](/posts/errors-are-values).

You walked in writing recipes. Six moves later your code describes results, hides nothing, passes functions around like the values they are, and lets its types tell the truth. That's not a tidier way to write Java. It's a different language — the one you were typing all along.
