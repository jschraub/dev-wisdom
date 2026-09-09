---
title: "The Wrong Thing, Built Perfectly: Why Shared Understanding Comes Before Code"
author: Jared Schraub
pubDatetime: 2026-09-09T01:00:00Z
featured: true
tags:
  - Engineering With AI
  - AI Coding
  - Claude Code
  - Software Design
  - Software Engineering
  - Technical Design
  - Agentic Coding
  - Architecture
  - Engineering Leadership
description: "The expensive failure is not an agent that writes bad code. It is an agent that writes good code for the wrong design, quickly, while you nod along. The fix is an interrogation before implementation, and the questions it asks are not the ones you expect."
ogImage: ../../assets/images/the-wrong-thing-built-perfectly-banner.png
---

![Two separate dense tangles of jade lines on the left, each self-contained, their strands drawing rightward through a single narrow gold aperture and emerging as one ordered fan of evenly spaced parallel lines](@/assets/images/the-wrong-thing-built-perfectly-banner.png)

Slop announces itself. You read the function, you see the log line nobody asked for, and you reject it in ten seconds.

The expensive failure is quiet. It is a clean, well-structured, entirely reasonable implementation of a design you never agreed on, and it passes review, because there is nothing wrong with it on its own terms. The terms were wrong. The terms were never written down.

[The last piece](/posts/chat-history-isnt-a-handoff) assumed you already knew what you were building. This is the failure upstream of that one, and it is the more expensive of the two.

## You already know how to handle this

Hand a competent junior a one-line ticket and walk away and you get the same result. Not bad work. Work aimed at a target they inferred, because you never gave them one and they were not going to say so in standup. Nobody thinks the fix there is a better ticket. The fix is twenty minutes at a whiteboard before anyone writes anything, and we do that because alignment is cheaper than rework.

An agent needs it more, not less. It has no standing context about your platform, it will not push back on a bad premise out of professional pride, and it has an infinite appetite for building whatever you last described. It is the developer who never asks why. So you have to make it ask.

## The one-shot prompt and the interrogation

Here is the naive version, and it is what most people do because it works often enough to feel fine:

> Add a WebSocket gateway in front of our services with TLS termination.

That is a real instruction. An agent will act on it, and what comes back will be structurally reasonable. It will also encode a dozen decisions you never made, because the sentence does not contain them, and something had to fill the gap.

It is worth being concrete about what that costs. Given that sentence, the obvious build is a gateway that terminates TLS and proxies each connection through to the service behind it. One connection in, one out. That is a correct reading of the instruction, it is testable, and it would pass review. It would also leave the number of sockets a browser holds open exactly unchanged. We would have spent a quarter building the one component standing in the perfect position to fix our worst problem, and used it to preserve the problem.

Nothing in code review catches that. Review asks whether the code does what it was asked. The failure is in the asking.

