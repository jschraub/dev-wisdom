---
title: "Stop Building Spread Pyramids: Composable Focus in TypeScript"
author: Jared Schraub
pubDatetime: 2026-09-08T13:00:00Z
draft: true
tags:
  - Functional JavaScript
  - TypeScript
  - JavaScript
  - Functional Programming
  - Immutability
  - Optics
  - Lenses
  - React
  - State Management
  - Web Development
description: "Changing one string five levels down means rebuilding every object on the way back up, by hand, in a pyramid of spreads where the bug is never in the value you meant to change. A lens turns that path into a value you can name, compose, and reuse, and the pyramid collapses to one line."
ogImage: ../../assets/images/stop-building-spread-pyramids-banner.png
---

![A stack of precisely aligned glass lens elements focusing a single luminous beam down through many layers onto one small glowing point, with the surrounding layers left dark and untouched](@/assets/images/stop-building-spread-pyramids-banner.png)

At the end of [the state piece](/posts/state-is-a-fold-over-events) I shipped a reducer with a case I openly admitted I didn't like:

```ts
case "note_edited":
  return {
    ...state,
    drafts: {
      ...state.drafts,
      [event.id]: { ...state.drafts[event.id], note: event.note },
    },
  };
```

Three spreads to change one string. It is correct. It is also the only case in that reducer where I have to count braces before I believe it. I said there was a cleaner way to reach that deep and that it would get a piece of its own. This is the piece.

Three levels is the version you can still defend. Nobody ships three levels and calls it a crisis. What ships is what happens six months later, when the orders view grows a settings panel, because every internal tool eventually grows a settings panel:

```ts
type ViewSettings = {
  notifications: {
    channels: {
      email: { enabled: boolean; address: string; digest: "daily" | "instant" };
      slack: { enabled: boolean; webhook: string };
    };
    quietHours: { start: number; end: number };
  };
  table: { density: "compact" | "comfortable" };
};
```

Now a user flips the email digest from daily to instant. One word, five levels down. Here is the update, immutably, the way you have written it a hundred times:

```ts
const setDigest = (state: ViewState, digest: "daily" | "instant"): ViewState => ({
  ...state,
  settings: {
    ...state.settings,
    notifications: {
      ...state.settings.notifications,
      channels: {
        ...state.settings.notifications.channels,
        email: { ...state.settings.notifications.channels.email, digest },
      },
    },
  },
});
```

Count what is actually in there. One assignment that means something, and five acts of clerical copying. Then read it again and find the bug you would never catch in review: nothing stops you writing `...state.settings.notifications` in the `channels` position. The shapes are close enough that TypeScript will let some of those transpositions through, and the failure mode is a settings panel that quietly forgets your Slack webhook.

## You are hand-writing the rebuild

The pyramid is not a style problem. It is the mechanism, showing through.

An immutable update cannot change the leaf, so it makes a new leaf. But the object holding that leaf now has to point at the new one, so it has to be new too. And its parent. All the way up. Changing one value five levels down means constructing six new objects: the leaf and every ancestor on the path back to the root. Everything hanging off to the side, the Slack config, the quiet hours, the table density, the drafts, is untouched and gets shared by reference rather than copied.

That walk down and back up is a real operation with a real shape, and your spread pyramid is that operation transcribed by hand, one brace at a time.

