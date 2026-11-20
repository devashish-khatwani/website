import { assert, expect, test } from "vitest";
import {
  gatewayUsage,
  gatewayWeek,
  gatewayWeekTotals,
  ownTraces,
  sessions,
  teamTraces,
  weekEnd,
  weekStart,
  workspaceTraces,
} from "../../src/lib/content/product-mock-dataset";
import {
  money,
  allocateCosts,
  displayTraceCosts,
  p95,
  series,
  statistics,
  usageTotals,
} from "../../src/lib/content/product-mock-metrics";
import {
  automation,
  groups,
  models,
  people,
  run,
} from "../../src/lib/content/product-mocks";

test("mock money has exactly two decimals, including half cents and thousands", () => {
  for (const [millis, expected] of [
    [0, "$0.00"],
    [5, "$0.01"],
    [3333, "$3.33"],
    [3717, "$3.72"],
    [7050, "$7.05"],
    [299720, "$299.72"],
    [1284500, "$1,284.50"],
  ] as const)
    expect(money(millis)).toBe(expected);
});

test("display cents reconcile models, trace rows and sessions without changing source facts", () => {
  expect(allocateCosts([3333, 3717]).map(money)).toEqual(["$3.33", "$3.72"]);
  expect(allocateCosts([5, 5])).toEqual([10, 0]);
  expect(allocateCosts([0, 0])).toEqual([0, 0]);
  expect(allocateCosts([])).toEqual([]);
  for (const raw of [ownTraces, teamTraces, workspaceTraces]) {
    for (const selected of [
      raw,
      raw.filter((t) => t.time.startsWith("2026-11-19")),
      raw.filter((t) => t.error),
      [],
    ]) {
      const original = selected.map((t) => t.costMillis);
      const displayed = displayTraceCosts(selected);
      const total = statistics(displayed).cost;
      expect(total).toBe(Math.round(statistics(selected).cost / 10) * 10);
      expect(
        displayed.every((t) => t.costMillis >= 0 && t.costMillis % 10 === 0),
      ).toBe(true);
      expect(
        sessions(displayed).reduce(
          (sum, session) => sum + session.stats.cost,
          0,
        ),
      ).toBe(total);
      const byModel = models.map(
        (m) => statistics(displayed.filter((t) => t.model === m.name)).cost,
      );
      expect(byModel.reduce((a, b) => a + b, 0)).toBe(total);
      expect(selected.map((t) => t.costMillis)).toEqual(original);
    }
  }
  for (const days of [1, 7, 30, 90]) {
    const start = new Date(Date.parse("2026-11-19") - (days - 1) * 86400000)
      .toISOString()
      .slice(0, 10);
    const rows = gatewayUsage.filter((r) => r.date >= start);
    const costs = allocateCosts(
      models.map(
        (m) => usageTotals(rows.filter((r) => r.model === m.name)).costMillis,
      ),
    );
    expect(costs.reduce((a, b) => a + b, 0)).toBe(
      Math.round(usageTotals(rows).costMillis / 10) * 10,
    );
    for (const cost of costs) expect(money(cost)).toMatch(/^\$[\d,]+\.\d{2}$/u);
  }
});

test("summaries use unique sessions, integer spend and nearest-rank p95, including empty buckets", () => {
  expect(p95(Array.from({ length: 20 }, (_, i) => i + 1))).toBe(19);
  expect(statistics([])).toMatchObject({
    count: 0,
    sessions: 0,
    latency: 0,
    cost: 0,
    errors: 0,
  });
  for (const rows of [ownTraces, teamTraces, workspaceTraces]) {
    const stats = statistics(rows);
    expect(stats.sessions).toBeLessThan(stats.count);
    expect(stats.cost).toBe(rows.reduce((sum, row) => sum + row.costMillis, 0));
    const buckets = series(
      rows,
      Date.parse(`${weekStart}Z`),
      Date.parse(`${weekEnd}Z`),
    );
    expect(buckets).toHaveLength(18);
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(stats.count);
    expect(buckets.reduce((sum, b) => sum + b.cost, 0)).toBe(stats.cost);
    expect(new Set(buckets.map((b) => b.count)).size).toBeGreaterThan(2);
    expect(buckets.every((b) => Number.isFinite(b.latency))).toBe(true);
    expect(
      buckets.every((b) => b.count > 0 && b.latency > 0 && b.cost > 0),
    ).toBe(true);
  }
});

