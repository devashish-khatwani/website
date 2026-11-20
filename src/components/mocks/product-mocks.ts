export {};
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const frames = [...document.querySelectorAll<HTMLElement>("[data-mock]")];
const desktop = frames.find((frame) => frame.dataset.mock === "desktop");
let finishDemo = () => {};
function required<T extends Element = HTMLElement>(
  root: ParentNode,
  selector: string,
): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing mock element: ${selector}`);
  return element;
}

function selectPane(
  frame: HTMLElement,
  id: string,
  updateHash = true,
  stopDemo = true,
) {
  const pane = frame.querySelector<HTMLElement>(`[data-pane="${id}"]`);
  if (!pane) return;
  if (frame === desktop && stopDemo) finishDemo();
  if (!pane.querySelector("[data-access-open]")) closeAccess(frame, false);
  frame.querySelectorAll<HTMLElement>("[data-pane]").forEach((item) => {
    item.hidden = item !== pane;
  });
  const buttons = frame.querySelectorAll<HTMLButtonElement>("[data-view]");
  buttons.forEach((button) => {
    const active = button.dataset.view === id;
    button.setAttribute("aria-pressed", String(active));
    if (active) {
      const region = required<HTMLElement>(frame, ".mock-main");
      region.setAttribute(
        "aria-label",
        `${button.querySelector("span")?.textContent}, with example data`,
      );
      const nav = button.closest("nav");
      if (!nav) return;
      if (nav.scrollWidth > nav.clientWidth) {
        nav.scrollTo({
          left:
            button.offsetLeft -
            nav.offsetLeft -
            (nav.clientWidth - button.offsetWidth) / 2,
          behavior: "instant",
        });
      }
    }
  });
  frame.parentElement
    ?.querySelectorAll<HTMLElement>("[data-caption]")
    .forEach((caption) => {
      caption.hidden = caption.dataset.caption !== id;
    });
  if (updateHash) history.replaceState(history.state, "", `#feature-${id}`);
  return required<HTMLElement>(frame, ".mock-main");
}

function closeAccess(frame: HTMLElement, restoreFocus = true) {
  const panel = frame.querySelector<HTMLElement>("[data-access-open]");
  if (!panel) return false;
  panel.hidden = true;
  delete panel.dataset.accessOpen;
  panel.parentElement?.classList.remove("has-access");
  const opener = frame.querySelector<HTMLButtonElement>("[data-open-access]");
  opener?.setAttribute("aria-expanded", "false");
  if (restoreFocus) opener?.focus({ preventScroll: true });
  return true;
}

function closeDetails(browser: HTMLElement, restoreFocus = true) {
  const open = browser.querySelector<HTMLButtonElement>(
    '[data-open][aria-expanded="true"]',
  );
  browser.querySelectorAll<HTMLElement>("[data-detail]").forEach((panel) => {
    panel.hidden = true;
  });
  browser
    .querySelectorAll("[data-open]")
    .forEach((button) => button.setAttribute("aria-expanded", "false"));
  browser.classList.remove("has-detail");
  if (restoreFocus) open?.focus({ preventScroll: true });
}

function openDetails(button: HTMLButtonElement) {
  const browser = button.closest<HTMLElement>("[data-browser]");
  if (!browser) return;
  const id = button.dataset.open;
  browser.querySelectorAll<HTMLElement>("[data-detail]").forEach((panel) => {
    panel.hidden = panel.id !== id;
    if (!panel.hidden) panel.focus({ preventScroll: true });
  });
  browser
    .querySelectorAll<HTMLButtonElement>("[data-open]")
    .forEach((row) =>
      row.setAttribute("aria-expanded", String(row === button)),
    );
  browser.classList.add("has-detail");
}

function selectTab(root: HTMLElement, id: string) {
  for (const item of root.querySelectorAll<HTMLElement>(
    "[data-tab], [data-tab-panel]",
  )) {
    if (item.closest("[data-tabs]") !== root) continue;
    if (item.dataset.tab)
      item.setAttribute("aria-pressed", String(item.dataset.tab === id));
    else item.hidden = item.dataset.tabPanel !== id;
  }
}

