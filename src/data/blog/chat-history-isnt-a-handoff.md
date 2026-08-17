---
title: "It Doesn't Forget, and That's the Problem: Why Your Chat History Isn't a Handoff"
author: Jared Schraub
pubDatetime: 2026-08-17T12:30:00Z
draft: false
featured: true
tags:
  - Engineering With AI
  - AI Coding
  - Claude Code
  - Context Engineering
  - Software Engineering
  - Documentation
  - Architecture Decision Records
  - Agentic Coding
  - Technical Writing
  - Engineering Leadership
description: "A long design session goes bad in a specific way, and it is not that the agent forgets. It remembers everything you said, including every idea you abandoned, at full weight. The fix is the same one engineering already uses for people: write down what survived, and hand over the document instead of the conversation."
ogImage: ../../assets/images/chat-history-isnt-a-handoff-banner.png
---

![A dense uniform field of small jade marks on the left, every mark the same weight and indistinguishable from its neighbours, thinning rightward as most fade to near-invisible neutrals until only a few bright marks remain, gathered into one compact ordered block with a single small gold mark beside it, and a thin arc looping back from the block to the left edge](@/assets/images/chat-history-isnt-a-handoff-banner.png)

[Last time](/posts/brilliant-developer-no-discipline/) I ended on a `CLAUDE.md`, which is where most people's context work starts and stops. This one is about what happens when that is not enough, and about the specific way a long session goes bad.

I was planning the technical foundation for a side project. Not a toy. A real thing with a database, background workers, inbound mail, payments, and a public site that has to be fast. I did what I now always do before writing code, which is sit down with the agent and let it interrogate me until the design is actually resolved rather than merely imagined.

It was a genuinely good session. It made me think about things I had not considered. Whether the API layer needed a separate query language or whether typed RPC covered it. Whether an ORM was worth the bundle cost on an edge runtime, or whether the schema was small enough to hand-manage. Which pieces should be off-the-shelf and which were worth building. Every one of those was a real decision, and I made most of them right there.

And then, somewhere past the point where it should have been converging, the session started handing things back to me that I had already decided.

## It didn't forget. That was the problem.

This is the part that took me a while to name, because I had the diagnosis backwards.

I assumed the agent had lost track. That is the folk model of what goes wrong in a long conversation, and it is what the words "context window" train you to expect. Things fall out the back.

That is not what was happening. It was bringing things back precisely because it remembered them.

Two hours earlier I had floated an idea, thought about it out loud, and dropped it. In my head that idea now had a label on it. Out of scope. Considered, closed, do not reopen. In the context window it had no such label. It was one more paragraph I had written, sitting there at exactly the weight of the paragraphs describing what I had decided to do. Nothing in a transcript distinguishes an idea you abandoned from an idea you committed to. They are both just things you said.

So the further a discovery session goes, the worse its signal gets, because discovery *manufactures* rejected material. That is what it is for. You generate options and you kill most of them. An hour in, most of what you have said is stuff you no longer believe, and all of it is still in the window at full weight, competing for attention with the small fraction that survived.

I hit the same wall at work on something much larger. We were designing the entry point in front of a fleet of internal services, with TLS termination, WebSocket and REST traffic sharing a path, load spread across instances, and an in-house service registry to integrate with. That session ran about three hours and was one of the most useful design conversations I have had. It also ended the same way, dragging settled questions back into the room, at a point where the cost of relitigating was measured in real engineering weeks.

## Weight, not capacity

There is a well-known observation here that I want to credit properly, because it named something I had been feeling. Dex Horthy at HumanLayer described the way model performance falls off as a context fills, and Matt Pocock has done a lot to popularize it. The rough shape is that the first stretch of a context window, somewhere around the first hundred thousand tokens, is where you get the good version of the model. Past that you are still inside the window, and you are getting a worse answer. The smart zone and the dumb zone.

What my session added, for me, was the mechanism. I had been reading the dumb zone as a stamina problem, as though attention thins out evenly across everything. It is better understood as a signal-to-noise problem, and in a discovery session you are the one generating the noise. It is not that the agent got tired. It is that I filled its working memory with three hours of my own discarded thinking and then asked it to prioritize.

