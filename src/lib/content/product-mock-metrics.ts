export type TraceFact = {
  id: string;
  sessionId: string;
  person: string;
  group: string;
  time: string;
  durationSeconds: number;
  costMillis: number;
  tokens: number;
  requests: number;
  model: string;
  blocked: boolean;
  error: boolean;
  search: string;
};

export const money = (millis: number) =>
  (Math.round(millis / 10) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

// Allocate display cents cumulatively so every breakdown preserves its rounded total.
export function allocateCosts(
  parts: number[],
  total = parts.reduce((a, b) => a + b, 0),
) {
  const sum = parts.reduce((a, b) => a + b, 0);
  let cumulative = 0,
    previous = 0;
  return parts.map((part) => {
    cumulative += part;
    const next = sum
      ? Math.round((Math.round(total / 10) * cumulative) / sum)
      : 0;
    const cost = (next - previous) * 10;
    previous = next;
    return cost;
  });
}

export function displayTraceCosts<T extends TraceFact>(rows: T[]): T[] {
  const models = [...new Set(rows.map((row) => row.model))];
  const groups = models.map((model) =>
    rows.filter((row) => row.model === model),
  );
  const modelCosts = allocateCosts(
    groups.map((group) => group.reduce((sum, row) => sum + row.costMillis, 0)),
  );
  const costs = new Map<T, number>();
  groups.forEach((group, i) => {
    const parts = allocateCosts(
      group.map((row) => row.costMillis),
      modelCosts[i],
    );
    group.forEach((row, j) => costs.set(row, parts[j] ?? 0));
  });
  return rows.map((row) => ({ ...row, costMillis: costs.get(row) ?? 0 }));
}
export const p95 = (values: number[]) =>
  [...values].sort((a, b) => a - b)[
    Math.max(0, Math.ceil(values.length * 0.95) - 1)
  ] ?? 0;

export function statistics(rows: TraceFact[]) {
  return {
    count: rows.length,
    sessions: new Set(rows.map((t) => t.sessionId)).size,
    tokens: rows.reduce((sum, t) => sum + t.tokens, 0),
    cost: rows.reduce((sum, t) => sum + t.costMillis, 0),
    requests: rows.reduce((sum, t) => sum + t.requests, 0),
    blocked: rows.filter((t) => t.blocked).length,
    errors: rows.filter((t) => t.error).length,
    latency: p95(rows.map((t) => t.durationSeconds)),
    models: new Set(rows.map((t) => t.model)).size,
  };
}

export function series(rows: TraceFact[], start: number, end: number) {
  const buckets = Array.from({ length: 18 }, () => [] as TraceFact[]);
  for (const row of rows) {
    const time = Date.parse(`${row.time}Z`);
    if (time < start || time > end) continue;
    buckets[
      Math.min(17, Math.floor(((time - start) / Math.max(end - start, 1)) * 18))
    ]?.push(row);
  }
  return buckets.map(statistics);
}

export type Usage = {
  date: string;
  model: string;
  requests: number;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  cacheWriteTokens: number;
  costMillis: number;
  failures: number;
};
export function usageTotals(rows: Usage[]) {
  return rows.reduce(
    (sum, row) => ({
      requests: sum.requests + row.requests,
      tokens: sum.tokens + row.tokens,
      costMillis: sum.costMillis + row.costMillis,
      failures: sum.failures + row.failures,
      inputTokens: sum.inputTokens + row.inputTokens,
      outputTokens: sum.outputTokens + row.outputTokens,
      cachedInputTokens: sum.cachedInputTokens + row.cachedInputTokens,
      cacheWriteTokens: sum.cacheWriteTokens + row.cacheWriteTokens,
    }),
    {
      requests: 0,
      tokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      cachedInputTokens: 0,
      cacheWriteTokens: 0,
      costMillis: 0,
      failures: 0,
    },
  );
}