function updateUsage(root: HTMLElement) {
  const period = required<HTMLSelectElement>(root, "[data-usage-period]").value;
  const start = required<HTMLInputElement>(root, "[data-usage-start]");
  const end = required<HTMLInputElement>(root, "[data-usage-end]");
  required(root, "[data-usage-dates]").hidden = period !== "custom";
  if (period !== "custom") {
    end.value = "2026-11-19";
    start.value = new Date(
      Date.parse(end.value) - (Number(period) - 1) * 86400000,
    )
      .toISOString()
      .slice(0, 10);
  }
  const error = required(root, "[data-usage-error]");
  const invalid =
    !start.value ||
    !end.value ||
    start.value > end.value ||
    end.value > "2026-11-19";
  error.hidden = !invalid;
  error.textContent =
    !start.value || !end.value
      ? "Choose both a start and end date."
      : start.value > end.value
        ? "Start date must be on or before end date."
        : "Example usage is available through November 19, 2026.";
  for (const input of [start, end])
    input.setAttribute("aria-invalid", String(invalid));
  root.querySelectorAll<HTMLElement>("[data-usage-results]").forEach((el) => {
    el.hidden = invalid;
  });
  if (invalid) return;
  const factor =
    (1 + (Date.parse(end.value) - Date.parse(start.value)) / 86400000) / 30;
  const model = required<HTMLSelectElement>(root, "[data-usage-model]").value;
  const metric = required(root, '[data-usage-metric][aria-pressed="true"]')
    .dataset.usageMetric;
  const money = (value: number) =>
    value.toLocaleString("en-US", { style: "currency", currency: "USD" });
  let requests = 0,
    spend = 0,
    tokens = 0,
    count = 0,
    latency = "642 ms";
  const rows = [...root.querySelectorAll<HTMLElement>("[data-usage-row]")];
  rows.forEach((row) => {
    row.hidden = model !== "all" && row.dataset.usageRow !== model;
    if (row.hidden) return;
    count++;
    const r = Math.round(Number(row.dataset.requests) * factor);
    const s = Math.round(Number(row.dataset.spend) * factor * 100) / 100;
    const t = Number(row.dataset.tokens) * factor;
    requests += r;
    spend += s;
    tokens += t;
    if (model !== "all")
      latency = Number(row.dataset.latency) ? `${row.dataset.latency} ms` : "—";
    required(row, '[data-value="requests"]').textContent = r.toLocaleString();
    required(row, '[data-value="spend"]').textContent = money(s);
    required(row, '[data-value="tokens"]').textContent =
      `${(t / 1e6).toFixed(1)}M`;
  });
  for (const row of rows.filter((row) => !row.hidden)) {
    const share = requests
      ? (Math.round(Number(row.dataset.requests) * factor) / requests) * 100
      : 0;
    required(row, ".dash-share span").textContent = `${share.toFixed(1)}%`;
    required(row, ".dash-share i").style.width = `${share}%`;
  }
  const failures = Math.round(requests * 0.0006);
  required(root, "[data-usage-failures]").textContent =
    `${failures.toLocaleString()} failed requests`;
  for (const [key, value] of Object.entries({
    requests: requests.toLocaleString(),
    spend: money(spend),
    latency,
    success: requests
      ? `${((100 * (requests - failures)) / requests).toFixed(2)}%`
      : "—",
  }))
    required(root, `[data-usage-kpi="${key}"]`).textContent = value;
  required(root, "[data-usage-count]").textContent =
    `${count} ${count === 1 ? "model" : "models"}`;
  [14.8 / 21, 6.2 / 21, 4.1 / 21, 0.6 / 21].forEach((ratio, i) => {
    required(root, `[data-usage-token="${i}"]`).textContent =
      `${((tokens * ratio) / 1e6).toFixed(1)}M`;
  });
  const format = (value: string) =>
    new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  required(root, "[data-usage-range]").textContent =
    start.value.slice(0, 7) === end.value.slice(0, 7)
      ? `${format(start.value)}–${Number(end.value.slice(-2))}, ${end.value.slice(0, 4)}`
      : `${format(start.value)} – ${format(end.value)}, ${end.value.slice(0, 4)}`;
  const chart = required<SVGSVGElement>(root, ".dash-chart");
  chart.setAttribute(
    "aria-label",
    `${metric === "spend" ? "Spend" : "Requests"} over time, with example data`,
  );
  const total = metric === "spend" ? spend : requests;
  const weights =
    metric === "spend"
      ? [12, 17, 11, 20, 13, 15, 12]
      : [11, 15, 12, 16, 14, 18, 14];
  const max = (total * Math.max(...weights)) / 100;
  const points = weights
    .map(
      (w, i) =>
        `${40 + i * 90},${140 - (max ? ((total * w) / 100 / max) * 112 : 0)}`,
    )
    .join(" ");
  required(chart, "[data-chart-line]").setAttribute("points", points);
  required(chart, ".dash-chart-fill").setAttribute(
    "points",
    `40,140 ${points} 580,140`,
  );
  required(chart, ".dash-chart-previous").style.display =
    metric === "spend" || !total ? "none" : "";
  required(chart, ".dash-chart-previous").setAttribute(
    "points",
    weights
      .map(
        (w, i) =>
          `${40 + i * 90},${140 - (max ? ((total * w) / 100 / max) * 86 : 0)}`,
      )
      .join(" "),
  );
  required(root, ".dash-legend").textContent =
    metric === "spend"
      ? "● Estimated spend"
      : "● This period　┄ Previous period";
  required(chart, "[data-chart-max]").textContent =
    metric === "spend" ? money(max) : Math.round(max).toLocaleString();
  const dates = [
    Date.parse(start.value),
    (Date.parse(start.value) + Date.parse(end.value)) / 2,
    Date.parse(end.value),
  ];
  chart.querySelectorAll("[data-chart-tick]").forEach((tick, i) => {
    tick.textContent = new Date(dates[i] ?? 0).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  });
}

