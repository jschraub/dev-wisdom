---
title: "AI Is a Brilliant Developer With No Discipline: Why Managing Agents Is Managing Engineers"
author: Jared Schraub
pubDatetime: 2026-08-05T19:00:00Z
modDatetime: 2026-08-17T00:00:00Z
draft: false
featured: true
tags:
  - Engineering With AI
  - AI Coding
  - Claude Code
  - Software Engineering
  - Engineering Leadership
  - Agentic Coding
  - Context Engineering
  - Code Review
  - Developer Productivity
  - Technical Debt
description: "I spent months writing prompts, rejecting what came back, and rewriting it myself. The problem was never the model. It was that I was prompting a tool instead of managing a developer, and engineering already knows how to manage a fast, talented, undisciplined developer."
ogImage: ../../assets/images/brilliant-developer-no-discipline-banner.png
---

![A fast, scattered swarm of glowing fragments streaming from the left, passing through four upright gate frames that straighten and align them, resolving into one precise stacked form with a single gold check beside it](@/assets/images/brilliant-developer-no-discipline-banner.png)

For about six months, my workflow with AI looked like this. Describe what I wanted. Watch it build. Read the result. Decide it was not something I would merge. `git reset --hard`. Write it myself.

I want to be precise about what was wrong with the output, because "it produced slop" is the kind of thing people say when they have not looked closely. The code ran. The tests, when it wrote them, passed. It was not hallucinating APIs or inventing libraries. The problem was subtler and more familiar than that: it made choices I would have pushed back on in review. It reached for a class where a closure would do. It caught an error three layers below where the decision about that error actually belonged. It duplicated a helper that already existed forty lines up.

One afternoon I finally said the thing out loud that I had been circling for weeks. It produced code I would not approve if one of my engineers submitted it for code review.

That sentence turned out to be the whole answer. It just took me a while to hear it.

## The same lesson, three times, at increasing volume

My first real exposure was Copilot in VS Code. It was genuinely useful for the small stuff. It would finish a `for` loop or a chain of array transformations before I got to the second line. But it also guessed wrong constantly. It would add logging I did not ask for, insert error handling in places that made no sense, and offer transformations that were plainly not where I was headed.

Then I noticed something. When I wrote a comment first, the suggestions got dramatically better. I filed that under "trick that works" and moved on. I thought I had learned something about Copilot. I had actually learned the only thing that matters, and I did not know it yet.

When I moved to Claude Code, the same pattern showed up wearing different clothes. I could steer the output by telling it what I accept. I want functional components. I prefer functional array and object transformations over `for` loops. That worked, so I stopped retyping it every session and put it in a `CLAUDE.md`:

```markdown
## Code style

- React components are function components. No class components.
- Prefer `map`/`filter`/`reduce` over `for` loops and mutation.
- Derive state. Don't sync it with an effect.
- Named exports only. No default exports.
```

That was a real win, and it is still the highest-leverage ten minutes a new user can spend. But it did not fix the thing that was actually wrong. The agent still charged ahead and still built things in shapes I did not want. I was still resetting.

So: comments made Copilot better. `CLAUDE.md` made Claude Code better. Both times I thought I had found a trick. Both times I had found the same principle at a higher level, and I still had not named it.

## The clue was that my throwaway projects came out great

Around this time I built a couple of proofs of concept away from any existing codebase. One was a messaging and alerting application. I spent real time on the prompt, describing what I wanted in detail, and then it churned for a long while. What came out was genuinely excellent. Not "good for AI." Good.

That result did not fit my theory. If the model produced slop, it should have produced slop there too. It produced some of the cleanest greenfield code I had seen.

The difference was the codebase. My day job lives in a large application with many years and many engineers layered into it, written to a dozen different standards depending on who was around that quarter and what the deadline looked like. Some of that code is good. Some of it is not. And Claude, doing exactly what a conscientious new hire does, read the surrounding code and matched it. It mimicked the patterns it found, including the bad ones.