<svg viewBox="0 0 760 380" role="img" aria-labelledby="uturn-t uturn-d" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;border-radius:12px;background:#0b1d2c;display:block;margin:1.5rem 0"><title id="uturn-t">An immutable update walks down the path and rebuilds on the way back up</title><desc id="uturn-d">A vertical chain of five nodes runs from state down through settings, notifications, channels, to email, ending at the digest leaf. A blue arrow descends the left side labelled get, walking down to the value. A green arrow ascends the right side labelled set, rebuilding each node on the path, with every node on the chain marked new. Branches to the right of each node, drafts, table, quiet hours and slack, are drawn with dashed connectors labelled shared, not copied.</desc><defs><pattern id="uturn-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#16324a" stroke-width="1"/></pattern></defs><rect width="760" height="380" fill="url(#uturn-grid)" opacity="0.6"/><g font-family="ui-monospace,monospace" font-size="12" text-anchor="middle"><rect x="215" y="28" width="150" height="34" rx="8" fill="#0b3a5e" stroke="#5ad19a" stroke-width="1.5"/><text x="290" y="50" fill="#c8d6e2">state</text><rect x="215" y="90" width="150" height="34" rx="8" fill="#0b3a5e" stroke="#5ad19a" stroke-width="1.5"/><text x="290" y="112" fill="#c8d6e2">settings</text><rect x="215" y="152" width="150" height="34" rx="8" fill="#0b3a5e" stroke="#5ad19a" stroke-width="1.5"/><text x="290" y="174" fill="#c8d6e2">notifications</text><rect x="215" y="214" width="150" height="34" rx="8" fill="#0b3a5e" stroke="#5ad19a" stroke-width="1.5"/><text x="290" y="236" fill="#c8d6e2">channels</text><rect x="215" y="276" width="150" height="34" rx="8" fill="#0b3a5e" stroke="#5ad19a" stroke-width="1.5"/><text x="290" y="298" fill="#c8d6e2">email</text><rect x="228" y="332" width="124" height="30" rx="12" fill="#0f2436" stroke="#e0875a" stroke-width="1.5"/><text x="290" y="352" fill="#e0875a" font-size="11.5">digest</text></g><g stroke="#5ad19a" stroke-width="1.5"><line x1="290" y1="62" x2="290" y2="90"/><line x1="290" y1="124" x2="290" y2="152"/><line x1="290" y1="186" x2="290" y2="214"/><line x1="290" y1="248" x2="290" y2="276"/><line x1="290" y1="310" x2="290" y2="332"/></g><g stroke="#8aa0b4" stroke-width="1.2" stroke-dasharray="4 4"><line x1="365" y1="45" x2="470" y2="45"/><line x1="365" y1="107" x2="470" y2="107"/><line x1="365" y1="169" x2="470" y2="169"/><line x1="365" y1="231" x2="470" y2="231"/></g><g font-family="ui-monospace,monospace" font-size="11" text-anchor="start" fill="#8aa0b4"><rect x="470" y="30" width="118" height="30" rx="8" fill="none" stroke="#8aa0b4" stroke-width="1.2" opacity="0.7"/><text x="486" y="49">drafts</text><rect x="470" y="92" width="118" height="30" rx="8" fill="none" stroke="#8aa0b4" stroke-width="1.2" opacity="0.7"/><text x="486" y="111">table</text><rect x="470" y="154" width="118" height="30" rx="8" fill="none" stroke="#8aa0b4" stroke-width="1.2" opacity="0.7"/><text x="486" y="173">quietHours</text><rect x="470" y="216" width="118" height="30" rx="8" fill="none" stroke="#8aa0b4" stroke-width="1.2" opacity="0.7"/><text x="486" y="235">slack</text></g><text x="600" y="139" text-anchor="start" fill="#8aa0b4" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11" font-style="italic">shared,</text><text x="600" y="154" text-anchor="start" fill="#8aa0b4" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11" font-style="italic">not copied</text><path d="M150 36 v300" fill="none" stroke="#46b0e6" stroke-width="2"/><polygon points="144,330 156,330 150,344" fill="#46b0e6"/><text x="138" y="180" text-anchor="middle" fill="#46b0e6" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" transform="rotate(-90 138 180)">get: walk down to the value</text><path d="M400 344 v-300" fill="none" stroke="#5ad19a" stroke-width="2"/><polygon points="394,50 406,50 400,36" fill="#5ad19a"/><text x="416" y="196" text-anchor="middle" fill="#5ad19a" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" transform="rotate(-90 416 196)">set: rebuild every node on the way back</text><text x="380" y="376" text-anchor="middle" fill="#8aa0b4" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" font-style="italic">one new leaf costs five new parents · the spread pyramid is you writing them out by hand</text></svg>

The bug is never in the value you meant to change. It is in the transcription. So stop transcribing.

## A focus you can hold

Here is the whole idea, and it is smaller than the problem it solves. A path into a structure is two functions that agree with each other: one that reads the value out, one that puts a new value back.

```ts
type Lens<S, A> = {
  get: (s: S) => A;
  set: (a: A, s: S) => S;
};

const lens = <S, A>(get: (s: S) => A, set: (a: A, s: S) => S): Lens<S, A> => ({ get, set });
```

`S` is the structure, `A` is the thing you are pointing at. That pair is called a **lens**, and the name is the good kind of literal: it focuses on one part of a bigger thing without losing the rest.

Almost every lens you will ever write points at one property, so write that one once:

```ts
const prop = <S, K extends keyof S>(key: K): Lens<S, S[K]> =>
  lens(
    s => s[key],
    (a, s) => ({ ...s, [key]: a })
  );
```

That is the only spread in this entire piece. Every copy that follows comes from that line, written once, tested once.

Reading and writing are not what you actually do to state, though. What you do is *change* it, based on what is already there. That is one more function:

```ts
const modify =
  <S, A>(l: Lens<S, A>, f: (a: A) => A) =>
  (s: S): S =>
    l.set(f(l.get(s)), s);
```

Read the body against the diagram. `l.get(s)` is the walk down. `f` is the one thing you meant to do. `l.set` is the rebuild back up. The shape of the operation, which the pyramid had smeared across fourteen lines, is now three.

## Snap two focuses together

One property deep is not the problem. Five is. And this is where a lens stops being a tidier setter and starts being worth the page: because a lens is a value, two of them join into a third.

```ts
const compose = <S, A, B>(outer: Lens<S, A>, inner: Lens<A, B>): Lens<S, B> =>
  lens(
    s => inner.get(outer.get(s)),
    (b, s) => outer.set(inner.set(b, outer.get(s)), s)
  );
```

The getter reads left to right. The setter is the U-turn again, in miniature: set the inner value, then set that result back into the outer. Every level of the pyramid you were writing by hand is this function, applied once more.

<svg viewBox="0 0 760 260" role="img" aria-labelledby="chain-t chain-d" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;border-radius:12px;background:#0b1d2c;display:block;margin:1.5rem 0"><title id="chain-t">Composing lenses end to end</title><desc id="chain-d">Four lens segments sit in a row, labelled settings, notifications, channels and email. Type labels at each joint read ViewState, ViewSettings, Notifications, Channels and Email, so the output type of each segment is the input type of the next. Below them a single wide bar spans the whole row, labelled emailLens, running from ViewState on the left to Email on the right.</desc><defs><pattern id="chain-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#16324a" stroke-width="1"/></pattern></defs><rect width="760" height="260" fill="url(#chain-grid)" opacity="0.6"/><g font-family="ui-monospace,monospace" font-size="11.5" text-anchor="middle"><rect x="60" y="70" width="140" height="40" rx="8" fill="#0b3a5e" stroke="#46b0e6" stroke-width="1.5"/><text x="130" y="95" fill="#c8d6e2">settings</text><rect x="215" y="70" width="150" height="40" rx="8" fill="#0b3a5e" stroke="#46b0e6" stroke-width="1.5"/><text x="290" y="95" fill="#c8d6e2">notifications</text><rect x="380" y="70" width="140" height="40" rx="8" fill="#0b3a5e" stroke="#46b0e6" stroke-width="1.5"/><text x="450" y="95" fill="#c8d6e2">channels</text><rect x="535" y="70" width="130" height="40" rx="8" fill="#0b3a5e" stroke="#46b0e6" stroke-width="1.5"/><text x="600" y="95" fill="#c8d6e2">email</text></g><g stroke="#46b0e6" stroke-width="1.5"><line x1="200" y1="90" x2="215" y2="90"/><line x1="365" y1="90" x2="380" y2="90"/><line x1="520" y1="90" x2="535" y2="90"/></g><g font-family="ui-monospace,monospace" font-size="10.5" text-anchor="middle" fill="#8aa0b4"><text x="60" y="58">ViewState</text><text x="207" y="58">ViewSettings</text><text x="372" y="58">Notifications</text><text x="527" y="58">Channels</text><text x="665" y="58">Email</text></g><g stroke="#8aa0b4" stroke-width="1" stroke-dasharray="3 3" opacity="0.6"><line x1="60" y1="64" x2="60" y2="70"/><line x1="207" y1="64" x2="207" y2="70"/><line x1="372" y1="64" x2="372" y2="70"/><line x1="527" y1="64" x2="527" y2="70"/><line x1="665" y1="64" x2="665" y2="70"/></g><rect x="60" y="150" width="605" height="44" rx="10" fill="#0b3a5e" stroke="#5ad19a" stroke-width="1.8"/><text x="362" y="177" text-anchor="middle" fill="#5ad19a" font-family="ui-monospace,monospace" font-size="12.5">emailLens</text><g stroke="#5ad19a" stroke-width="1.5"><line x1="130" y1="110" x2="130" y2="150"/><line x1="290" y1="110" x2="290" y2="150"/><line x1="450" y1="110" x2="450" y2="150"/><line x1="600" y1="110" x2="600" y2="150"/></g><g font-family="ui-monospace,monospace" font-size="10.5" fill="#8aa0b4"><text x="60" y="212" text-anchor="start">ViewState</text><text x="665" y="212" text-anchor="end">Email</text></g><text x="362" y="240" text-anchor="middle" fill="#8aa0b4" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" font-style="italic">the types line up at every joint, so four focuses are one focus</text></svg>