type ObserveTrace = {
  id: string;
  person: string;
  group: string;
  time: string;
  duration: number;
  cost: number;
  tokens: number;
  blocked: boolean;
  search: string;
};
function observeField(root: HTMLElement, key: string) {
  return required<HTMLInputElement | HTMLSelectElement>(
    root,
    `[data-observe-filter="${key}"]`,
  );
}
function setObserveField(root: HTMLElement, key: string, value: string) {
  root
    .querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      `[data-observe-filter="${key}"]`,
    )
    .forEach((field) => {
      field.value = value;
    });
}
function selectConversation(browser: HTMLElement, id?: string) {
  browser
    .querySelectorAll<HTMLElement>("[data-session-choice]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.sessionChoice === id),
      ),
    );
  browser
    .querySelectorAll<HTMLElement>("[data-session-panel]")
    .forEach((panel) => {
      panel.hidden = panel.dataset.sessionPanel !== id;
    });
}
function updateObservability(root: HTMLElement) {
  const period = observeField(root, "period").value;
  if (period !== "custom") {
    setObserveField(root, "end", "2026-11-19T18:00");
    setObserveField(
      root,
      "start",
      new Date(Date.parse("2026-11-19T18:00Z") - Number(period) * 86400000)
        .toISOString()
        .slice(0, 16),
    );
  }
  required(root, "[data-observe-dates]").hidden = period !== "custom";
  const start = Date.parse(`${observeField(root, "start").value}Z`),
    end = Date.parse(`${observeField(root, "end").value}Z`);
  const invalid =
    !Number.isFinite(start) || !Number.isFinite(end) || start >= end;
  const error = required(root, "[data-observe-error]");
  error.hidden = !invalid;
  error.textContent =
    "End date must be after start date. Choose both dates to show example traces.";
  for (const key of ["start", "end"])
    observeField(root, key).setAttribute("aria-invalid", String(invalid));
  const scope = required(root, '[data-scope][aria-pressed="true"]').dataset
    .scope;
  const user = observeField(root, "user");
  user.disabled = scope === "own";
  const browser = required(
    root,
    "[data-scope-panel]:not([hidden]) [data-observe-traces]",
  );
  const facts: ObserveTrace[] = JSON.parse(
    browser.dataset.observeTraces ?? "[]",
  );
  for (const option of user.querySelectorAll("option"))
    option.disabled = Boolean(
      option.value && !facts.some((trace) => trace.person === option.value),
    );
  const selectedUser = user.disabled ? "Maya Ortiz" : user.value;
  if (
    !user.disabled &&
    selectedUser &&
    !facts.some((trace) => trace.person === selectedUser)
  )
    user.value = "";
  const group = observeField(root, "group").value,
    query = observeField(root, "query").value.toLowerCase(),
    status = observeField(root, "status").value;
  const rows = facts.filter(
    (trace) =>
      !invalid &&
      Date.parse(`${trace.time}Z`) >= start &&
      Date.parse(`${trace.time}Z`) <= end &&
      (!user.value || trace.person === user.value) &&
      (!group || trace.group.split(", ").includes(group)) &&
      (!query || trace.search.includes(query)) &&
      (!status || trace.blocked === (status === "blocked")),
  );
  if (browser.classList.contains("has-detail")) closeDetails(browser, false);
  browser
    .querySelectorAll<HTMLElement>("[data-observe-record]")
    .forEach((record) => {
      record.hidden = !rows.some(
        (trace) => trace.id === record.dataset.observeRecord,
      );
    });
  const count = rows.length,
    cost = rows.reduce((sum, trace) => sum + trace.cost, 0),
    blocked = rows.filter((trace) => trace.blocked).length;
  const stats: Record<string, string> = {
    count: String(count),
    total: String(count),
    tokens: rows.reduce((sum, trace) => sum + trace.tokens, 0).toLocaleString(),
    sessions: String(count),
    cost: `$${cost.toFixed(3)}`,
    latency: count
      ? `${Math.max(...rows.map((trace) => trace.duration))}s`
      : "—",
    blocked: String(blocked),
    "blocked-rate": count
      ? `${((blocked / count) * 100).toFixed(0)}% of traces`
      : "No blocked steps",
    models: count ? "1 model" : "0 models",
    summary: `${count} traces · ${count} sessions`,
  };
  browser.querySelectorAll<HTMLElement>("[data-observe-stat]").forEach((el) => {
    const value = stats[el.dataset.observeStat ?? ""];
    if (value !== undefined) el.textContent = value;
  });
  browser
    .querySelectorAll<HTMLElement>(
      "[data-observe-empty], [data-conversations-empty], [data-no-conversation]",
    )
    .forEach((el) => {
      el.hidden = count > 0;
    });
  const selected =
    browser.querySelector<HTMLElement>(
      '[data-session-choice][aria-pressed="true"]:not([hidden])',
    ) ??
    browser.querySelector<HTMLElement>("[data-session-choice]:not([hidden])");
  selectConversation(browser, selected?.dataset.sessionChoice);
  browser
    .querySelectorAll<SVGSVGElement>("[data-observe-chart]")
    .forEach((chart) => {
      const values = Array.from({ length: 7 }, () => 0);
      const errors = Array.from({ length: 7 }, () => 0);
      for (const trace of rows) {
        const index = Math.min(
          6,
          Math.floor(
            ((Date.parse(`${trace.time}Z`) - start) / (end - start)) * 7,
          ),
        );
        const value =
          chart.dataset.observeChart === "cost"
            ? trace.cost
            : chart.dataset.observeChart === "blocked"
              ? Number(trace.blocked)
              : chart.dataset.observeChart === "latency"
                ? trace.duration
                : 1;
        errors[index] = (errors[index] ?? 0) + Number(trace.blocked);
        values[index] =
          chart.dataset.observeChart === "latency"
            ? Math.max(values[index] ?? 0, value)
            : (values[index] ?? 0) + value;
      }
      const max = Math.max(...values) || 1;
      const points = values
        .map((value, i) => `${40 + i * 90},${140 - (value / max) * 112}`)
        .join(" ");
      required(chart, "[data-chart-line]").setAttribute("points", points);
      required(chart, ".dash-chart-fill").setAttribute(
        "points",
        `40,140 ${points} 580,140`,
      );
      chart
        .querySelectorAll<SVGRectElement>("[data-chart-bar]")
        .forEach((bar, i) => {
          const value = (values[i] ?? 0) - (errors[i] ?? 0);
          bar.setAttribute("y", String(140 - (value / max) * 112));
          bar.setAttribute("height", String((value / max) * 112));
        });
      chart
        .querySelectorAll<SVGRectElement>("[data-chart-error]")
        .forEach((bar, i) => {
          bar.setAttribute("y", String(140 - ((values[i] ?? 0) / max) * 112));
          bar.setAttribute("height", String(((errors[i] ?? 0) / max) * 112));
        });
      const axis = chart.querySelector("[data-chart-max]");
      if (axis) axis.textContent = String(Math.max(...values));
      chart.querySelectorAll("[data-chart-tick]").forEach((tick, i) => {
        tick.textContent = invalid
          ? "—"
          : new Date(start + ((end - start) * i) / 2).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric", timeZone: "UTC" },
            );
      });
    });
  const chips = required(root, "[data-observe-chips]");
  chips.replaceChildren();
  for (const [key, label] of Object.entries({
    workspace: "workspace",
    group: "group",
    user: "user",
    query: "search",
    status: "status",
    period: "date",
  })) {
    const field = observeField(root, key),
      value = field.value;
    if (
      !value ||
      (key === "user" && user.disabled) ||
      (key === "period" && value === "7")
    )
      continue;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dash-filter-chip";
    button.dataset.observeClear = key;
    button.setAttribute("aria-label", `Remove ${label} filter`);
    button.textContent = `${key === "period" ? (period === "custom" ? "Custom dates" : `Last ${period === "1" ? "24 hours" : `${period} days`}`) : value} ×`;
    chips.append(button);
  }
}

