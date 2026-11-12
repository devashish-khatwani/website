---
title: "What an audit trail for AI agents should capture"
description: "When an auditor asks 'who let the agent do that?', you need an answer in minutes. Here's what an AI audit record should hold, what it should leave out, and how Glaux records it."
date: 2026-11-11
author: "The Glaux Team"
tags: ["audit", "AI governance", "compliance", "AI agents"]
heroImage: "/blog/images/audit-trail-for-ai-agents/hero.svg"
heroImageAlt: "An append-only ledger: stacked record bars on a vertical timeline, with the newest record in blue."
---

![An append-only ledger: stacked record bars on a vertical timeline, with the newest record in blue.](/blog/images/audit-trail-for-ai-agents/hero.svg)

Picture a Tuesday morning. A customer emails to say a report with their account details went to the wrong person. Someone on your team used an AI agent to prepare and send it.

Your auditor asks four questions:

- Who ran it?
- What exactly did the agent do?
- Was it allowed, and by which rule?
- Did a human sign off?

If you can answer those in ten minutes, it's an incident. If it takes three weeks of stitching logs together, it's a crisis.

Most teams discover the gap at exactly this moment. Chat history tells you what someone typed. It doesn't tell you what was _permitted_. This post is about building the second kind of record.

## Chat logs aren't an audit trail

It's tempting to say "we keep the transcripts, so we're covered." There are two problems with that.

First, transcripts answer the wrong question. An auditor rarely cares about the wording of a prompt. They care about the decision: who had authority, what rule applied, and whether a control fired.

Second, transcripts are a liability. A store of every prompt and response is a copy of your most sensitive work, in one place, searchable. You've built the thing you were trying to protect against.

A good AI audit trail records decisions and leaves content out.

## The five parts of a useful record

Here's what each audit record in Glaux holds. We group it into five parts.

![Anatomy of one Glaux audit record, in five groups. Who: actor ID and type. Where: organization and workspace. What: area, resource type and ID, action, and a short safe summary. Result: outcome and the policy version. Proof: source system and event ID, source and ingestion time, a SHA-256 hash of the source record, correlation IDs, and the schema version.](/blog/images/audit-trail-for-ai-agents/audit-record.svg)

### Who

The actor's ID, plus what kind of actor it was: a **user**, a **service account**, the **system** itself, or a **vendor** system. That distinction matters more with agents than it ever did with people. When an approval expires because nobody answered, Glaux records the system as the actor, not the person who asked. Nobody gets blamed for a decision they didn't make.

### Where

The organization and, when it applies, the workspace. Agents act inside a context. "Dana did X" means little until you know which team's data she was working in.

### What

The product area (policies, AI Gateway, skills, tools, and so on), the type and ID of the thing acted on, the action, and a short human-readable summary.

That summary is capped at 160 characters, and it's checked before it's saved. If it looks like it contains a credential, such as a bearer token or a cloud access key, the record is rejected rather than stored with a secret inside.

### Result

The outcome, from a fixed list: submitted, success, denied, failed, skipped, or unknown. Plus the policy version that made the call.

Two things to notice. **Denied** is a first-class outcome. The blocks are often the most interesting part of an audit, because they show controls actually working. And the **policy version** means you can answer "was this allowed _at the time_?" even after the rules have changed.

### Proof

This is the part most homegrown logs skip, and the part auditors push on hardest.

- **Source system and source event ID.** Where the event came from, with its original ID.
- **Two timestamps.** When it happened at the source, and when Glaux received it. Late events stay honest instead of quietly reordering history.
- **A SHA-256 hash of the source record.** Proof that the normalized event matches what the source actually said.
- **Correlation IDs.** The run, the policy, the request. These let you pull one thread and see everything connected to it.
- **A schema version,** so records stay readable as the format evolves.

## Make it impossible to edit

An audit trail that an admin can quietly tidy up isn't an audit trail.

Glaux's audit store is append-only, and that's enforced in the database itself. A trigger rejects any update or delete on an audit row. It's not a permission someone forgot to revoke. There's simply no edit path.

Ingestion is idempotent too. Each event is unique by its source system and source event ID, so a retry or a replayed feed doesn't create duplicates.

## Approvals deserve their own story

When an agent wants to do something sensitive, the most important thing to record is often the human decision. Here's how that plays out in Glaux.

![One approval, fully traceable: the agent wants a sensitive action, policy says require approval, a pending approval is created and bound to the session, run envelope, action, and resource with a risk level and expiry, it is approved, rejected, or expires, and it's checked again before it runs.](/blog/images/audit-trail-for-ai-agents/approval-flow.svg)

Say the agent wants to send a file to an outside address, and your policy says that needs a human.

1. Glaux policy returns **require approval** for that exact action.
2. Glaux creates a pending approval. It's bound to the session, the run envelope, the action, and the specific resource. It carries a risk level, from low to critical, and it expires. It can never outlive the session's own permissions.
3. The person running the agent approves or rejects it, right in the flow of work. If nobody answers, it expires.
4. Before the action runs, Glaux checks again: same envelope, same action, same resource, and the person is still a member of the workspace. An approval for one thing can't be reused for another.

Creating the approval writes an audit event. So does every change to it. All of them point at the same approval record. Back on that Tuesday, "did a human sign off?" is one search.

## Know what you're not seeing

No audit trail is complete, and the dangerous ones pretend to be.

Glaux tracks coverage for each source it ingests from: whether the connector is current, behind, or unavailable. When a source is stale, the Audit pane says so instead of implying the picture is complete.

To be specific about today: Glaux audit receives Glaux Control Tower's own events, which cover policy, access, approvals, AI Gateway changes, and more. It also pulls in the audit feed from the Glaux skills library. Bringing in the native logs of the AI Gateway and the tools gateway is on our roadmap.

## Searching and exporting without creating a new risk

Investigators need to search and export. Both can go wrong.

In Glaux, every audit search needs a time range, uses fixed filters (area, resource type, workspace, actor, action, outcome, and correlation ID), returns newest first, and is scoped on the server to what the viewer may see. There's no free-form SQL from the browser.

Exports take the current filters and produce CSV or JSONL. A few details we cared about:

- **Exporting is its own permission.** Being able to read the audit log doesn't automatically mean you can take a copy.
- **Downloads are short-lived links,** and an export can be revoked.
- **CSV cells are protected against formula injection.** A value starting with `=` or `+` won't run as a formula when someone opens the file in a spreadsheet.

## What to leave out, on purpose

Just as important is what never goes in. The audit store doesn't copy prompts, model responses, raw tool payloads, credentials, memory contents, or traces. Traces live in a separate observability tool with its own scoped access.

That split lets you keep the audit trail for years without it becoming the riskiest database you own.

## A quick test for your current setup

Pick one AI-assisted action from last month and try to answer these in under ten minutes:

1. Which person, or which system, took the action?
2. Which workspace or team context was it in?
3. Was it allowed, and under which version of which policy?
4. Did a person approve it? Who, and when?
5. Can you show the record hasn't been edited since?
6. Can you export just the relevant events for an auditor, without exporting everything?

If any answer is "we'd have to check with engineering," that's the gap to close first.

_Glaux is in its design-partner stage. If audit is what's holding back AI at your company, we'd be glad to talk it through._
