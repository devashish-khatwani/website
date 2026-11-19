export {};
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const frames = [...document.querySelectorAll<HTMLElement>("[data-mock]")];
const desktop = frames.find((frame) => frame.dataset.mock === "desktop");
let finishDemo = () => {};
function required<T extends HTMLElement = HTMLElement>(
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

function closeDetails(browser: HTMLElement) {
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
  open?.focus({ preventScroll: true });
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

for (const frame of frames) {
  let toastTimer: number;
  frame.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>(
      "button",
    );
    if (!button) return;
    if (frame === desktop) finishDemo();
    if (button.dataset.view) selectPane(frame, button.dataset.view);
    if (button.dataset.jump) {
      selectPane(frame, button.dataset.jump);
      const row = frame.querySelector<HTMLButtonElement>(
        `[data-trace-id="${button.dataset.trace}"]`,
      );
      if (row) openDetails(row);
    }
    if (button.dataset.open) openDetails(button);
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
  frame.addEventListener("pointerdown", () => {
    if (frame === desktop) finishDemo();
  });
  frame.addEventListener("keydown", (event) => {
    if (frame === desktop) finishDemo();
    if (event.key === "Escape") {
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
      elapsed < 200
        ? "empty"
        : elapsed < 1200
          ? "compose"
          : elapsed < 1500
            ? "send"
            : "run";
    frame.dataset.demoStep =
      elapsed >= 3200 && elapsed < 3600
        ? "deleting"
        : elapsed >= 3800 && elapsed < 3950
          ? "blocked"
          : "";
    status.textContent = elapsed < 4300 ? "Working…" : "Done";
    required<HTMLElement>(frame, ".mock-send").toggleAttribute(
      "data-demo-press",
      elapsed >= 1200 && elapsed < 1500,
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
    if (elapsed >= 4800) {
      finishDemo();
      return;
    }
    raf = requestAnimationFrame(tick);
  }
  finishDemo = () => {
    finished = true;
    stop();
    elapsed = 5000;
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