for (const frame of frames) {
  let toastTimer: number;
  frame.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>(
      "button",
    );
    if (!button) return;
    if (frame === desktop) finishDemo();
    const tabs = button.closest<HTMLElement>("[data-tabs]");
    const tab = button.dataset.tab ?? button.dataset.tabGo;
    if (tabs && tab) selectTab(tabs, tab);
    if (tabs?.dataset.tabs?.startsWith("records-") && tab)
      frame
        .querySelectorAll<HTMLElement>('[data-tabs^="records-"]')
        .forEach((root) => selectTab(root, tab));
    const observe = button.closest<HTMLElement>("[data-observe]");
    if (observe && button.dataset.observeClear) {
      const key = button.dataset.observeClear;
      for (const name of key === "all"
        ? ["workspace", "group", "user", "query", "status", "period"]
        : [key])
        setObserveField(
          observe,
          name,
          name === "period"
            ? "7"
            : name === "user" && observeField(observe, "user").disabled
              ? "Maya Ortiz"
              : "",
        );
      updateObservability(observe);
    }
    if (button.dataset.sessionChoice) {
      const browser = button.closest<HTMLElement>("[data-browser]");
      if (browser) selectConversation(browser, button.dataset.sessionChoice);
    }
    if (button.hasAttribute("data-waterfall-toggle")) {
      const panel = button.closest<HTMLElement>("[data-session-panel]");
      if (panel) {
        const waterfall = required(panel, "[data-conversation-waterfall]");
        waterfall.hidden = !waterfall.hidden;
        button.setAttribute("aria-pressed", String(!waterfall.hidden));
      }
    }
    if (button.hasAttribute("data-activity-toggle")) {
      const workbench = button.closest<HTMLElement>("[data-traces-workbench]");
      if (workbench) {
        const chart = required(workbench, "[data-trace-activity]");
        chart.hidden = !chart.hidden;
        button.setAttribute("aria-pressed", String(!chart.hidden));
      }
    }
    if (button.dataset.usageMetric) {
      const usage = required(frame, "[data-usage]");
      usage
        .querySelectorAll("[data-usage-metric]")
        .forEach((item) =>
          item.setAttribute("aria-pressed", String(item === button)),
        );
      updateUsage(usage);
    }
    if (button.dataset.inspect) {
      const browser = button.closest<HTMLElement>("[data-browser]");
      if (!browser) return;
      const row = required<HTMLButtonElement>(
        browser,
        `[data-trace-id="${button.dataset.inspect}"]`,
      );
      const records = row.closest<HTMLElement>("[data-tabs]");
      if (records) selectTab(records, "traces");
      openDetails(row);
    }
    if (button.dataset.traceMode) {
      const detail = button.closest<HTMLElement>("[data-detail]");
      if (!detail) return;
      detail.dataset.traceMode = button.dataset.traceMode;
      detail
        .querySelectorAll("[data-trace-mode]")
        .forEach((item) =>
          item.setAttribute("aria-pressed", String(item === button)),
        );
      required(detail, "[data-tree-root]").hidden =
        button.dataset.traceMode !== "tree";
    }
    if (button.hasAttribute("data-timeline-toggle")) {
      const detail = button.closest<HTMLElement>("[data-detail]");
      if (!detail) return;
      const timeline = required(detail, ".dash-span-timeline");
      timeline.hidden = !timeline.hidden;
      button.setAttribute("aria-pressed", String(!timeline.hidden));
    }
    if (button.dataset.view) selectPane(frame, button.dataset.view);
    if (button.dataset.jump) {
      selectPane(frame, button.dataset.jump);
      const row = frame.querySelector<HTMLButtonElement>(
        `[data-trace-id="${button.dataset.trace}"]`,
      );
      if (row) openDetails(row);
    }
    if (button.dataset.open) openDetails(button);
    if (button.hasAttribute("data-open-access")) {
      const panel = required<HTMLElement>(frame, "#mock-access-drawer");
      panel.hidden = false;
      panel.dataset.accessOpen = "true";
      panel.parentElement?.classList.add("has-access");
      button.setAttribute("aria-expanded", "true");
      panel.focus({ preventScroll: true });
    }
    if (button.hasAttribute("data-close-access")) closeAccess(frame);
    if (button.hasAttribute("data-close")) {
      const browser = button.closest<HTMLElement>("[data-browser]");
      if (browser) closeDetails(browser);
    }
    for (const kind of ["directory", "scope"] as const) {
      const selected = button.dataset[kind];
      if (!selected) continue;
      frame
        .querySelectorAll<HTMLButtonElement>(`[data-${kind}]`)
        .forEach((item) =>
          item.setAttribute("aria-pressed", String(item === button)),
        );
      frame
        .querySelectorAll<HTMLElement>(`[data-${kind}-panel]`)
        .forEach((panel) => {
          panel.hidden = panel.dataset[`${kind}Panel`] !== selected;
        });
    }
    if (observe && button.dataset.scope) {
      setObserveField(
        observe,
        "user",
        button.dataset.scope === "own" ? "Maya Ortiz" : "",
      );
      updateObservability(observe);
    }
    if (
      button.hasAttribute("data-model-toggle") ||
      button.hasAttribute("data-automation-toggle")
    ) {
      const enabled = button.getAttribute("aria-checked") !== "true";
      button.setAttribute("aria-checked", String(enabled));
      const scheduled = button.hasAttribute("data-automation-toggle");
      required<HTMLElement>(button, "[data-switch-text]").textContent =
        scheduled
          ? enabled
            ? "Active"
            : "Paused"
          : enabled
            ? "Enabled"
            : "Off";
      if (!scheduled) {
        const config = required(frame, "#gateway-configuration");
        const detail = button.closest("[data-detail]");
        const tile = config.querySelector(`[aria-controls="${detail?.id}"]`);
        if (tile) {
          const status = required(tile, "[data-model-status]");
          status.textContent = enabled ? "Enabled" : "Off";
          status.classList.toggle("mock-pill--green", enabled);
        }
        const count = config.querySelectorAll(
          '[data-model-toggle][aria-checked="true"]',
        ).length;
        required(config, "[data-enabled-count]").textContent =
          `${count} ${count === 1 ? "model" : "models"} enabled`;
      }
      if (scheduled) {
        const status = required<HTMLElement>(frame, "[data-automation-status]");
        status.textContent = enabled ? "Active" : "Paused";
        status.classList.toggle("mock-pill--green", enabled);
        const next = required<HTMLElement>(frame, "[data-next-run]");
        next.textContent = enabled
          ? (next.dataset.scheduled ?? "")
          : "Paused — no run scheduled";
      }
      const toast = required<HTMLElement>(frame, ".mock-toast");
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toast.hidden = true;
      }, 2500);
    }
  });
  frame.addEventListener("input", (event) => {
    const field = event.target;
    if (!(
      field instanceof HTMLInputElement || field instanceof HTMLSelectElement
    ))
      return;
    const root = field.closest<HTMLElement>("[data-observe]");
    if (!root) return;
    if (field.dataset.observeFilter) {
      setObserveField(root, field.dataset.observeFilter, field.value);
      if (["start", "end"].includes(field.dataset.observeFilter))
        setObserveField(root, "period", "custom");
      updateObservability(root);
    }
    if (field instanceof HTMLInputElement && field.dataset.observeColumn)
      field
        .closest("[data-traces-workbench]")
        ?.querySelectorAll<HTMLElement>(
          `[data-column="${field.dataset.observeColumn}"]`,
        )
        .forEach((cell) => {
          cell.hidden = !field.checked;
        });
  });
  const observe = frame.querySelector<HTMLElement>("[data-observe]");
  if (observe) updateObservability(observe);
  frame.addEventListener("change", (event) => {
    const usage = (event.target as Element).closest<HTMLElement>(
      "[data-usage]",
    );
    if (usage) updateUsage(usage);
  });
  frame.addEventListener("pointerdown", () => {
    if (frame === desktop) finishDemo();
  });
  frame.addEventListener("keydown", (event) => {
    if (frame === desktop) finishDemo();
    if (event.key === "Escape") {
      const columns = (event.target as Element).closest<HTMLDetailsElement>(
        ".dash-columns[open]",
      );
      if (columns) {
        columns.open = false;
        columns.querySelector("summary")?.focus();
        event.preventDefault();
        return;
      }
      if (closeAccess(frame)) {
        event.preventDefault();
        return;
      }
      const browser = (event.target as Element).closest<HTMLElement>(
        "[data-browser].has-detail",
      );
      if (browser) {
        event.preventDefault();
        closeDetails(browser);
      }
    }
  });
}

