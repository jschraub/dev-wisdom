---
title: "Your Functions Aren't Functions: Why JavaScript Punishes Your Java Habits"
author: Jared Schraub
pubDatetime: 2026-06-20T12:00:00Z
featured: true
tags:
  - Functional JavaScript
  - TypeScript
  - JavaScript
  - Functional Programming
description: "The word 'function' means two different things, and the one you learned in Java is the one TypeScript keeps punishing. A pragmatic case for thinking in equations, not recipes."
ogImage: ../../assets/images/your-functions-arent-functions-banner.png
---

![A tangle of gears resolving into a clean function machine that maps inputs to outputs](@/assets/images/your-functions-arent-functions-banner.png)

I spent a semester in college actively resenting functional programming.

It was taught in a language nobody I knew had ever shipped a line of — all parentheses and recursion and toy problems with no stakes. The professor kept talking about functions as mathematical objects, and by that point I'd been doing algebra for the better part of a decade. It felt like being marched back to a class I'd already passed. Old. Abstract. Boring. I filed it under "academic," wrote my imperative loops, and got on with learning to build things that actually did something.

I was wrong. But not for the reason you'd expect.

It wasn't that the math was too hard. It was that the math was too _familiar_ — so familiar I assumed there was nothing left in it to learn. School took the one genuinely practical idea in the whole subject and buried it under a fog of theory, and a twenty-year-old me shrugged and walked right past it.

Here's the idea, fog removed:

> Remember $y = 2x + 1$? That's a pure function. You've understood functional programming since middle school. They just dressed it in parentheses and called it theory.

That's the whole thing. The rest of this — and the rest of this series — is what happens when you take that one idea seriously in a language that was secretly built around it. I'm not going to ask you to learn category theory, rewrite your codebase, or become a Haskell monk. I'm going to show you that you already know more than you think you do, and that the thing you've been fighting was on your side the entire time.

## Two different words, spelled the same

The word "function" is doing double duty, and almost nobody points it out.

There's the _mathematical_ function — $f(x) = x^2 + 1$. It declares an equality. It says what $f(x)$ _is_: a fixed relationship between an input and an output. Give it the same $x$, you get the same answer, every time, forever. There are no steps. There's no "first do this, then that." There's no clock and no memory. It's a statement about what something equals.

Then there's the _other_ function — the one you learned if you came up through Java or C#. A subroutine. A recipe. A list of instructions: take these arguments, do this, mutate that, log something, maybe return a value. Run it twice and it might do two different things, depending on what the world looked like each time.

Same word. Nearly opposite ideas. One describes _what_; the other prescribes _how_.

JavaScript will happily let you write recipes all day long. But the language — and modern TypeScript especially — rewards the other kind. The equation kind. And when you write recipes in a language that wants equations, you spend your days fighting it without quite knowing why.

You can feel it in the tells.

## The tells you're writing Java in JavaScript

The first three are one reflex in three outfits — you spell out _how_ to assemble a result instead of saying _what_ it is.

**You reach for a loop when you mean a transformation.** You build the list by hand when what you wanted was a transformed one:

```ts
const names = [];
for (let i = 0; i < users.length; i++) {
  if (users[i].active) names.push(users[i].name);
}
```

The loop spells out the steps. But you didn't want steps — you wanted _the active users' names_:

```ts
const names = users.filter(u => u.active).map(u => u.name);
```

One is a recipe. The other is closer to an equation: a description of the result, not a procedure for assembling it.

**You spell a value out with statements instead of stating it.** You declare a variable empty and fill it in branch by branch:

```ts
let label;
if (user.active) label = "Active";
else label = "Inactive";
```

You already know the other way — JSX won't let you drop an `if` between the braces, so inside it you reach for a ternary without a second thought. That instinct _is_ the equation habit; it just stops at the edge of your markup. Let it out:

```ts
const label = user.active ? "Active" : "Inactive";
```

One states what `label` is; the other builds it up and trusts every branch to run.

**You inline and repeat instead of naming and composing.** A function is a value, so you can name each step and build bigger behavior out of small pieces. The Java instinct inlines the same logic wherever it's needed:

```ts
const activeCount = users.filter(u => u.active).length;
const activeNames = users.filter(u => u.active).map(u => u.name);
```

Name the piece once and compose the rest from it:

```ts
const active = (users: User[]) => users.filter(u => u.active);

const activeCount = active(users).length;
const activeNames = active(users).map(u => u.name);
```

