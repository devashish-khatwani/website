import {
  automation,
  models,
  people,
  run,
  traces,
  type Trace,
} from "./product-mocks";
import {
  statistics,
  usageTotals,
  type TraceFact,
  type Usage,
} from "./product-mock-metrics";

function entry<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new Error(`Missing example entry: ${index}`);
  return item;
}

// Fixed PT wall-clock labels keep this fictional week stable in every visitor's timezone.
export const weekStart = "2026-11-13T00:00";
export const weekEnd = "2026-11-19T23:59";
export type ExampleTrace = Trace &
  TraceFact & { input: string; output: string };
const participants = [
  "Maya Ortiz",
  "Sam Lee",
  "Jordan Kim",
  "Maya Ortiz",
  "Marcus Chen",
  "Sam Lee",
  "Aisha Bello",
  "Maya Ortiz",
  "Jordan Kim",
  "Sam Lee",
  "Marcus Chen",
  "Aisha Bello",
];
const topics = [
  "Audit export for Q4",
  "Database health report",
  "API latency report",
  "Access review summary",
  "Flaky test triage",
  "Release readiness check",
  "Ticket summary #4821",
  "Workspace activity review",
  "Release notes 2.3",
  "Weekly status draft",
  "Incident handoff",
  "Support queue trends",
];
const questions = [
  "Prepare the report from the approved sources.",
  "What changed since the last check?",
  "Show the supporting sources.",
  "Which part needs attention?",
  "Check the proposed next steps.",
  "Save the summary with owners and next steps.",
];
const answers = [
  "Prepared a report with the key findings.",
  "Compared the latest activity and highlighted two changes.",
  "Linked three approved sources to the findings.",
  "Flagged the items that need a teammate's review.",
  "Checked the next steps against the available access.",
  "Saved the summary with owners and next steps.",
];
export const workspaceTraces: ExampleTrace[] = Array.from(
  { length: 288 },
  (_, i) => {
    const session = Math.floor(i / 6),
      turn = i % 6,
      topic = session % participants.length;
    const person = entry(participants, topic);
    const group = people.find((p) => p.name === person)?.groups ?? "";
    const model = entry(
      models,
      person === "Aisha Bello" ? 2 : (session + turn) % 2,
    ).name;
    const durationSeconds = Number((8.3 + ((i * 13.29) % 77)).toFixed(2));
    const error = (i > 0 && i % 61 === 0) || i === 73 || i === 145,
      blocked = i % 83 === 9;
    const task = entry(topics, topic);
    const output = error
      ? "The approved source timed out. The run stopped before saving a final result."
      : blocked
        ? "The requested change is outside this person's access. The source was left unchanged."
        : entry(answers, turn);
    const input =
      turn === 0 ? `${task}. ${questions[turn]}` : entry(questions, turn);
    return {
      id: `tr_${(0xa40000 + i * 173).toString(16)}`,
      sessionId: `sess_${(0xb500 + session).toString(16)}`,
      person,
      group,
      model,
      time: "",
      task,
      input,
      output,
      error,
      blocked,
      when: "",
      durationSeconds,
      duration: `${durationSeconds}s`,
      steps: 3,
      tokens: 830 + ((i * 1739) % 12000),
      costMillis: 9 + ((i * 29) % 183),
      requests: 2 + (i % 11),
      timeline: [
        {
          name: "Plan",
          outcome: input,
          duration: `${(durationSeconds * 0.15).toFixed(2)}s`,
        },
        {
          name: "Read approved sources",
          outcome: error ? output : "Read the available records",
          duration: `${(durationSeconds * 0.6).toFixed(2)}s`,
        },
        {
          name: blocked ? "Check access" : "Prepare response",
          outcome: output,
          duration: `${(durationSeconds * 0.25).toFixed(2)}s`,
          blocked,
        },
      ],
      search: "",
    };
  },
);
// Spread each person's sessions across the week, with a gentle change in daily density.
for (const person of new Set(participants)) {
  const rows = workspaceTraces.filter((t) => t.person === person);
  const start = Date.parse(`${weekStart}Z`),
    end = Date.parse(`${weekEnd}Z`);
  rows.forEach((trace, index) => {
    const progress =
      (Math.floor(index / 6) * 6 + 5 - (index % 6) + 0.5) / rows.length;
    trace.time = new Date(
      end -
        (end - start) * (progress + 0.035 * Math.sin(2 * Math.PI * progress)),
    )
      .toISOString()
      .slice(0, 16);
  });
}
for (const [index, original, time, sessionId] of [
  [
    0,
    {
      ...entry(workspaceTraces, 0),
      id: "tr_6d42f0",
      task: "Audit export for Q4",
    },
    "2026-11-19T08:55",
    "sess_b500",
  ],
  [6, traces[0], "2026-11-19T09:42", "sess_cleanup_manual"],
  [30, automation.trace, "2026-11-16T06:00", "sess_cleanup_scheduled"],
] as const) {
  const seeded = entry(workspaceTraces, index);
  workspaceTraces[index] = {
    ...seeded,
    ...original,
    time,
    sessionId,
    durationSeconds: parseFloat(original.duration),
    blocked: Boolean(original.blocked),
    error: false,
    model: index === 0 ? seeded.model : run.model,
    when: index === 0 ? "Today, 8:55 AM" : original.when,
    input:
      index === 6
        ? run.prompt
        : index === 30
          ? "Run the weekly expired-session cleanup."
          : "Export the Q4 audit log and summarize the changes.",
    output:
      index === 6
        ? run.reply
        : index === 30
          ? automation.result
          : "Exported the Q4 audit log.",
  };
}
for (const trace of workspaceTraces) {
  if (trace.id !== automation.trace.id)
    trace.when = `${trace.time.startsWith("2026-11-19") ? "Today" : trace.time.startsWith("2026-11-18") ? "Yesterday" : `Nov ${Number(trace.time.slice(8, 10))}`}, ${new Date(`${trace.time}Z`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" })}`;
  trace.search =
    `${trace.id} ${trace.task} ${trace.person} ${trace.model} ${trace.input} ${trace.output} ${trace.timeline.map((s) => s.outcome).join(" ")}`.toLowerCase();
}
workspaceTraces.sort((a, b) => b.time.localeCompare(a.time));
export const ownTraces = workspaceTraces.filter(
  (t) => t.person === "Maya Ortiz",
);
export const teamTraces = workspaceTraces.filter((t) =>
  t.group.split(", ").includes("Engineering"),
);
export function sessions(rows: ExampleTrace[]) {
  const grouped = new Map<string, ExampleTrace[]>();
  for (const trace of rows)
    grouped.set(trace.sessionId, [
      ...(grouped.get(trace.sessionId) ?? []),
      trace,
    ]);
  return [...grouped].map(([id, traces]) => ({
    id,
    traces: traces.sort((a, b) => a.time.localeCompare(b.time)),
    stats: statistics(traces),
    first: entry(traces, 0),
    latest: entry(traces, traces.length - 1),
  }));
}

