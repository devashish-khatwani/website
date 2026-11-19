type Capture = {
  src: string;
  alt: string;
  width: number;
  height: number;
  minWidth: number;
  caption: string;
};

type Feature = {
  id: string;
  name: string;
  surface: string;
  summary: string;
  flow: [string, string, string];
  headline: string;
  explanation: [string, string];
  capture: Capture | null;
};

const toolCapture: Capture = {
  src: "/product/connected-tools-access.webp",
  alt: "Read-only tool permissions in the Glaux admin console: list_tables and describe_table are allowed.",
  width: 998,
  height: 437,
  minWidth: 998,
  caption:
    "Real admin console capture · synthetic data. Grant delivery was pending in this capture.",
};

export const productSection = {
  eyebrow: "Meet Glaux",
  heading: "Useful work. With you in control.",
  statement:
    "A governed AI coworker with its own machine, approved tools, and a clear view of the work.",
  guideTitle: "Explore Glaux",
  guideLabel: "Website feature guide",
  guideHint: "Choose a feature to take a closer look.",
  navigationLabel: "Glaux features",
  captureHint: "Scroll inside the capture to read it at full size.",
  captureLabel: "Product capture",
  textOnlyNote: "Feature walkthrough · text only.",
  detailLink: "More about this feature",
  detailsHeading: "A closer look at the work.",
  pillars: [
    {
      number: "01",
      name: "Connect",
      summary: "Give the coworker tools and skills your admin approved.",
      features: [
        {
          id: "connected-tools",
          name: "Connected Tools",
          surface: "Glaux admin console",
          summary: "Your admin chooses which tools the agent can use.",
          flow: [
            "Choose a connection",
            "Approve specific tools",
            "Work with the allowed set",
          ],
          headline: "Connect the tool. Choose the access.",
          explanation: [
            "Bring company tools into the work, including MCP tools.",
            "Your admin decides which ones the agent may use.",
          ],
          capture: toolCapture,
        },
        {
          id: "skills",
          name: "Skills",
          surface: "Glaux admin console",
          summary: "Use ways of working your admin has approved.",
          flow: [
            "Choose a skill",
            "Get admin approval",
            "Use it in the desktop app",
          ],
          headline: "Good ways of working, approved.",
          explanation: [
            "Skills give the coworker instructions for a kind of task.",
            "Your admin approves the skills available to the team.",
          ],
          capture: null,
        },
      ] satisfies Feature[],
    },
    {
      number: "02",
      name: "Work",
      summary: "Ask in the desktop app. Each agent works on its own machine.",
      features: [
        {
          id: "desktop-app",
          name: "Desktop app",
          surface: "Glaux desktop app",
          summary: "Start with a question, a brief, or a task.",
          flow: ["Start a session", "Describe the work", "Review the result"],
          headline: "A place to get the work done.",
          explanation: [
            "Ask, research, write, and analyze in the Glaux desktop app.",
            "Keep the conversation and the next step together.",
          ],
          capture: {
            src: "/product/desktop-start.webp",
            alt: "The Glaux desktop app's new-session prompt and document analysis and executive briefing starters.",
            width: 935,
            height: 650,
            minWidth: 468,
            caption:
              "Real desktop app capture · a new session, ready for work.",
          },
        },
        {
          id: "own-machine",
          name: "Own machine",
          surface: "Glaux desktop app",
          summary:
            "Each agent has its own governed machine and approved tool set.",
          flow: [
            "Give the agent a task",
            "Inspect with approved tools",
            "Explain when access ends",
          ],
          headline: "Its own machine. Your boundaries.",
          explanation: [
            "Each agent works on its own governed machine through the desktop app.",
            "A hosted database is reached only through approved MCP tools.",
          ],
          capture: {
            src: "/product/desktop-conversation.webp",
            alt: "The Glaux desktop app explains that its tools can inspect legacy_sessions_2024 but cannot delete data.",
            width: 1057,
            height: 540,
            minWidth: 1057,
            caption:
              "Real desktop reply · synthetic data. No deletion attempted. The agent offers help drafting SQL; no write tool is available.",
          },
        },
      ] satisfies Feature[],
    },
    {
      number: "03",
      name: "See",
      summary:
        "Follow your work in the app, and team work in the admin console.",
      features: [
        {
          id: "my-traces",
          name: "My traces",
          surface: "Glaux desktop app",
          summary: "Look back at your agent's work from the desktop app.",
          flow: [
            "Open My traces",
            "Choose your session",
            "Follow the recorded steps",
          ],
          headline: "See how your agent got there.",
          explanation: [
            "My traces is your view of the work in the desktop app.",
            "Open a session to follow its recorded steps.",
          ],
          capture: null,
        },
        {
          id: "team-traces",
          name: "Team traces",
          surface: "Glaux admin console",
          summary: "Review team traces from the admin console.",
          flow: [
            "Open Team traces",
            "Choose a team session",
            "Review its recorded steps",
          ],
          headline: "A wider view of the work.",
          explanation: [
            "Team traces brings the team's recorded work into the admin console.",
            "Review a session without moving into someone's desktop app.",
          ],
          capture: null,
        },
      ] satisfies Feature[],
    },
    {
      number: "04",
      name: "Govern",
      summary: "Manage access, review requests, and keep a record of changes.",
      features: [
        {
          id: "access-approvals",
          name: "Access & approvals",
          surface: "Glaux admin console",
          summary: "Your admin reviews access for work in the desktop app.",
          flow: [
            "Review the request",
            "Choose the allowed access",
            "Check delivery status",
          ],
          headline: "Decide what the coworker can reach.",
          explanation: [
            "Your admin manages access and approvals for the desktop-app path.",
            "In this example, the approved tool set allows inspection and has no delete tool.",
          ],
          capture: {
            src: "/product/access-review.webp",
            alt: "The Glaux admin console's Manage access review, with a reason to give Sam read-only list_tables access for the Acme staging cleanup.",
            width: 595,
            height: 455,
            minWidth: 595,
            caption:
              "Real admin access review · synthetic data. A read-only grant is ready to publish; delivery is not shown.",
          },
        },
        {
          id: "audit",
          name: "Audit",
          surface: "Glaux admin console",
          summary: "Review recorded access and policy changes.",
          flow: ["Open Audit", "Choose a recorded event", "Review the change"],
          headline: "Keep the decisions in view.",
          explanation: [
            "Open Audit in the admin console to review access and policy changes.",
            "Use the recorded event details to understand what changed.",
          ],
          capture: {
            src: "/product/audit-event.webp",
            alt: "A real Audit event for a read-only policy fixture publication, showing its outcome, action, operator and timestamps.",
            width: 565,
            height: 459,
            minWidth: 565,
            caption:
              "Real admin Audit capture · synthetic policy event. This is a policy change, not a session trace.",
          },
        },
      ] satisfies Feature[],
    },
  ],
  comingSoon: {
    heading: "Coming soon",
    tag: "Soon",
    items: [
      { name: "Knowledge Hub", teaser: "Company knowledge is next." },
      { name: "Guardrails", teaser: "A separate product, still to come." },
      { name: "Model Studio", teaser: "A closer look at models, next." },
      { name: "Eval Engine", teaser: "Evaluation is on the horizon." },
    ],
  },
};
