---
title: "See the cloud agents your team is running"
description: "Agents that keep working after the laptop closes are easy to lose track of. The Cloud Agents pane in Control Tower gives admins a place to find them, see who owns them, and inspect what they're doing."
date: 2026-11-20
author: "The Glaux Team"
tags: ["AI governance", "cloud agents", "Control Tower", "AI security"]
heroImage: "/blog/images/cloud-agents/hero.png"
heroImageAlt: "The Cloud Agents pane in Glaux Control Tower, showing a workspace inventory of agent instances with owners, runtime status, activity, uptime, and last seen. Example data."
---

![The Cloud Agents pane in Glaux Control Tower, showing a workspace inventory of agent instances with owners, runtime status, activity, uptime, and last seen. Example data.](/blog/images/cloud-agents/hero.png)

Picture a familiar handoff. Sam, an engineer at Acme, starts an AI agent in the cloud so it can keep working after he shuts his laptop. That's the point. The work doesn't have to live and die with one machine.

The next morning, Maya, the workspace admin, has a simpler question. Which cloud agents are running in this workspace right now? Who do they belong to? Are they working, or idle?

If the only way to answer that is to ping Sam, you don't have an inventory. You have a hope.

Teams are putting agents in the cloud so they can run coding work, long jobs, and anything that should continue when people log off. That's useful. It's also a new kind of sprawl: runtimes that don't sit on a laptop, owned by different people, and easy to forget once they're started.

## One place to see the fleet

In Glaux, employees work in the Glaux desktop app. Security and platform teams work in Control Tower. The Cloud Agents pane is the Control Tower view of those cloud runtimes: running and stopped cloud agents you can inspect.

At the top, Maya gets a snapshot of the workspace. How many instances are running, and of those, how many are working versus idle. How many are still starting. How many have stopped, kept on the list as previous instances. How many have a last status that's unknown, so they stay visible instead of disappearing from the picture.

Below that is the list, one row per cloud runtime instance. Each row shows the person the instance belongs to, an instance ID, the runtime status, whether it's working or idle, how long it has been up, and when it was last seen. Maya can search by name, email, or instance, and filter by runtime status.

In a fictional Acme workspace, she might see her own agent still running and working, Sam's sitting idle, a teammate's still starting, one with an unknown last status, and a stopped instance Sam used earlier.

## Open an instance, and inspect it

Selecting a row opens the instance.

![Instance detail in the Cloud Agents pane, with owner, email, groups, workspace, runtime status, activity, last seen, and recorded storage. Example data.](/blog/images/cloud-agents/instance-detail.png)

The detail view answers the ownership questions first: who the user is, their email, their groups, and which workspace the instance is in. It also shows the runtime status, the activity, and the last-seen time.

It shows recorded storage too: where workspace files and agent state are mounted. From there, Maya can browse the workspace files, preview them, and download them. Agent state is sensitive. Its files are not listed.

## The same access, and a record of the work

A cloud agent inherits the same access as the person it belongs to. It can reach exactly what that person is allowed to reach, under the same policies, and no more. Maya doesn't have to invent a second permission model for the cloud. Sam's agent works with Sam's access, in his workspace, under the policy she already set.

When it runs, those runs show up in Control Tower's Observability, so Maya can see what it did.

Cloud Agents sits alongside AI Gateway, Connected Tools, Observability, and Audit in Control Tower. Maya can find the runtime, see who owns it, inspect its files, and follow the work from the same place she already governs models, tools, and policy.

The laptop can close. The agent can keep going. Maya can still find it, and she can still stand behind what it was allowed to do.

## See it for yourself

If your team is already running agents in the cloud, or is about to, the first control is being able to find them.

Glaux is in its design-partner stage. If you want to walk through the Cloud Agents pane in Control Tower, we'd like to show you.

[Book a demo](https://www.glauxagent.com/contact/)