That is when the actual problem came into focus, and it is not the one most people name. The agent did not have too little context. It was drowning in context. What it lacked was the *right* context: which of those fifteen years of patterns I actually wanted, and what I was trying to accomplish. Bigger context windows do not fix that. It is a curation problem, not a capacity problem.

I needed a way to give the agent my standards and my intent while it worked inside somebody else's accumulated history.

## Ninety minutes

That is when I found Matt Pocock's work, and specifically his idea of reaching a shared understanding with the agent before any code gets written. He ships it as a skill called [`grill-me`](https://github.com/mattpocock/skills). The premise is that the agent interviews *you*, one question at a time, until the design is actually resolved.

I tried it on the least fair test I could think of. I pointed Claude Code at the big application and at my messaging-alert proof of concept and said: I want to put something like that in this application. Grill me.

It asked me about thirty questions. It took over an hour, and it was not a pleasant hour, because a good interrogation is mostly the discovery that you had not decided things you assumed you had decided. A sample of the kind of thing it wanted to know:

> If an alert fires while a recipient is offline, do they see it on next login, or is it dropped?
>
> Is "acknowledged" per recipient or per alert? You said alerts can have multiple recipients.
>
> The backend stores timestamps in UTC. What should a recipient in another timezone see, and who does the conversion?

Then it said it understood, and asked if it should build. I said yes. About twenty minutes later it was done.

The implementation was excellent. Roughly ninety minutes from start to working feature, for something that would previously have taken me about a week. And that third question is worth sitting with, because the agent had surfaced a date-formatting mismatch between the backend and the frontend before a line of code existed. That is a bug I would have found at two in the afternoon three days later, by staring at a timestamp that was off by exactly the wrong amount.

I had not made the model smarter. I had done the thing I had accidentally done with comments, and deliberately done with `CLAUDE.md`, at the level where it actually pays: I had given it the context to do the job properly, before it started.

## The reframe

Here is what I had been getting wrong, and I think it is what most people get wrong.

I had been treating the agent as a tool that needed better inputs. Tools take inputs. You get better at operating a tool by learning its quirks, and that is exactly what I had been doing for six months: collecting tricks.

But nothing about that loop was a tool problem. Read it back as if I were describing a person. Fast. Genuinely capable. Produces working code at a rate no human matches. Makes design choices nobody signed off on. Copies whatever pattern is nearest to hand. Does not ask what you are actually trying to do. Leaves no record of why anything is the way it is.

You have worked with that developer. Every team has. They are usually one of the most talented people in the room, and their output is untrustworthy until somebody puts a process around them.

> **AI is a brilliant developer with no discipline. The process you wrap around it is the engineering.**

And that is good news, because it means you do not need a new discipline for this. We have spent fifty years inventing processes that make fallible, fast, overconfident humans reliable at scale. Design review before implementation. A written spec. Small units of work. Tests as the contract. A second pair of eyes. Somebody accountable for what ships. Every one of those exists because a talented human got something wrong in a way that was expensive.

Point them at a talented agent instead. They work.

## Two things hold it up

Everything I have built since rests on two ideas, and the second is the one people fight me on.

**Context is the bottleneck, so artifacts are the shared memory.** No engineer holds a whole system in their head, and no model does either. The fix we already use for humans is that intent lives in durable artifacts, not in somebody's memory of a conversation. A `CONTEXT.md`, a spec, an architecture decision record, a ticket, a test. Chat is lossy and it evaporates. An artifact does not.

That is true across contexts, and it is more true across *time*. The ticket log is how anyone answers "why is this like this?" three years from now, when everyone who was in the room has moved on. That reason has nothing to do with any model's context window, and it is why I do not treat documentation as overhead to be minimized. It is also true across *people*, which is the half I have written about [separately](/posts/chat-history-isnt-a-handoff/): I cannot hand you my chat session, and that limitation is older than any of this tooling.

**Risk sets rigor.** This is the one that gets called bureaucracy, so let me be exact about what I do, because I do not skip steps and I also do not write a design document for a typo.