Which is also why a bigger window does not fix it. A bigger window holds more of the same undifferentiated pile. That buys you a longer runway before things get bad, not a session that stays good.

One honest note about my own tool selection, since it was part of the problem. Grilling is a convergence tool, superb at resolving a design you can nearly see. I brought it to a problem that was still divergent, and Pocock ships a separate skill, `wayfinder`, aimed at exactly that altitude. But this is not only a wrong-tool failure. It shows up in any session long enough to accumulate a history.

## Write down what survived

The move is simple and it took me embarrassingly long to make it a habit.

Stop. Write a document containing only the decisions that survived. Clear the context. Start again from the document.

Not a transcript. Not a summary of the conversation. Auto-compaction will give you that, and a faithful summary of a session where the rejected ideas outnumber the accepted ones is a summary that faithfully preserves the noise. You want the opposite of a summary. You want a filter, applied by the only participant who knows which ideas were real.

Here is the top of the document that came out of that session, which is a real file in a real repository:

```markdown
# Tech Stack

**Project:** 246
**Status:** All decisions in this document are locked. Do not re-litigate;
the rationale is captured below for context.
**Audience:** A fresh engineer or coding agent picking up implementation.
```

Four lines, and two of them are doing structural work.

*Do not re-litigate* is the label that did not exist in the transcript, now written down where the next context has to see it. It is not documentation etiquette. It is the fix for the exact failure, stated as policy.

And the audience line is the other half of the argument, which I will come back to. A fresh engineer **or** a coding agent. The document does not care which, and that turns out to be the whole point.

Underneath, the sections that matter most are the negative ones. A table headed *What this stack rules out*, introduced with "documented here so future agents don't reopen settled questions," lists each rejected option with the reason it lost. Not GraphQL, because there is one frontend and the calls are CRUD-shaped. Not Prisma, because of bundle size and cold starts on an edge runtime. A second section holds what is deferred rather than rejected, each entry carrying the condition that would reopen it.

That is the shape of a decision that stays decided. The conclusion alone does not survive contact with a fresh context, because a fresh context will just re-derive the question. The conclusion plus the reason it beat the alternatives does.

## The restart is the test

Then I cleared the session and started over from that file, and this is the part I did not expect.

The new session did not re-ask anything the document answered. It went straight to work. But it did ask questions, and the questions were all of the same kind: things the document did not cover.

It wanted to know whether we needed an ORM at all, or whether the schema was small enough to manage by hand. The original session had settled on the database and the blob store and left the ORM open, and I had not noticed, because in my head the data layer was decided. It wanted the circumstances under which I would deviate from list pricing, and what that would do to the credibility of a product whose whole pitch is trust. It wanted the boundaries on data retention, and on what the product would and would not say in its own voice.

None of those were re-asks. Every one was a hole.

That is when it clicked that the restart was not just a cheaper session. **It was a test, and the questions were the results.** A fresh context that picks up your document and starts working has told you the document is sufficient. A fresh context that stops to ask has told you exactly where it is not, by name, in about ninety seconds, before anybody has built the wrong thing.

We have always had this test. It is called onboarding. A new hire's first week generates the highest-quality audit your documentation will ever receive, and almost every team throws that audit away by answering in a chat thread and moving on. The difference now is that you can run it whenever you want, as many times as you like, without hiring anyone.

Which only pays off if you close the loop, and this is the discipline that makes the whole thing work:

**When a question gets answered in chat, the answer does not stay in chat.** The agent writes it back into the handoff document, or into a decision record, or into the glossary. Then the context that opens tomorrow starts from a document that is strictly better than the one that opened today.