So build the path once, name it, and keep it:

```ts
const emailLens = compose(
  compose(
    compose(
      prop<ViewState, "settings">("settings"),
      prop<ViewSettings, "notifications">("notifications")
    ),
    prop<ViewSettings["notifications"], "channels">("channels")
  ),
  prop<ViewSettings["notifications"]["channels"], "email">("email")
);
```

And the fourteen-line pyramid becomes the line it always wanted to be:

```ts
const setDigest = (state: ViewState, digest: "daily" | "instant") =>
  modify(emailLens, e => ({ ...e, digest }))(state);
```

`emailLens` is not a helper for this one update. It is the location itself, promoted to a value. Any code that needs the email settings, to read them, to toggle `enabled`, to correct the address, takes the same path and cannot spell it differently, because there is only one spelling now. The old helpers each knew a route. This one *is* the route.

## The draft that might not be there

Now back to the case that started this. `state.drafts` is a `Record<string, Draft>`, and the draft for an order may simply not exist yet. A lens promises a value is there. This one cannot.

That is [`Option` from the errors piece](/posts/errors-are-values), arriving exactly where you would expect: a value with no story to tell about its absence. So the focus gets an honest type.

```ts
type Optional<S, A> = {
  getOption: (s: S) => Option<A>;
  set: (a: A, s: S) => S;
};

const at = <A>(key: string): Optional<Record<string, A>, A> => ({
  getOption: r => (key in r ? { some: true, value: r[key] } : { some: false }),
  set: (a, r) => ({ ...r, [key]: a }),
});
```

And a `modify` that does nothing when there is nothing to modify:

```ts
const modifyOptional =
  <S, A>(o: Optional<S, A>, f: (a: A) => A) =>
  (s: S): S => {
    const focus = o.getOption(s);
    return focus.some ? o.set(f(focus.value), s) : s;
  };
```

Compose a lens with an optional and you get an optional, because a maybe-missing step anywhere in the path makes the whole path maybe-missing. It is the same U-turn as before, carrying an `Option` on the way down:

```ts
const composeOptional = <S, A, B>(outer: Lens<S, A>, inner: Optional<A, B>): Optional<S, B> => ({
  getOption: s => inner.getOption(outer.get(s)),
  set: (b, s) => outer.set(inner.set(b, outer.get(s)), s),
});
```

```ts
const draftOf = (id: string) => composeOptional(prop<ViewState, "drafts">("drafts"), at<Draft>(id));

case "note_edited":
  return modifyOptional(draftOf(event.id), d => ({ ...d, note: event.note }))(state);
```

One line, and I no longer count braces. But notice what the optional just forced into the open. The original spread had `...state.drafts[event.id]` on a key that might be missing, which spreads `undefined` into an empty object and quietly *creates* the draft. Was that the intent, or an accident nobody noticed? The pyramid did not make you answer. The optional does, because "edit it if it is there" and "create it if it is not" are now two different pieces of code. If you want the creating version, you want a lens with a default, not an optional. Either is fine. Choosing on purpose is the point.

## Every draft at once

One more shape shows up constantly and has no business being a loop. The user hits "discard all notes", and you need to touch every draft rather than one.

```ts
type Traversal<S, A> = {
  modifyAll: (f: (a: A) => A, s: S) => S;
};

const eachValue = <A>(): Traversal<Record<string, A>, A> => ({
  modifyAll: (f, r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, f(v)])),
});

const composeTraversal = <S, A, B>(outer: Lens<S, A>, inner: Traversal<A, B>): Traversal<S, B> => ({
  modifyAll: (f, s) => outer.set(inner.modifyAll(f, outer.get(s)), s),
});

const everyDraft = composeTraversal(prop<ViewState, "drafts">("drafts"), eachValue<Draft>());

const clearNotes = (state: ViewState) =>
  everyDraft.modifyAll(d => ({ ...d, note: undefined }), state);
```