Every change gets a ticket. Always. Not because the agent needs it, but because the people who are not reading your git history still need to know what shipped. Not every change gets a spec. A spec is for when there is a design decision to make, and a typo does not have one. And the depth of both scales with the blast radius. A one-line fix is one small ticket, not three. A payments change gets acceptance criteria, a decision record, and a test I wrote myself.

The objection to all of this is that it sounds slow. It is not, and the reason is the part people miss: **the agent does the documenting.** My tracker is wired to Claude Code through the `gh` and `glab` CLIs, so the same session that investigates a problem writes the ticket for it. Here is a real one out of my own project, written by the agent from a spec:

```markdown
## Acceptance criteria

- [ ] `normalizeHtml(raw, options?)` parses, strips `<script>`/`<style>`,
      returns a normalized HTML string; honors `stripScriptStyle`
- [ ] Inputs > 10 MB throw before parsing (security guard); empty string
      is handled gracefully (no throw)
- [ ] Tests: fixture pair differing only by inline `<script>`/`<style>`
      blocks → `hashContent(normalizeHtml(a)) === hashContent(normalizeHtml(b))`

_Covers Spec #7 stories 5, 12, 16; partial 1, 8._
```

Note the last line. That ticket knows which spec it came from and which requirements it satisfies. I did not type any of it. The documentation discipline that was genuinely too expensive to sustain by hand is now nearly free, and pretending otherwise is arguing with a cost structure that changed.