test("the week has coherent people, multi-turn sessions and the preserved manual and scheduled stories", () => {
  expect(new Set(workspaceTraces.map((t) => t.id)).size).toBe(288);
  expect(sessions(workspaceTraces)).toHaveLength(50);
  expect(statistics(ownTraces)).toMatchObject({
    count: 72,
    sessions: 12,
    errors: 2,
    blocked: 2,
  });
  for (const t of workspaceTraces) {
    expect(t.time >= weekStart && t.time <= weekEnd).toBe(true);
    const person = people.find((p) => p.name === t.person);
    expect(person?.email).toMatch(/@acme\.example$/u);
    expect(t.group).toBe(person?.groups);
    expect(t.error && t.blocked).toBe(false);
    expect(t.timeline.some((s) => s.blocked)).toBe(t.blocked);
    expect(t.steps).toBe(t.timeline.length);
  }
  for (const session of sessions(workspaceTraces))
    expect(new Set(session.traces.map((t) => t.person)).size).toBe(1);
  for (const group of groups)
    expect(group.members).toBe(
      people.filter((p) => p.groups.split(", ").includes(group.name)).length,
    );
  const manual = workspaceTraces.find((t) => t.id === "tr_8f2c41");
  assert(manual);
  expect(manual).toMatchObject({
    person: "Sam Lee",
    when: "Today, 9:42 AM",
    model: run.model,
    input: run.prompt,
    output: run.reply,
    blocked: true,
  });
  const scheduled = workspaceTraces.find((t) => t.id === automation.trace.id);
  assert(scheduled);
  expect(scheduled.sessionId).not.toBe(manual.sessionId);
  expect(scheduled.output).toContain("4,112");
});

test("Gateway week includes trace calls plus other traffic and preserves exact month/model budgets", () => {
  expect(gatewayWeekTotals).toMatchObject({
    requests: 29965,
    costMillis: 299720,
    tokens: 4900000,
    failures: 18,
  });
  for (const row of gatewayUsage)
    for (const value of [
      row.costMillis,
      row.requests,
      row.tokens,
      row.failures,
      row.inputTokens,
      row.outputTokens,
      row.cachedInputTokens,
      row.cacheWriteTokens,
    ])
      expect(Number.isInteger(value) && value >= 0).toBe(true);
  for (const row of gatewayUsage) {
    expect(row.inputTokens + row.outputTokens).toBe(row.tokens);
    expect(row.cachedInputTokens + row.cacheWriteTokens).toBeLessThanOrEqual(
      row.inputTokens,
    );
  }
  for (const model of models) {
    const month = usageTotals(
      gatewayUsage.filter(
        (r) => r.model === model.name && r.date >= "2026-11-01",
      ),
    );
    expect(month.costMillis).toBe(Math.round(model.spend * 1000));
    expect(month.requests).toBe(model.requests);
    expect(month.inputTokens + month.outputTokens).toBe(month.tokens);
    expect(month.cachedInputTokens).toBe(
      gatewayUsage
        .filter((r) => r.model === model.name && r.date >= "2026-11-01")
        .reduce((sum, row) => sum + row.cachedInputTokens, 0),
    );
  }
  for (const row of gatewayWeek) {
    const traces = statistics(
      workspaceTraces.filter(
        (t) => t.model === row.model && t.time.startsWith(row.date),
      ),
    );
    expect(row.requests).toBeGreaterThanOrEqual(traces.requests);
    expect(row.costMillis).toBeGreaterThanOrEqual(traces.cost);
    expect(row.tokens).toBeGreaterThanOrEqual(traces.tokens);
  }
});