<figure>
<svg viewBox="0 0 760 260" role="img" aria-labelledby="ratchet-title ratchet-desc" style="width:100%;height:auto;font-family:inherit">
  <title id="ratchet-title">The documentation ratchet</title>
  <desc id="ratchet-desc">A loop of four stages. The handoff document, highlighted in gold, feeds a fresh context. The fresh context asks questions, which are labelled as the gaps in the document rather than as re-asks. Those answers are written back into the document, which returns to the start of the loop stronger than before. A note reads: it never asks what the document already answers.</desc>
  <g font-size="13" text-anchor="middle">
    <rect x="14" y="96" width="150" height="52" rx="6" fill="var(--gold, #d9a944)" fill-opacity="0.16" stroke="var(--gold, #d9a944)" stroke-width="2" />
    <text x="89" y="118" fill="var(--foreground, #dee4e0)">Handoff</text>
    <text x="89" y="136" fill="var(--foreground, #dee4e0)">document</text>
    <g fill="var(--accent, #1a7a52)" fill-opacity="0.10" stroke="var(--accent, #1a7a52)" stroke-width="1.5">
      <rect x="218" y="96" width="150" height="52" rx="6" />
      <rect x="422" y="96" width="150" height="52" rx="6" />
      <rect x="626" y="96" width="120" height="52" rx="6" />
    </g>
    <g fill="var(--foreground, #dee4e0)">
      <text x="293" y="118">Fresh</text>
      <text x="293" y="136">context</text>
      <text x="497" y="118">The questions</text>
      <text x="497" y="136">it asks</text>
      <text x="686" y="127">Written back</text>
    </g>
  </g>
  <g stroke="var(--muted-foreground, #94a099)" stroke-width="1.5" fill="none">
    <path d="M164 122 L214 122" marker-end="url(#rr)" />
    <path d="M368 122 L418 122" marker-end="url(#rr)" />
    <path d="M572 122 L622 122" marker-end="url(#rr)" />
    <path d="M686 96 L686 56 L89 56 L89 92" marker-end="url(#rr)" />
  </g>
  <text x="387" y="44" text-anchor="middle" fill="var(--muted-foreground, #94a099)" font-size="13">every answer goes back into the document, never only into the chat</text>
  <text x="497" y="176" text-anchor="middle" fill="var(--muted-foreground, #94a099)" font-size="13">not re-asks. gaps.</text>
  <text x="293" y="176" text-anchor="middle" fill="var(--muted-foreground, #94a099)" font-size="13">reads the document, not the transcript</text>
  <defs>
    <marker id="rr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground, #94a099)" />
    </marker>
  </defs>
</svg>
</figure>

The ORM question is the receipt. It started as a gap the restarted session found, became a paragraph in the handoff document, and is now `docs/adr/0009-drizzle-over-prisma-and-kysely.md`, sitting next to twenty-seven siblings. That question cannot cost me an hour again, and it cannot cost the next person one either.

## The part that has nothing to do with models

Everything above would still be worth doing if the tooling vanished tomorrow, and this is the argument I would make to someone who thinks this is all AI ceremony.

I cannot hand you my chat session.

That is not a limitation of any product. It is what a conversation is. A three-hour session is a private artifact of one person's afternoon, full of turns that only make sense if you were there, with nothing separating what we concluded from what we tried. Even if I could export it and send it to you, reading it would cost you the three hours it cost me, and you would finish understanding less than I do, because you would not know which parts I stopped believing.

This is precisely why engineering already has specifications, decision records, tickets, and documentation. Not because anyone enjoys writing them. Because work has to move between people and a conversation does not move. Somebody has to be able to pick up what needs building, and how the pieces fit together, without the person who figured it out standing next to them.

So the written record was always the unit of transfer. What has changed is that one of the parties reading it might not be a person. Look again at that audience line. *A fresh engineer or coding agent picking up implementation.* Whether the next reader builds it by hand or drives an agent to build it, they need the same artifact, and it is the one we already knew how to write.

That is the pillar underneath all of this. **Context is the bottleneck, so artifacts are the shared memory.** Across contexts, because no session holds the whole system. Across time, because in three years the ticket log is the only surviving answer to "why is it like this." And across people, because that is what the whole practice was invented for in the first place.

## What goes where