function followHash(initial = false) {
  const id = location.hash.replace(/^#feature-/u, "");
  const frame = frames.find((item) =>
    item.querySelector(`[data-view="${CSS.escape(id)}"]`),
  );
  if (!frame) return;
  const region = selectPane(
    frame,
    id,
    false,
    !(initial && id === "desktop-app"),
  );
  if (!region) return;
  requestAnimationFrame(() => {
    frame.closest<HTMLElement>(".product-mock-section")?.scrollIntoView({
      block: "start",
      behavior: reducedMotion.matches ? "instant" : "smooth",
    });
    region.focus({ preventScroll: true });
  });
}
window.addEventListener("hashchange", () => followHash());
// Selecting the current menu hash must still restore the matching view and focus.
document
  .querySelectorAll<HTMLAnchorElement>('a[href^="/#feature-"]')
  .forEach((link) => {
    link.addEventListener("click", () => {
      if (location.pathname === "/" && location.hash === link.hash)
        followHash();
    });
  });

if (desktop) {
  const frame = desktop;
  const status = required<HTMLElement>(frame, "[data-run-status]");
  const steps = [...frame.querySelectorAll<HTMLElement>("[data-at]")];
  let elapsed = 0;
  let last = 0;
  let raf = 0;
  let started = false;
  let finished = false;
  let visible = false;
  let observer: IntersectionObserver;
  function render() {
    steps.forEach((step) =>
      step.classList.toggle(
        "mock-demo-pending",
        elapsed < Number(step.dataset.at),
      ),
    );
    frame.dataset.demoPhase =
      elapsed < 400
        ? "empty"
        : elapsed < 2400
          ? "compose"
          : elapsed < 3000
            ? "send"
            : "run";
    frame.dataset.demoStep =
      elapsed >= 6400 && elapsed < 7200
        ? "deleting"
        : elapsed >= 7600 && elapsed < 7900
          ? "blocked"
          : "";
    status.textContent = elapsed < 8600 ? "Working…" : "Done";
    required<HTMLElement>(frame, ".mock-send").toggleAttribute(
      "data-demo-press",
      elapsed >= 2400 && elapsed < 3000,
    );
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  }
  function play() {
    if (raf || finished || !visible || document.hidden) return;
    raf = requestAnimationFrame(tick);
  }
  function tick(now: number) {
    if (last) elapsed += now - last;
    last = now;
    render();
    if (elapsed >= 9600) {
      finishDemo();
      return;
    }
    raf = requestAnimationFrame(tick);
  }
  finishDemo = () => {
    finished = true;
    stop();
    elapsed = 10000;
    render();
    frame.dataset.demoRunning = "false";
  };
  if (!reducedMotion.matches) {
    frame.dataset.demoRunning = "true";
    render();
    observer = new IntersectionObserver(
      ([entry]) => {
        visible = !!entry && entry.intersectionRatio >= 0.5;
        frame.style.setProperty(
          "--demo-play-state",
          visible ? "running" : "paused",
        );
        if (!visible) {
          stop();
          return;
        }
        if (
          !started &&
          !finished &&
          !required<HTMLElement>(frame, '[data-pane="desktop-app"]').hidden
        )
          started = true;
        if (started) play();
      },
      { threshold: [0, 0.5, 1] },
    );
    observer.observe(frame);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else play();
    });
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) {
        finishDemo();
        observer.disconnect();
      }
    });
  }
}
followHash(true);