// Integer allocation keeps day/model sums exact, including the monthly budget snapshot.
function allocate(total: number, weights: number[], index: number) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const before = weights.slice(0, index).reduce((a, b) => a + b, 0);
  return (
    Math.round((total * (before + entry(weights, index))) / sum) -
    Math.round((total * before) / sum)
  );
}
const weights = [11, 7, 5, 16, 14, 20, 17];
export const gatewayUsage: Usage[] = models.flatMap((model, modelIndex) => {
  const week = {
    requests: Math.round((model.requests * 7) / 30),
    tokens: Math.round((model.tokens * 7) / 30),
    costMillis: Math.round(model.spend * (7 / 30) * 100) * 10,
    failures: entry([7, 5, 4, 2, 0], modelIndex),
  };
  const traced = statistics(
    workspaceTraces.filter((t) => t.model === model.name),
  );
  return Array.from({ length: 90 }, (_, i) => {
    const date = new Date(Date.parse("2026-11-19T00:00Z") - (89 - i) * 86400000)
      .toISOString()
      .slice(0, 10);
    const day = Number(date.slice(-2));
    const rows = workspaceTraces.filter(
      (t) => t.model === model.name && t.time.startsWith(date),
    );
    const daily = statistics(rows);
    const weekIndex = day - 13;
    const inWeek = date >= "2026-11-13";
    const earlyMonth = date >= "2026-11-01" && !inWeek;
    const value = (
      key: "requests" | "tokens" | "costMillis",
      monthly: number,
    ) =>
      inWeek
        ? (key === "costMillis" ? daily.cost : daily[key]) +
          allocate(
            week[key] - (key === "costMillis" ? traced.cost : traced[key]),
            weights,
            weekIndex,
          )
        : earlyMonth
          ? allocate(
              monthly - week[key],
              Array.from({ length: 12 }, (_, n) => 8 + (n % 5)),
              day - 1,
            )
          : Math.round(monthly / 30);
    const tokens = value("tokens", model.tokens);
    const inputTokens = Math.round(
      tokens * (0.67 + ((modelIndex * 7 + day) % 12) / 100),
    );
    return {
      date,
      model: model.name,
      requests: value("requests", model.requests),
      tokens,
      inputTokens,
      outputTokens: tokens - inputTokens,
      cachedInputTokens: Math.round(inputTokens * (0.18 + (day % 5) / 100)),
      cacheWriteTokens: Math.round(inputTokens * 0.03),
      costMillis: value("costMillis", Math.round(model.spend * 1000)),
      failures: inWeek
        ? allocate(week.failures, weights, weekIndex)
        : Math.round((model.requests / 30) * 0.0006),
    };
  });
});
export const gatewayWeek = gatewayUsage.filter((r) => r.date >= "2026-11-13");
export const gatewayWeekTotals = usageTotals(gatewayWeek);