Here is where I think a lot of people go wrong, and it is a reasonable mistake to make. Having discovered that a `CLAUDE.md` improves the output, they grow one. Six months later it is four hundred lines covering style rules, architecture notes, deployment trivia, and domain vocabulary.

That file is loaded into every context, whether or not any of it is relevant to the task. The naive fix for the context problem spends the exact budget it was meant to protect.

My project instructions file is forty-five lines, and it opens by pointing somewhere else. Repo-wide rules that must apply to every session live in it. Everything else lives in a document that gets read when the work needs it. Each artifact answers one question:

| Artifact | The question it answers | When it is read |
| --- | --- | --- |
| `CLAUDE.md` / `AGENTS.md` | How do we work in this repo? | Every session |
| `CONTEXT.md` | What do our words mean? | On demand |
| Decision record | Why this, and what did we reject? | On demand, forever |
| Handoff document or spec | What are we building, and what is locked? | Per effort |
| Ticket | What changed, for people who do not read code? | Per unit of work |
| Test | Is it still true? | Every commit |

A few things I have learned about keeping that set honest.

**Write nothing the code already says.** The rule I hold myself and my agents to is that documentation exists for what is *not* clear from the code. Decision records answer **why** we built it this way. Comments answer **what** this is supposed to do. The code answers **how** it accomplishes that. Each stays brief, and appears only where the answer is not already obvious. That is not a style preference. A comment restating the line below it costs context and buys nothing, so redundant documentation is a tax paid in the exact currency you are short of.

**Put the rejected option in the filename.** My decision records are named things like `0009-drizzle-over-prisma-and-kysely` and `0003-better-auth-over-clerk-and-auth-js`. Anyone listing that directory, human or agent, learns what has already been ruled out without opening a file. It costs nothing at the moment you create it.

**Split documents and cross-reference them.** The handoff directory started as one document, grew past forty kilobytes, and got split into thirteen topic files behind a short index that gives a reading order and states that decisions inside are locked. That is the same move as the project instructions file that delegates. A small always-loaded pointer in front of a large body that loads only when the task calls for it. Documents have a dumb zone too, and the fix is the same fix.

## How much of this do you actually need

Both of the repositories I have been quoting belong to me, and they are an order of magnitude apart.

This blog has one glossary and four decision records. The side project has thirteen handoff documents, twenty-eight decision records, a glossary, and a project instructions file. Same author, same method, same week in some cases.

The difference is what happens when it is wrong. If this blog renders a draft it should not have, I fix it and almost nobody noticed. The other one holds subscriber mail and payment state, and a mistake there is somebody's private information. Depth follows blast radius. If you want to know how much documentation a piece of work deserves, do not ask how big it is. Ask what it costs when it is wrong.

## Where this bites back

A stale artifact is worse than no artifact, and it is worse for an agent than it is for a person.

When a human reads a document that disagrees with the code, they trust the code. They have been burned before. They mutter something about the wiki and move on. An agent reads the document and trusts the document, and now you have handed it confident, specific, wrong context. That is a more expensive failure than giving it nothing, and it is the exact failure this entire practice exists to prevent.

So the write-back discipline is not tidiness. It is what keeps the artifact worth reading. A document nobody updates becomes a document nobody should read, and the only signal that you have crossed that line is the day it produces something wrong with total confidence.

None of this makes a session infinitely long, either. It makes sessions short on purpose and starting over cheap, which is the actual goal. Not one heroic conversation that holds everything, but a document good enough that the next conversation does not have to.

The same trio runs the writing side of this blog, incidentally. The [functional programming series](/tags/functional-javascript/) was planned in exactly this shape, with a roadmap, a decision record, and a handoff, and drafting sessions start from those rather than from whatever I said last week. It is not a code practice. It is a work-transfer practice.

Which leaves one thing unaddressed. Everything here assumes you already know what you are trying to build, and that the only problem is carrying that knowledge across a gap. The harder failure is upstream, when the agent confidently builds the wrong thing because the two of you never actually agreed on what the right thing was. That is where the conversation earns its keep, and it is worth doing properly.

But whatever you work out in that conversation, write it down before you clear it. The session is not the artifact. It never was.