I run three different rigor settings myself, on purpose. On my side project [246.vote](https://246.vote), the process is nearly fully automated and my sign-off is about whether the thing works, not about the code. On this blog, features go through the full process. At work, everything does. Same workflow, three positions on the dial.

## Then I tried it on a team

Doing this alone proves it can work. It does not prove it survives other people, and other people are where methodologies go to die.

My team is eight engineers. When I started, one or two were curious and the rest were skeptics, and their skepticism was specific and correct. They had watched Copilot and Claude produce exactly the kind of output I had been resetting for six months, and they had concluded the tools were not ready for serious work. They were right about the evidence. They were wrong about the conclusion, and telling them so would have accomplished nothing.

It took about three months to get everyone on board, and I will spend a whole piece on how, because "I mandated it" is not the answer and would not have worked.

What I can report is the outcome. Our active bug count went from 92 to under 40. Feature throughput went up sharply, from roughly a feature ticket every two weeks to three or four a week, and I want to flag that number rather than sell it: we also changed how we break work into tickets during that same window, so it is not a clean comparison. The bug count is the number I trust, because ticket sizing does not move it.

And we started finding things. There is a defect in that codebase that survived more than fifteen years, and I will tell you the whole story later, including the part where we found it and threw it away. The short version is that a thread never disposed properly, so every user's machine climbed from a ten percent CPU baseline toward a hundred over the course of a workday. People restarted at lunch. They had been doing it so long that nobody filed it as a bug. The workaround had stopped being a workaround and become part of the workday.

Which points at something I want to be careful about, because it is a real qualifier on the frame. The agent found it partly because it does not share all of our flaws. It had no lunch ritual to normalize. AI's blind spots overlap ours heavily, and that is exactly why the processes transfer. But they do not overlap perfectly, and the gap is where the value is. That is the same reason fresh eyes have always worked on human code.

## What the process actually is

I am not going to list the whole thing here. In shape: align before building, write the decision down where it will outlive the conversation, cut the work into pieces small enough to hold, make the test the contract, and put someone with fresh eyes on it before anyone with authority merges it.

<figure>
<svg viewBox="0 0 820 250" role="img" aria-labelledby="pipeline-title pipeline-desc" style="width:100%;height:auto;font-family:inherit">
  <title id="pipeline-title">The workflow pipeline</title>
  <desc id="pipeline-desc">Work flows left to right through six gates: Align, Spec, Decompose, Ticket, Build test-first, and Review. It ends at a human merge gate, highlighted in gold. A second entry point labelled Symptom feeds in from below at the Ticket stage. A bracket above the pipeline notes that the depth of every gate scales with risk.</desc>
  <g fill="none" stroke="var(--border, #303733)" stroke-width="1">
    <path d="M40 58 L40 46 L700 46 L700 58" />
  </g>
  <text x="370" y="38" text-anchor="middle" fill="var(--muted-foreground, #94a099)" font-size="13">depth of every gate scales with risk</text>
  <g font-size="13" text-anchor="middle">
    <g fill="var(--accent, #1a7a52)" fill-opacity="0.10" stroke="var(--accent, #1a7a52)" stroke-width="1.5">
      <rect x="8" y="92" width="96" height="42" rx="6" />
      <rect x="124" y="92" width="96" height="42" rx="6" />
      <rect x="240" y="92" width="96" height="42" rx="6" />
      <rect x="356" y="92" width="96" height="42" rx="6" />
      <rect x="472" y="92" width="96" height="42" rx="6" />
      <rect x="588" y="92" width="96" height="42" rx="6" />
    </g>
    <g fill="var(--foreground, #dee4e0)">
      <text x="56" y="118">Align</text>
      <text x="172" y="118">Spec</text>
      <text x="288" y="118">Decompose</text>
      <text x="404" y="118">Ticket</text>
      <text x="520" y="118">Build</text>
      <text x="636" y="118">Review</text>
    </g>
    <rect x="704" y="92" width="108" height="42" rx="6" fill="var(--gold, #d9a944)" fill-opacity="0.16" stroke="var(--gold, #d9a944)" stroke-width="2" />
    <text x="758" y="112" fill="var(--foreground, #dee4e0)">Human</text>
    <text x="758" y="127" fill="var(--foreground, #dee4e0)">merge</text>
  </g>
  <g stroke="var(--muted-foreground, #94a099)" stroke-width="1.5" fill="none">
    <path d="M104 113 L120 113" marker-end="url(#ar)" />
    <path d="M220 113 L236 113" marker-end="url(#ar)" />
    <path d="M336 113 L352 113" marker-end="url(#ar)" />
    <path d="M452 113 L468 113" marker-end="url(#ar)" />
    <path d="M568 113 L584 113" marker-end="url(#ar)" />
    <path d="M684 113 L700 113" marker-end="url(#ar)" />
    <path d="M404 190 L404 140" marker-end="url(#ar)" stroke-dasharray="5 4" />
  </g>
  <rect x="340" y="190" width="128" height="40" rx="6" fill="none" stroke="var(--muted-foreground, #94a099)" stroke-width="1.5" stroke-dasharray="5 4" />
  <text x="404" y="215" text-anchor="middle" fill="var(--muted-foreground, #94a099)" font-size="13">Symptom</text>
  <defs>
    <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground, #94a099)" />
    </marker>
  </defs>
</svg>
</figure>

The dashed path matters as much as the solid one. Half of real work does not start with an intent. It starts with a symptom, and the workflow has to run from that end too.

None of this is novel. That is the point. Every gate on that diagram was invented for humans, by people who had been burned by humans. I did not design a methodology for AI. I took the one I already believed in and stopped making an exception for the fastest developer on the team.

## Where the skeptics are right

If you have written this off because what you got out of an agent was not good enough to merge, you were not wrong. You were looking at real evidence and drawing the obvious conclusion. Raw agent output on a serious codebase is not trustworthy. That is the premise of everything I have written here, not an objection to it.

The part I would push back on is the inference. "This output is untrustworthy" is a statement about output, not about capability, and we do not apply that inference anywhere else. We do not conclude that a talented new hire cannot be trusted with the codebase. We conclude that they need onboarding, a spec, a review, and someone accountable for the merge. Then we get value from them, immediately, without pretending the risk went away.

I will also say plainly where this stops being worth it. If you are changing a string in a config file, do not open a grilling session about it. Process that exceeds its blast radius is not rigor, it is theater, and it produces the same eye-rolling that made your team skeptical in the first place. The dial exists to be turned down as well as up.

What is left, once you take that seriously, is not a new skill. It is the old one, applied somewhere we had been making an exception. Anyone can produce working code, and now anyone can produce it very fast. The practice of processes is what turns that into engineering, and it is what turns a developer into an engineer. It always was.