The managed version is a different move entirely. You do not give it a target. You ask it to interrogate you until it has one, and you keep answering until the questions stop surprising you. Matt Pocock packaged this as a skill, [`grill-me`](https://github.com/mattpocock/skills), with a `grill-with-docs` variant that runs the same interrogation against your existing project documentation. The name is right. It is not a chat, it is being put under the lamp.

The mechanic is what makes these sessions feel relentless rather than chatty. It models the design as a tree and works it in rounds. The **frontier** is every decision whose prerequisites are already settled, the questions it can ask now without guessing. It asks that whole frontier, waits, and your answers push it outward. Nothing is asked out of order and nothing is quietly skipped.

The output is not code. The output is that both of you can now describe the same system.

## Two problems that turned out to be one

The session I mentioned last piece is the one worth showing here, and it is at the far end of the range. Most of mine are a fraction of it. This one earned its three hours: we were building the entry point in front of a fleet of internal services, with TLS termination, WebSocket and REST sharing a path, load spread across instances, and an in-house service registry to integrate with.

I came in with a second problem that I did not think was related.

Our platform runs a lot of small applications. A user might have forty open, each holding its own connection to every service it needs, which can be ten or more. That is four hundred-odd WebSocket connections. Chrome's ceiling is [about 255](https://websocket.org/guides/connection-limits/). So people ran a second browser, sometimes a third, splitting their applications to stay under a limit almost nobody could name.

I raised that myself, on the way in, as an aside. What the interrogation did with it was refuse to treat the two as separate projects.

Every one of those connections was going to pass through the thing we were designing. A gateway terminating TLS for all that traffic already sees every connection, and whatever sees every connection can end the fan-out. Nothing about that is clever. It is obvious, once someone makes you say both facts in the same room.

The design we took out of it: each application opens one connection to the gateway, multiplexing everything it needs over that single link, and the gateway fans out to the services behind it. Four hundred sockets per user becomes about forty.

Then the session went further, and this is the part I would not have reached alone. Those forty applications do not need forty connections, because they largely need the same services. A shared web worker can hold a connection on behalf of every application that wants it. Group the applications by the services they actually use and the count stops depending on how many applications a user opens. We could have taken it to one. We split by common service group instead, which leaves about ten connections, a number set by the shape of our services rather than by user behaviour.

That is the difference worth noticing. The first move divided the number by ten. The second move changed what the number depends on.

<svg viewBox="0 0 900 330" role="img" aria-labelledby="fanout-title fanout-desc" style="width:100%;height:auto;font-family:inherit">
  <title id="fanout-title">From a client-side mesh to a fixed number of shared connections</title>
  <desc id="fanout-desc">On the left, four application boxes each draw separate lines to four service boxes, forming a dense mesh, labelled over four hundred connections per user, scaling with apps multiplied by services, past the browser ceiling. On the right, the same four applications connect to two shared web workers grouped by the services they need. Each worker holds one connection to a gateway, highlighted in gold, which terminates TLS and fans out to the same four services. That side is labelled about ten connections, fixed by service group rather than by how many apps are open.</desc>
  <g font-size="12" text-anchor="middle">
    <text x="176" y="24" font-size="13" fill="var(--foreground, #dee4e0)" opacity="0.75">Before: every app to every service</text>
    <text x="650" y="24" font-size="13" fill="var(--foreground, #dee4e0)" opacity="0.75">After: grouped at the worker, terminated at the gateway</text>
    <g stroke="var(--foreground, #dee4e0)" stroke-opacity="0.26" stroke-width="1">
      <path d="M92 76 L250 76 M92 76 L250 120 M92 76 L250 164 M92 76 L250 208" />
      <path d="M92 120 L250 76 M92 120 L250 120 M92 120 L250 164 M92 120 L250 208" />
      <path d="M92 164 L250 76 M92 164 L250 120 M92 164 L250 164 M92 164 L250 208" />
      <path d="M92 208 L250 76 M92 208 L250 120 M92 208 L250 164 M92 208 L250 208" />
    </g>
    <g fill="var(--accent, #1a7a52)" fill-opacity="0.10" stroke="var(--accent, #1a7a52)" stroke-width="1.5">
      <rect x="24" y="62" width="68" height="28" rx="5" /><rect x="24" y="106" width="68" height="28" rx="5" />
      <rect x="24" y="150" width="68" height="28" rx="5" /><rect x="24" y="194" width="68" height="28" rx="5" />
      <rect x="250" y="62" width="76" height="28" rx="5" /><rect x="250" y="106" width="76" height="28" rx="5" />
      <rect x="250" y="150" width="76" height="28" rx="5" /><rect x="250" y="194" width="76" height="28" rx="5" />
    </g>
    <g fill="var(--foreground, #dee4e0)">
      <text x="58" y="81">app</text><text x="58" y="125">app</text><text x="58" y="169">app</text><text x="58" y="213">app</text>
      <text x="288" y="81">service</text><text x="288" y="125">service</text><text x="288" y="169">service</text><text x="288" y="213">service</text>
    </g>
    <text x="176" y="264" fill="var(--foreground, #dee4e0)" opacity="0.8">400+ per user</text>
    <text x="176" y="284" fill="var(--foreground, #dee4e0)" opacity="0.8">scales with apps × services</text>
    <line x1="378" y1="52" x2="378" y2="240" stroke="var(--foreground, #dee4e0)" stroke-opacity="0.18" stroke-width="1" />
    <g stroke="var(--accent, #1a7a52)" stroke-width="1.2" stroke-opacity="0.8">
      <path d="M478 76 L520 106 M478 120 L520 116 M478 164 L520 178 M478 208 L520 188" />
      <path d="M716 141 L760 76 M716 141 L760 120 M716 141 L760 164 M716 141 L760 208" />
    </g>
    <g stroke="var(--gold, #d9a944)" stroke-width="1.8">
      <path d="M598 118 L642 136 M598 186 L642 148" />
    </g>
    <g fill="var(--accent, #1a7a52)" fill-opacity="0.10" stroke="var(--accent, #1a7a52)" stroke-width="1.5">
      <rect x="410" y="62" width="68" height="28" rx="5" /><rect x="410" y="106" width="68" height="28" rx="5" />
      <rect x="410" y="150" width="68" height="28" rx="5" /><rect x="410" y="194" width="68" height="28" rx="5" />
      <rect x="520" y="96" width="78" height="40" rx="5" /><rect x="520" y="164" width="78" height="40" rx="5" />
      <rect x="760" y="62" width="76" height="28" rx="5" /><rect x="760" y="106" width="76" height="28" rx="5" />
      <rect x="760" y="150" width="76" height="28" rx="5" /><rect x="760" y="194" width="76" height="28" rx="5" />
    </g>
    <rect x="642" y="116" width="74" height="50" rx="6" fill="var(--gold, #d9a944)" fill-opacity="0.16" stroke="var(--gold, #d9a944)" stroke-width="2" />
    <g fill="var(--foreground, #dee4e0)">
      <text x="444" y="81">app</text><text x="444" y="125">app</text><text x="444" y="169">app</text><text x="444" y="213">app</text>
      <text x="559" y="112" font-size="11">shared</text><text x="559" y="126" font-size="11">worker</text>
      <text x="559" y="180" font-size="11">shared</text><text x="559" y="194" font-size="11">worker</text>
      <text x="679" y="138">gateway</text><text x="679" y="154" font-size="11">TLS</text>
      <text x="798" y="81">service</text><text x="798" y="125">service</text><text x="798" y="169">service</text><text x="798" y="213">service</text>
    </g>
    <text x="650" y="264" fill="var(--foreground, #dee4e0)" opacity="0.8">about 10 per user</text>
    <text x="650" y="284" fill="var(--foreground, #dee4e0)" opacity="0.8">fixed by service group, not by apps open</text>
    <text x="450" y="316" font-size="11.5" fill="var(--foreground, #dee4e0)" opacity="0.65" font-style="italic">the first move divided the number · the second changed what it depends on</text>
  </g>
</svg>

No amount of prompt engineering gets you there. The instruction I would have written on my own says nothing about sockets, because on my own I was solving TLS.

## It does not ask you what it can look up

I have been describing this as an interrogation, which makes it sound like everything happens inside my head. It does not, and the skill is explicit about why. From its instructions:

> Finding *facts* is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. […] The *decisions* are the user's: put each to them and wait.

That division is the whole reason the session is bearable. You are not being asked to recite your own codebase back to something that could read it. You are being asked to decide things, which is the part that actually requires you.

In the gateway session it had the repository, and two things came back that nobody asked for. Some TLS termination strategies were far easier for us than others, not on general merit but because of the shape of the code we already had. Anyone can rank the standard approaches. The ranking that matters is weighted by what your codebase will tolerate, and you only get that from something that has looked. It also read how we were using a couple of recently-adopted shared web workers, flagged the ways that would cause us problems, and turned that into the grouping optimization above rather than filing it as a separate concern. The fix rode along with work we were already doing instead of becoming a ticket nobody prioritizes.

A different session makes the point harder, because the fact it needed was not in the code at all. We were solving something that hinged on when a user last loaded a layout, and the available signal was filesystem timestamps. The obvious question is whether you can trust a last-read timestamp. It did not ask me. It went and checked which Linux version and filesystem we were running, because that question has no general answer. Linux has defaulted to `relatime` since kernel 2.6.30, which updates access time only if the file changed since it was last read, or once a day, and a `noatime` volume never updates it at all. Whether that design works depends on how somebody mounted a disk years ago.

It did not come to the table empty-handed either. It brought two kinds of knowledge. A cold reading of code it has no memory of writing, which is the thing a good new hire brings in week two. And a working knowledge of the platform underneath, the kernel and the filesystem and the browser, which it will go and confirm against your actual machine rather than assume. What it cannot bring is your business, your users, and the reason any of this matters. That stays your job, which is exactly why the split in that instruction is the right one.

## The questions were not about the code

This is the part I did not expect, and it is the part I would tell a skeptic first.

I assumed a design interrogation would be architectural. Some of it was, and the sharpest of those came early: were the services behind this already terminating TLS themselves? That single question decides whether you are building a translation layer or a pass-through, and I did not have it on my list.

The range was much wider. It asked whether to build this at all or adopt something open source, a question I have watched teams avoid for months at a time. It asked how endpoint signatures should be formatted. It asked which levels of testing we intended to carry, naming unit, functional, integration and regression separately rather than accepting "we'll test it." Then it went where I have never seen a design document go unprompted: rollout. How private certificates would be distributed, and how and when users would move onto the new endpoints.

Look at the shape of that. It moved from *should we build this at all* down to *how is a function signature spelled* and back out to *how does this reach users*. Those are three different altitudes, and a design conversation that only operates at one of them is the reason projects ship a beautiful core with no migration path.

That is what I mean by shared understanding, and it is why the phrase is better than "requirements." Requirements are a list you hand down. This was two parties discovering, out loud, the full surface of a thing neither of us had completely in our head, and the most valuable thing the agent did was refuse to let a decision stay implicit.

## "I don't know yet" is an answer

The honest caveat, because this does not always go well.

Some sessions get hard in a specific way: the interrogation wants a level of detail you do not have yet, at a stage where you could not responsibly commit to it. It asks how you will shard something before you know whether you need to. Push through that and you will invent an answer to get the conversation moving, and an invented answer is strictly worse than no answer, because now it is written down and it looks decided.

The move is to say so. Tell it you do not know, that the decision is not ready, and to come back to it later. That is not a failure to answer. **It is the answer**, and it is one the agent can use: it now knows which parts of the design are load-bearing and settled and which are open, and it will steer accordingly instead of pretending the whole thing is equally firm.

This is worth internalizing, because it reframes what the exercise is. You are not being quizzed and you are not being graded. You are building a shared model, and "this part is undecided" is a true and useful fact about that model. An agent told which parts are firm and which are open will stop hammering the open ones and start protecting the firm ones.

That is a different problem from bringing the wrong tool, which [I have written about](/posts/chat-history-isnt-a-handoff): grilling converges on a design you can nearly see, and Pocock's `wayfinder` exists for the stage before that. This happens inside a session you were right to start, and you still hit a question three decisions ahead of where you are. Answer it honestly and the session absorbs it. Answer it to keep things moving and you have promoted a guess to a constraint.

Knowing when to stop is the same judgment, and the skill defines it better than I would have: the session is done when the frontier is empty, every branch of the design tree visited, nothing left silently assumed. That is a real finish line rather than a feeling, and it should arrive a great deal sooner for a component whose failure mode is a support ticket than for one whose failure mode is a fleet-wide outage.

## Most of them are not three hours

I keep describing a three-hour session, which makes this sound like something you book a room for. Most of them are nothing like it.

Run a well-understood ticket through the same process and it asks one or two questions and stops. Everything else it needed was answerable from the code, so it went and answered it instead of asking me. The length of a session is set by how much real ambiguity is in the work, not by ceremony, and the frontier empties fast when the answers are already sitting in the repository.

Which is why I now put most tickets through one rather than reserving it for the architectural set pieces. Not all of them, but most. On a simple ticket it costs a minute, and what the minute buys is another pair of eyes on the problem and the code before anyone starts building. That is worth having whether the thing doing the building is an agent or me.

What scales with risk is the depth, not whether you do it at all. The gateway was worth three hours because getting the connection model wrong would have surfaced months later as a platform-wide performance problem, discovered by users, with the fix landing in every application on the platform. A copy change is worth the two questions it will actually generate. Both are the same practice, and the practice sizes itself.

## It quietly replaced grooming

Anyone who has worked in Scrum will recognise the shape of this. Grooming and pointing exist to make a team look at a requirement together and confirm that what is needed is actually stated, before anybody commits to it. The instinct is right and the ceremony is expensive: an hour of everyone's time, every sprint, interrogating a backlog most of the room has not read.

A grilling session does a good deal of that same work, per ticket, on demand, without the room. It does not replace the conversation where a team argues about priorities or capacity, and I would not want it to. For the narrower question of whether a thing is specified well enough to start building, it has largely replaced grooming for me.

## What you actually take away

**The cheapest place to be wrong is in a conversation.** Every gate after this one is more expensive. Wrong in the spec costs a rewrite of the spec. Wrong in the code costs a rewrite of the code. Wrong in production costs a rewrite of the code plus a migration plus whatever the users did to cope in the meantime, which in our case was opening a second browser every morning for longer than I would like to admit.

None of this depends on a particular tool. The skill is a convenience, and if it vanished tomorrow the practice would survive as a prompt you write yourself: *do not build this yet, ask me questions until you can describe it back to me.*

What matters is the inversion. The default posture with an agent is that you supply understanding and it supplies typing. That is exactly backwards whenever you are not yet certain what you are building, which is more tickets than you would think, and it is why the confident wrong build happens. Make it extract the understanding instead, and the artifact you get is not code, and not a document either, not yet. It is the much less glamorous thing that every good engineering decision has always rested on: two parties who agree on what is being built, and who found out where they disagreed while disagreeing was still free.

Which raises the obvious next problem. That understanding currently exists in one session, in one person's terminal. It has to become something another engineer, or another context, can pick up and execute without you in the room. That is a document with a specific job, and most of what gets called a spec does not do it.
