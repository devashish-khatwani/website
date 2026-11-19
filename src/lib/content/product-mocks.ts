import { productSection } from "./product-section";

export type MockView = {
  id: string;
  name: string;
  caption: string;
  takeaway: string;
  chips: string[];
};
export type Step = {
  name: string;
  outcome: string;
  duration: string;
  blocked?: boolean;
};
export type Trace = {
  id: string;
  task: string;
  person: string;
  when: string;
  steps: number;
  duration: string;
  blocked?: boolean;
  timeline: Step[];
};
const pane = (id: string) => {
  const item = productSection.panes.find((entry) => entry.id === id);
  if (!item) throw new Error(`Missing product pane: ${id}`);
  return item;
};
export const desktopViews: MockView[] = [
  {
    id: "desktop-app",
    name: "New session",
    caption: "Ask in plain words.",
    takeaway:
      "Glaux does the part it's allowed to do and stops at the part it isn't.",
    chips: ["Approved tools only", "Every step recorded"],
  },
  {
    id: "desktop-app-capabilities",
    name: "Capabilities",
    caption: "Know what it can use.",
    takeaway: "Skills and tools, exactly as your admin set them. Nothing more.",
    chips: [],
  },
  {
    id: "desktop-app-traces",
    name: "My traces",
    caption: "Every run, step by step.",
    takeaway:
      "Open a run to see what it did, what it used, and where it was stopped.",
    chips: ["Every step recorded"],
  },
  {
    id: "desktop-app-artifacts",
    name: "Artifacts",
    caption: "The work, kept.",
    takeaway:
      "Files your coworker makes are saved with the run that made them.",
    chips: [],
  },
  {
    id: "desktop-app-automations",
    name: "Automations",
    caption: "Set the schedule. Keep the boundaries.",
    takeaway: "Recurring work runs under the same permissions.",
    chips: ["Approved tools only"],
  },
];
export const adminViews: MockView[] = [
  {
    ...pane("people-access"),
    caption: "The right access for each person.",
    takeaway:
      "See who's here, which group they're in, and what that lets them use.",
    chips: ["Groups and roles"],
  },
  {
    ...pane("ai-gateway"),
    caption: "Choose the models for your workspace.",
    takeaway:
      "Turn models on or off for everyone, and see what each one costs.",
    chips: ["Spend in one place"],
  },
  {
    ...pane("skills"),
    caption: "Know what goes into the work.",
    takeaway:
      "Every skill shows what's in it, which version is live, and who can use it.",
    chips: [],
  },
  {
    ...pane("connected-tools"),
    caption: "Connect the tool. Choose the access.",
    takeaway:
      "Sam's coworker can clean up rows in production. It can't drop the table.",
    chips: ["Approved tools only", "Per-group access"],
  },
  {
    ...pane("observability"),
    caption: "See the work across your team.",
    takeaway:
      "Open any run you're allowed to see and find the step where it stopped.",
    chips: ["Scoped by access", "Every step recorded"],
  },
  {
    ...pane("audit"),
    caption: "Keep the decisions in view.",
    takeaway: "Every change says who made it, what it was, and when.",
    chips: ["Full change history"],
  },
];
export const workspace = {
  organization: "Acme",
  name: "Production workspace",
  monthlyBudget: 2000,
};
export const sections = {
  desktop: {
    label: pane("desktop-app").name,
    heading: "Give it the work. See every step.",
    lede: "Your AI coworker works on its own machine, with only the tools your admin approved.",
  },
  admin: {
    label: "Glaux Control Tower",
    heading: "Decide what it can use. See what it did.",
    lede: "People, models, skills and tools in one place, with a clear record of every change.",
  },
};
export const run = {
  task: "Expired sessions cleanup",
  model: "Claude Sonnet 4.5",
  database: "Acme production database",
  prompt:
    "Clear out the expired login sessions in the Acme production database. Then drop the old sessions_archive table, we don't need it.",
  reply:
    "Done. I removed 18,204 expired sessions from the production database. I didn't drop sessions_archive: dropping tables isn't part of my access to this database. An admin can review that in Connected Tools.",
  denied:
    "drop_table isn't included in this database access. Nothing was changed.",
};
export const cleanupSteps: Step[] = [
  {
    name: "Plan",
    outcome:
      "Check the tables, remove expired sessions, then the archive table",
    duration: "2s",
  },
  {
    name: "list_tables",
    outcome: "Acme production database · 14 tables",
    duration: "1s",
  },
  {
    name: "run_select",
    outcome: "18,204 sessions expired before Nov 19",
    duration: "2s",
  },
  {
    name: "delete_rows",
    outcome: "sessions · 18,204 rows deleted",
    duration: "4s",
  },
  { name: "drop_table", outcome: run.denied, duration: "0s", blocked: true },
];
const completed = (outcome: string): Step[] => [
  {
    name: "Plan",
    outcome: "Review the request and approved sources",
    duration: "2s",
  },
  { name: "Read", outcome: "Read using approved tools", duration: "4s" },
  { name: "Create artifact", outcome, duration: "6s" },
];
export const traces: [Trace, Trace, Trace, Trace, Trace] = [
  {
    id: "tr_8f2c41",
    task: run.task,
    person: "Sam Lee",
    when: "Today, 9:42 AM",
    steps: 5,
    duration: "41s",
    blocked: true,
    timeline: cleanupSteps,
  },
  {
    id: "tr_6a19b2",
    task: "Weekly status draft",
    person: "Sam Lee",
    when: "Yesterday, 4:10 PM",
    steps: 7,
    duration: "32s",
    timeline: [
      {
        name: "Plan",
        outcome: "Collect this week's merged work",
        duration: "2s",
      },
      {
        name: "github.list_pull_requests",
        outcome: "23 merged PRs",
        duration: "3s",
      },
      {
        name: "Summarize",
        outcome: "Drafted the weekly status",
        duration: "8s",
      },
      {
        name: "slack.post_message",
        outcome: "Posted to #eng-ops",
        duration: "1s",
      },
    ],
  },
  {
    id: "tr_4d20a8",
    task: "Release notes 2.3",
    person: "Sam Lee",
    when: "Mon, 11:05 AM",
    steps: 9,
    duration: "54s",
    timeline: completed("Saved release-notes-2.3.md"),
  },
  {
    id: "tr_3c8e17",
    task: "Flaky test triage",
    person: "Sam Lee",
    when: "Fri, 2:37 PM",
    steps: 12,
    duration: "1m 12s",
    timeline: completed("Saved flaky-tests.csv"),
  },
  {
    id: "tr_2e58b4",
    task: "Onboarding doc refresh",
    person: "Sam Lee",
    when: "Thu, 10:18 AM",
    steps: 6,
    duration: "28s",
    timeline: completed("Saved the updated onboarding document"),
  },
];
export const automation = {
  name: "Weekly expired-session cleanup",
  schedule: "Every Monday, 6:00 AM PT",
  owner: "Sam Lee",
  location: "On this device",
  last: "Mon, Nov 16 · 6:00 AM PT",
  next: "Mon, Nov 23 · 6:00 AM PT",
  result: "Deleted 4,112 expired rows, 1 step blocked: drop_table not granted",
  trace: {
    id: "tr_9b7e16",
    task: "Weekly expired-session cleanup",
    person: "Sam Lee",
    when: "Mon, Nov 16 · 6:00 AM PT",
    steps: 5,
    duration: "24s",
    blocked: true,
    timeline: cleanupSteps.map((step) => ({
      ...step,
      outcome: step.outcome
        .replaceAll("18,204", "4,112")
        .replace("Nov 19", "Nov 16"),
    })),
  } satisfies Trace,
};
export const models = [
  {
    name: run.model,
    provider: "Anthropic",
    groups: "Engineering, Support",
    spend: 742.1,
    enabled: true,
  },
  {
    name: "GPT-4.1",
    provider: "OpenAI",
    groups: "Engineering, Finance",
    spend: 388.65,
    enabled: true,
  },
  {
    name: "GPT-4o mini",
    provider: "OpenAI",
    groups: "Support",
    spend: 41.2,
    enabled: true,
  },
  {
    name: "Llama 3.3 70B",
    provider: "Self-hosted",
    groups: "Engineering",
    spend: 112.55,
    enabled: true,
  },
  {
    name: "Gemini 2.5 Pro",
    provider: "Google",
    groups: "—",
    spend: 0,
    enabled: false,
  },
];
export const skills = [
  {
    name: "Database cleanup checklist",
    version: "1.3",
    description: "Steps for safe data cleanup",
    group: "Engineering",
    files: ["SKILL.md", "checklist.md", "examples/"],
    history: "v1.3 Nov 14 · v1.2 Oct 30",
  },
  {
    name: "Weekly status",
    version: "2.0",
    description: "Turns merged work into a status note",
    group: "Engineering",
    files: ["SKILL.md", "examples/"],
    history: "v2.0 Nov 17 · v1.9 Nov 3",
  },
  {
    name: "Release notes",
    version: "1.2",
    description: "Drafts notes from merged pull requests",
    group: "Engineering",
    files: ["SKILL.md", "examples/"],
    history: "v1.2 Nov 13 · v1.1 Oct 24",
  },
  {
    name: "Invoice review",
    version: "1.0",
    description: "Checks invoices against the PO",
    group: "Finance",
    files: ["SKILL.md", "checklist.md"],
    history: "v1.0 Nov 10 · v0.9 Oct 28",
  },
  {
    name: "Ticket summary",
    version: "1.4",
    description: "Summarizes long support threads",
    group: "Support",
    files: ["SKILL.md", "examples/"],
    history: "v1.4 Nov 16 · v1.3 Nov 2",
  },
  {
    name: "Meeting notes",
    version: "0.9",
    description: "Clean notes with owners and dates",
    group: "Everyone",
    files: ["SKILL.md", "examples/"],
    history: "v0.9 Nov 12 · v0.8 Oct 29",
  },
];
export const connections = [
  {
    name: run.database,
    context: "PostgreSQL",
    group: "Engineering",
    tools: [
      {
        name: "list_tables",
        description: "See table names",
        access: "Read",
        allowed: true,
      },
      {
        name: "run_select",
        description: "Read rows",
        access: "Read",
        allowed: true,
      },
      {
        name: "insert_rows",
        description: "Add rows",
        access: "Write",
        allowed: true,
      },
      {
        name: "update_rows",
        description: "Change rows",
        access: "Write",
        allowed: true,
      },
      {
        name: "delete_rows",
        description: "Remove rows",
        access: "Write",
        allowed: true,
      },
      {
        name: "drop_table",
        description: "Delete a whole table",
        access: "Not granted",
        allowed: false,
      },
      {
        name: "alter_table",
        description: "Change a table's structure",
        access: "Not granted",
        allowed: false,
      },
    ],
  },
  {
    name: "GitHub",
    context: "acme/web",
    group: "Engineering",
    tools: [
      {
        name: "list_pull_requests",
        description: "Read pull requests",
        access: "Read",
        allowed: true,
      },
      {
        name: "read_file",
        description: "Read a file",
        access: "Read",
        allowed: true,
      },
      {
        name: "merge_pull_request",
        description: "Merge a pull request",
        access: "Not granted",
        allowed: false,
      },
    ],
  },
  {
    name: "Slack",
    context: "#eng-ops",
    group: "Engineering, On-call",
    tools: [
      {
        name: "post_message",
        description: "Post to #eng-ops",
        access: "Post",
        allowed: true,
      },
      {
        name: "read_dms",
        description: "Read direct messages",
        access: "Not granted",
        allowed: false,
      },
    ],
  },
  {
    name: "Help desk",
    context: "Support",
    group: "Support",
    tools: [
      {
        name: "read_ticket",
        description: "Read a ticket",
        access: "Read",
        allowed: true,
      },
      {
        name: "add_note",
        description: "Add a note",
        access: "Write",
        allowed: true,
      },
      {
        name: "close_ticket",
        description: "Close a ticket",
        access: "Not granted",
        allowed: false,
      },
    ],
  },
] as const;
export const people = [
  {
    name: "Maya Ortiz",
    email: "maya@acme.example",
    groups: "Admins",
    role: "Admin",
    active: "Now",
    access: "Glaux Control Tower; models and tools granted to Admins",
    visibility:
      "Her own traces; Engineering and Acme workspace traces by explicit grant",
  },
  {
    name: "Sam Lee",
    email: "sam@acme.example",
    groups: "Engineering",
    role: "Member",
    active: "9:42 AM",
    access:
      "3 models · 3 skills · Acme production database: read + write; GitHub: read; Slack #eng-ops: post",
    visibility: "His own traces; Engineering admins with access",
  },
  {
    name: "Jordan Kim",
    email: "jordan@acme.example",
    groups: "Engineering",
    role: "Member",
    active: "9:15 AM",
    access:
      "3 models · 3 skills · Acme production database: read + write; GitHub: read; Slack #eng-ops: post",
    visibility: "Own traces; Engineering admins with access",
  },
  {
    name: "Elena Rossi",
    email: "elena@acme.example",
    groups: "Finance",
    role: "Member",
    active: "Yesterday",
    access: "Spreadsheets · 2 models · Invoice review",
    visibility: "Own traces; workspace viewers with access",
  },
  {
    name: "Marcus Chen",
    email: "marcus@acme.example",
    groups: "Engineering, On-call",
    role: "Member",
    active: "Yesterday",
    access:
      "3 models · GitHub · Acme production database: read + write · Slack #eng-ops",
    visibility: "Own traces; Engineering admins with access",
  },
  {
    name: "Aisha Bello",
    email: "aisha@acme.example",
    groups: "Support",
    role: "Member",
    active: "Mon",
    access: "Help desk · 2 models · Ticket summary",
    visibility: "Own traces; workspace viewers with access",
  },
  {
    name: "Tom Becker",
    email: "tom@acme.example",
    groups: "Finance",
    role: "Viewer",
    active: "Nov 12",
    access: "Spreadsheets · 2 models · Invoice review",
    visibility: "Own traces; workspace viewers with access",
  },
] as const;
export const groups = [
  {
    name: "Engineering",
    members: 3,
    access:
      "Acme production database (read + write), GitHub, Slack #eng-ops, 3 models",
  },
  { name: "Finance", members: 2, access: "Spreadsheets, 2 models" },
  { name: "Support", members: 1, access: "Help desk, 2 models" },
  { name: "On-call", members: 1, access: "Slack #eng-ops" },
  { name: "Admins", members: 1, access: "Glaux Control Tower" },
];
export const teamTraces: Trace[] = [
  traces[0],
  {
    id: "tr_7a30d1",
    person: "Jordan Kim",
    task: "API latency report",
    when: "Today, 9:15 AM",
    steps: 8,
    duration: "36s",
    timeline: completed("Saved the API latency report"),
  },
  {
    ...traces[3],
    id: "tr_3c8e18",
    person: "Marcus Chen",
    when: "Yesterday, 6:20 PM",
  },
  traces[1],
];
export const workspaceTraces: Trace[] = [
  ...teamTraces,
  {
    id: "tr_1a90c3",
    person: "Elena Rossi",
    task: "Invoice review, batch 77",
    when: "Yesterday, 3:02 PM",
    steps: 6,
    duration: "29s",
    timeline: completed("Reviewed batch 77"),
  },
  {
    id: "tr_5e74b9",
    person: "Aisha Bello",
    task: "Ticket summary #4821",
    when: "Yesterday, 1:47 PM",
    steps: 3,
    duration: "18s",
    timeline: completed("Added a ticket summary"),
  },
  {
    id: "tr_0b12e6",
    person: "Tom Becker",
    task: "Month-end checklist",
    when: "Mon, 5:30 PM",
    steps: 9,
    duration: "48s",
    timeline: completed("Saved the month-end checklist"),
  },
];
export const ownTraces: Trace[] = [
  {
    id: "tr_6d42f0",
    person: "Maya Ortiz",
    task: "Audit export for Q4",
    when: "Today, 8:55 AM",
    steps: 4,
    duration: "16s",
    timeline: completed("Exported the Q4 audit log"),
  },
];
export const artifacts = [
  {
    name: "cleanup-summary.md",
    task: run.task,
    when: "Today, 9:43 AM",
    content:
      "# Expired sessions cleanup\n\n- Removed 18,204 expired sessions (before Nov 19)\n- Did not drop sessions_archive: not part of this database access\n- Next: ask an admin if the archive table should go",
  },
  {
    name: "weekly-status-nov-18.md",
    task: "Weekly status draft",
    when: "Yesterday",
    content:
      "# Weekly status\n\n23 pull requests merged in acme/web.\n\n- Shipped the account settings update\n- Resolved the session timeout issue\n- Next: review the release checklist",
  },
  {
    name: "release-notes-2.3.md",
    task: "Release notes 2.3",
    when: "Mon",
    content:
      "# Release 2.3\n\n- Clearer account settings\n- Faster sign-in\n- Fixed session timeouts",
  },
  {
    name: "flaky-tests.csv",
    task: "Flaky test triage",
    when: "Fri",
    content:
      "test,retries,result\nsign-in redirect,2,passed\nsession expiry,1,passed\naccount settings,3,needs review",
  },
];
export const auditEvents = [
  {
    when: "Today, 8:58 AM",
    what: "Exported the Q4 audit log",
    before: "Q4 audit records",
    after: "Export created",
    timestamp: "Nov 19, 2026 8:58:12 AM PT",
    id: "evt_8c42e901",
  },
  {
    when: "Nov 18, 3:21 PM",
    what: "Turned off Gemini 2.5 Pro for Acme",
    before: "Gemini 2.5 Pro: enabled",
    after: "Off",
    timestamp: "Nov 18, 2026 3:21:44 PM PT",
    id: "evt_7b23f610",
  },
  {
    when: "Nov 17, 11:04 AM",
    what: "Added Marcus Chen to On-call",
    before: "Marcus: Engineering",
    after: "Engineering, On-call",
    timestamp: "Nov 17, 2026 11:04:02 AM PT",
    id: "evt_6a91d330",
  },
  {
    when: "Nov 14, 2:12 PM",
    what: "Published Database cleanup checklist v1.3",
    before: "Version 1.2",
    after: "Version 1.3",
    timestamp: "Nov 14, 2026 2:12:38 PM PT",
    id: "evt_5c72b414",
  },
  {
    when: "Nov 13, 9:40 AM",
    what: "Gave Engineering admins access to Engineering traces",
    before: "Engineering traces: own only",
    after: "Engineering admins: explicit group trace access",
    timestamp: "Nov 13, 2026 9:40:17 AM PT",
    id: "evt_4e83c012",
  },
  {
    when: "Nov 12, 4:47 PM",
    what: "Granted Engineering read + write on Acme production database",
    before: "Engineering: no access",
    after: "list_tables, run_select, insert_rows, update_rows, delete_rows",
    timestamp: "Nov 12, 2026 4:47:09 PM PT",
    id: "evt_31d9a07c",
    note: "drop_table, alter_table: not granted",
  },
  {
    when: "Nov 12, 4:45 PM",
    what: "Connected Acme production database",
    before: "No connection",
    after: "Acme production database connected",
    timestamp: "Nov 12, 2026 4:45:31 PM PT",
    id: "evt_2b14e519",
  },
];