Small, named, reusable — the big behavior is just small behaviors snapped together.

**You hide state in mutation.** A recipe changes things as it goes, so you mutate — push onto arrays, reassign a `let`, flip a flag inside one branch of an `if`. Every mutation is the recipe leaking out into the world. The equation habit is the opposite: don't change the value, produce a new one.

```ts
// recipe: mutate in place
cart.items.push(newItem);

// equation: a new value
const updated = { ...cart, items: [...cart.items, newItem] };
```

**You treat functions as things you call, not things you have.** In Java-brain, a function is something you invoke. In equation-land, a function is a _value_ — as nameable, passable, and reusable as a number or a string. The day that clicks is the day half of "the functional stuff" stops looking weird, because handing a function to `filter` is no different from handing it anywhere else:

```ts
const isActive = (u: User) => u.active;
users.filter(isActive);
```

**You reach for a class when a closure would do.** If you came up through OO, "state plus behavior" means a class — `this`, a constructor, methods you remember to bind. But a function already closes over the state it needs, which is exactly why React swapped class components for hooks:

```ts
// recipe: state lives on an instance, reached through `this`
class Counter extends Component {
  state = { n: 0 };
  bump = () => this.setState(s => ({ n: s.n + 1 }));
}

// equation: state lives in a closure, no `this` in sight
function Counter() {
  const [n, setN] = useState(0);
  const bump = () => setN(n => n + 1);
}
```

The class makes state-and-behavior a thing you instantiate. The closure keeps the values right next to the function that uses them.

None of these are exotic. You've written all six this week. They aren't bugs; they're an accent — the imperative language you think in, leaking through into the one you're typing.

There's a seventh habit hiding under all of them: letting your types lie. A recipe hopes nothing goes wrong and patches the gaps with defensive checks — `if (x == null)` scattered everywhere, a `try/catch` quietly doing the job of an `if`. An equation makes the shape of the result honest instead: success or failure, present or absent, written into the type so the compiler holds you to it. That one runs deep enough to [earn its own piece](/posts/errors-are-values) down the line — it's where this series is ultimately headed.

## The part school actually had right

So why does any of this matter? Here's what I didn't appreciate at twenty, and finally understood after years building systems where being wrong costs real money.

Because a mathematical function is an equation, $f(3)$ _is_ $10$. Not "evaluates to" — _is_. Which means you can do the thing you've done with algebra your whole life: substitute equals for equals. Replace a call with its result and nothing about the program changes.

That property has a name — referential transparency — and it is the entire payoff. It buys you predictability. You can read a function and know what it does without first tracing everything that ran before it. You can refactor by substitution, the way you simplify an expression. You can test a piece in isolation, because it doesn't secretly depend on the state of the world. Nothing changes behind your back.

Recipes give you none of that. A recipe's result depends on what ran first, what got mutated, what the world looked like at the exact moment it ran. That's why imperative codebases curdle into "nobody touch that file" — any change might ripple somewhere invisible, and the only way to find out is to run it and see what breaks.

I learned what that's worth at three in the morning. Years into building trading systems — where a wrong number isn't a red squiggle in the console but real money moving the wrong way — I got paged because a position had drifted out of sync. The on-call ritual never changed: walk the data backward, one function at a time, asking _what could this have returned?_ The pure functions were a relief — I could replace each call with its result on a notepad and keep moving, because a pure function's output is nothing but its inputs. The recipe functions were where the night died. Each one forced the same unanswerable question: _but what was the world holding when this ran?_ The culprit, when I finally cornered it, was exactly what you'd guess — a function quietly mutating a shared object a few calls upstream, handing every caller a different answer depending on what had run first. The math I'd written off as homework turned out to be the most practical debugging tool in the building: the functions I could reason about by substitution were the only ones I trusted at 3am. That's not purity for its own sake. That's survival.

## Reach for the equation first

You don't have to go full Haskell. You don't have to rewrite anything tonight. The shift is just a change of default — reach for the equation before the recipe:

Describe what, not how. Stop mutating. Treat functions as values. Reach for a closure, not a class.

[The next piece](/posts/six-functional-patterns) is the _how_ — the specific handful of moves that turn this from a mindset into code you can write on Monday, the ones that actually pay rent in a real TypeScript app. But the mindset has to come first, because once you see it, you can't unsee it:

You've been writing functions that aren't functions. The language hasn't been fighting you. It's been waiting for you to write the other kind.
