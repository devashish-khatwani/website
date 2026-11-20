export const blogPosts = [
  {
    slug: "cloud-agents",
    title: "See the cloud agents your team is running",
    description:
      "Agents that keep working after the laptop closes are easy to lose track of. The Cloud Agents pane in Control Tower gives admins a place to find them, see who owns them, and inspect what they're doing.",
    date: "2026-11-20",
    displayDate: "November 20, 2026",
    imageExtension: "png",
    imageCount: 2,
    tags: ["AI governance", "cloud agents", "Control Tower", "AI security"],
    heroAlt:
      "The Cloud Agents pane in Glaux Control Tower, showing a workspace inventory of agent instances with owners, runtime status, activity, uptime, and last seen. Example data.",
  },
  {
    slug: "ai-usage-policy-checklist",
    date: "2026-11-11",
    displayDate: "November 11, 2026",
    imageExtension: "svg",
    imageCount: 3,
    title: "A practical AI usage policy checklist",
    description:
      "Most AI policies are a PDF nobody reads. Here's a 12-item checklist for a policy that actually runs, with notes on how each item maps to controls in Glaux.",
    tags: ["AI policy", "AI governance", "checklist", "access control"],
    heroAlt:
      "A clipboard checklist with three checked rows and one row waiting for a decision, beside a deny box and a clock.",
  },
  {
    slug: "audit-trail-for-ai-agents",
    date: "2026-11-11",
    displayDate: "November 11, 2026",
    imageExtension: "svg",
    imageCount: 3,
    title: "What an audit trail for AI agents should capture",
    description:
      "When an auditor asks 'who let the agent do that?', you need an answer in minutes. Here's what an AI audit record should hold, what it should leave out, and how Glaux records it.",
    tags: ["audit", "AI governance", "compliance", "AI agents"],
    heroAlt:
      "An append-only ledger: stacked record bars on a vertical timeline, with the newest record in blue.",
  },
  {
    slug: "employees-use-ai-without-leaking-data",
    date: "2026-11-11",
    displayDate: "November 11, 2026",
    imageExtension: "svg",
    imageCount: 3,
    title: "How to let employees use AI without leaking data",
    description:
      "Banning AI doesn't stop people using it. Here's a practical way to give employees an AI agent while keeping keys, files, and prompts where they belong, and how Glaux is built to do it.",
    tags: ["AI security", "data protection", "AI governance", "LLM gateway"],
    heroAlt:
      "A protected workspace with documents inside a blue boundary and a single governed exit toward a model.",
  },
  {
    slug: "glaux-vs-microsoft-agent-365-vs-in-house",
    date: "2026-11-11",
    displayDate: "November 11, 2026",
    imageExtension: "svg",
    imageCount: 3,
    title: "Glaux vs Microsoft Agent 365 vs building it in-house",
    description:
      "A fair look at three ways to govern AI agents at a mid-size company: what each is good at, where each falls short, and how to pick.",
    tags: ["AI governance", "Microsoft Agent 365", "build vs buy", "AI agents"],
    heroAlt:
      "Three abstract forms: a grid of squares for a broad suite, an owl-eyed hexagon for Glaux, and a stack of loose blocks for building it yourself.",
  },
] as const;