A lens focuses one thing that is definitely there. An optional focuses one thing that might be. A traversal focuses however many are there, including none. Same two jobs each time, reading and rebuilding, with the count of targets as the only difference.

## Immer already writes the pyramid for you

Here is the objection I would raise if I were reading this, and it is a good one.

React developers have a tool for exactly this pain, and it is not lenses. It is [Immer](https://immerjs.github.io/immer/), and it deletes the pyramid without any of the above:

```ts
const setDigest = (state: ViewState, digest: "daily" | "instant") =>
  produce(state, draft => {
    draft.settings.notifications.channels.email.digest = digest;
  });
```

You write a mutation, Immer hands you a proxy, and you get a correctly structure-shared immutable copy out the other side. If your problem is the fourteen lines, that is the answer, and most React teams should reach for it. I am not going to pretend otherwise to protect my thesis. Redux Toolkit ships it by default for good reason.

What Immer gives you is a better way to *perform* the update. What it does not give you is the path as a thing. `draft.settings.notifications.channels.email` is a sequence of keystrokes inside one callback. You cannot name it, pass it to a function, store it in a map of "settings this feature owns", hand it to a generic form component that reads and writes wherever you point it, or write a helper that takes a focus and returns a bound input handler. You cannot use it to read, only to write. Every place that needs that path types it again, and typing it again is what put the transposition bug in the pyramid in the first place.

Immer fixes the ceremony. A lens fixes the duplication. Reach for Immer when the update is the whole problem. Reach for a lens when the same location shows up in six files.

## Where the tax is real

Two honest limits, and the second one is worse than the evangelists admit.

Shallow updates do not need any of this. `{ ...state, statusFilter: status }` is one line, it is obvious, and wrapping it in a lens makes it longer and less clear. A focus earns its keep at depth, at repetition, or when it needs to be passed around. One level, one caller, no lens.

The bigger tax is inference. Read that `emailLens` again and notice every `prop` call carries explicit type arguments. That is not me being pedantic. Drop them and this is what you get:

```ts
const notifications = compose(prop("settings"), prop("notifications"));
//                                   ~~~~~~~~~~
// error TS2345: Argument of type '"settings"' is not assignable to parameter of type 'never'.
```

TypeScript cannot infer `S` for the first `prop` from the composition it is about to take part in, so `keyof S` collapses to `never` and the key you passed is rejected. The fix is to annotate, and you annotate at every level, which means the deeper the path the more type noise you write to describe a path you already spelled out. This is the same wall [the hand-rolled `pipe`](/posts/six-functional-patterns) hit two pieces into this series, for the same reason, and it is why the real optics libraries exist. `optics-ts` and `monocle-ts` solve it with heavy type machinery and a builder syntax, and they pay for it in compile time and in error messages you will need a quiet afternoon to read. Try them on one deep path before you convert a codebase.

## You have been using optics

The three things above are not three tricks. They are one family, and it has a name: **optics**. A lens, an optional, and a traversal are its most useful members, distinguished only by how many targets they focus.

And they are held to laws, in the sense [the opening piece](/posts/your-functions-arent-functions) meant when it said the language wants equations rather than recipes. Two of them, for a lens:

```ts
l.set(l.get(s), s) === s        // put back what you took, and nothing happened
l.get(l.set(a, s)) === a        // take what you just put, and get it back
```

Read them as what they are. A lens is not a convention about how to write setters. It is a claim about behaviour that either holds or does not, and if it holds for two lenses, it holds for their composition. That is the whole reason `compose` is safe to apply four times without thinking. The equations compose, so the code composes.

## The laws are testable, so test them

Look at those two lines once more, because they are not documentation. They are executable claims, quantified over every `s` and every `a` you could ever pass, which means the three examples you would write by hand cover a rounding error's worth of the cases they assert.

That goes well beyond lenses. The reducer from the state piece has laws too. So does the parser from the boundary piece. So does every pure function this series has built, and purity is precisely the property that makes those claims checkable by a machine instead of by you, at a scale you would never reach with hand-picked inputs. You state the law. Something else goes looking for the input that breaks it, and hands you the smallest version of the story.

That is the next piece: [**Break Your Own Code First**](/posts/break-your-own-code-first).

Until then, the next time you find yourself four spreads deep, stop and ask what you are actually writing. Not an update. A route, transcribed from memory, for the eleventh time. Write the route down once and give it a name. The pyramid was never the cost of immutability. It was the cost of not naming where you were going.
