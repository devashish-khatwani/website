type Capture = {
  src: string;
  alt: string;
  width: number;
  height: number;
  minWidth: number;
  caption: string;
};

type Pane = {
  id: string;
  name: string;
  surface: string;
  summary: string;
  flow: [string, string, string];
  headline: string;
  explanation: [string, string];
  capture: Capture;
};

export const productSection = {
  eyebrow: "Meet Glaux",
  heading: "Useful work. With you in control.",
  statement:
    "A governed AI coworker with its own machine, approved tools, and a clear view of the work.",
  guideTitle: "Explore Glaux",
  guideLabel: "Website product guide",
  guideHint: "Choose a pane to take a closer look.",
  navigationLabel: "Glaux product panes",
  captureHint: "Scroll inside the capture to read it at full size.",
  captureLabel: "Product capture",
  detailLink: "More about this pane",
  detailsHeading: "A closer look at the work.",
  comingSoon: {
    heading: "Coming soon",
    tag: "Soon",
    items: [
      {
        name: "Knowledge Hub",
        teaser: "Company knowledge is next.",
      },
      {
        name: "Guardrails",
        teaser: "A separate product, still to come.",
      },
      {
        name: "Model Studio",
        teaser: "A closer look at models, next.",
      },
      {
        name: "Eval Engine",
        teaser: "Evaluation is on the horizon.",
      },
    ],
  },
  panes: [
    {
      id: "desktop-app",
      name: "Glaux desktop app",
      surface: "Glaux desktop app",
      summary: "Give your coworker a task on its own governed machine.",
      flow: ["Start a session", "Describe the work", "Review the result"],
      headline: "A place to get the work done.",
      explanation: [
        "Ask, research, write, and analyze in the Glaux desktop app.",
        "Each agent works on its own machine with approved tools.",
      ],
      capture: {
        src: "/product/desktop-start.webp",
        alt: "The Glaux desktop app's new-session prompt and document analysis and executive briefing starters.",
        width: 935,
        height: 650,
        minWidth: 620,
        caption: "Real desktop app capture · a new session, ready for work.",
      },
    },
    {
      id: "people-access",
      name: "People and Access",
      surface: "Glaux admin console",
      summary: "See who has access and manage what they can use.",
      flow: ["Find a person", "Review their access", "Choose the next change"],
      headline: "The right access for each person.",
      explanation: [
        "Find people and groups in one place.",
        "Preview access before deciding what to change.",
      ],
      capture: {
        src: "/product/people-access.webp",
        alt: "The People and Access preview showing an Allowed result for policy.read on the synthetic read-only-database-tools policy resource.",
        width: 1308,
        height: 1165,
        minWidth: 654,
        caption:
          "Real admin console access preview · Allowed policy.read on synthetic read-only-database-tools.",
      },
    },
    {
      id: "ai-gateway",
      name: "AI Gateway",
      surface: "Glaux admin console",
      summary: "Choose which models are available in your workspace.",
      flow: ["Search models", "Review the options", "Choose models"],
      headline: "Choose the models for your workspace.",
      explanation: [
        "Search the models available from a provider.",
        "Review model details and select the ones to use.",
      ],
      capture: {
        src: "/product/ai-gateway.webp",
        alt: "AI Gateway's Select Models sheet showing GPT-4.1 and GPT-4o selected, with search and validation controls.",
        width: 1246,
        height: 732,
        minWidth: 623,
        caption: "Real local model-selection sheet · synthetic model data.",
      },
    },
    {
      id: "skills",
      name: "Skills",
      surface: "Glaux admin console",
      summary: "Review the skills your coworker can use.",
      flow: ["Browse the catalog", "Inspect a skill", "Review the package"],
      headline: "Know what goes into the work.",
      explanation: [
        "Skills give the coworker instructions for a kind of task.",
        "Inspect the version and package before deciding what to use.",
      ],
      capture: {
        src: "/product/skills.webp",
        alt: "The Skills catalog and Review Helper skill details in the Glaux admin console.",
        width: 1928,
        height: 694,
        minWidth: 964,
        caption:
          "Real local admin console · synthetic Review Helper catalog entry.",
      },
    },
    {
      id: "connected-tools",
      name: "Connected Tools",
      surface: "Glaux admin console",
      summary:
        "Bring company tools into the work with access your admin chooses.",
      flow: ["Choose a connection", "Review its tools", "Manage access"],
      headline: "Connect the tool. Choose the access.",
      explanation: [
        "Bring company tools into the work, including MCP tools.",
        "Your admin decides which ones the agent may use.",
      ],
      capture: {
        src: "/product/connected-tools-catalog.webp",
        alt: "Connected Tools catalog details for the fictitious Acme database, with published list_tables and describe_table tools.",
        width: 1420,
        height: 1273,
        minWidth: 710,
        caption: "Real local catalog · synthetic Acme database tools.",
      },
    },
    {
      id: "observability",
      name: "Observability",
      surface: "Glaux admin console",
      summary: "Review agent activity and who can see it.",
      flow: ["Open Observability", "Check the workspace", "Review access"],
      headline: "A clearer view of your agents.",
      explanation: [
        "Open Observability to explore agent traces.",
        "The assignment snapshot shows who is assigned in the organization.",
      ],
      capture: {
        src: "/product/observability.webp",
        alt: "The Observability pane's Glaux Users assignment snapshot with synthetic organization counts.",
        width: 1152,
        height: 444,
        minWidth: 576,
        caption:
          "Real local Observability assignment snapshot · synthetic data; this crop shows assignments, not a session trace.",
      },
    },
    {
      id: "audit",
      name: "Audit",
      surface: "Glaux admin console",
      summary: "See what changed, who changed it, and when.",
      flow: ["Open Audit", "Choose an event", "Review the change"],
      headline: "Keep the decisions in view.",
      explanation: [
        "Review recorded access and policy changes in the admin console.",
        "Open an event to see its outcome, operator, and timing.",
      ],
      capture: {
        src: "/product/audit-event.webp",
        alt: "An Audit event for Read-only database tools, published by fictitious operator Maya Ortiz.",
        width: 520,
        height: 456,
        minWidth: 520,
        caption:
          "Real admin console event · fictitious Maya Ortiz and Read-only database tools.",
      },
    },
  ] satisfies Pane[],
};
