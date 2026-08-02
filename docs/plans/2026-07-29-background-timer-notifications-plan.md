# Background Timer & Service-Worker Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Pomo-san reliably alert the user when a countdown finishes while the phone is idle or the PWA is backgrounded, by moving the timer into a custom Service Worker that fires `showNotification` at finish, replacing the silenced `<audio>` bell and `push.js`, and adding an opt-in "Keep screen awake" wake-lock setting.

**Architecture:** A custom service worker (`src/sw/sw.js`) holds `endTime` and runs its own `setInterval`, posting `tick`/`finish` to all controlled clients and calling `registration.showNotification()` at finish. `useCountdown` posts commands to `navigator.serviceWorker.controller` instead of a dedicated Web Worker. A new `useWakeLock` hook arms `navigator.wakeLock` per the new opt-in setting. `push.js`, the Web Worker, and the `<audio>` bell are removed.

**Tech Stack:** React 19, Vite 8, `vite-plugin-pwa` (switched to `injectManifest`), Vitest, `@testing-library/react`, jsdom.

## Global Constraints

- React 19.2+, Vite 8+, `vite-plugin-pwa` ^1.3.0 (already in `package.json`).
- SCSS keeps `api: "modern"` (do not touch the `css.preprocessorOptions.scss` block in `vite.config.js`).
- No new runtime dependencies. DevDeps added only: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
- No push server, no Periodic Background Sync, no main-thread fallback timer.
- ES modules (`"type": "module"`); flat ESLint config (`eslint.config.js`).
- Tests run via `npm test`; never spin up a real SW in jsdom — mock `self.registration`, `self.clients`, `self.Notification`, `navigator.serviceWorker`, `navigator.wakeLock`.
- Spec: `docs/plans/2026-07-29-background-timer-notifications-design.md`.

---

## File Structure

**Created:**
- `vitest.config.js` — jsdom env, setup file.
- `src/test/setup.js` — registers `@testing-library/jest-dom` matchers.
- `src/sw/sw.js` — the custom service worker (timer state + notification).
- `src/sw/sw.test.js` — SW unit tests (mocked `self`, fake timers).
- `src/hooks/useWakeLock.js` — `navigator.wakeLock` wrapper hook.
- `src/hooks/useWakeLock.test.js` — hook unit tests.
- `src/hooks/useCountdown.test.jsx` — hook unit tests (mocked `navigator.serviceWorker`).
- `src/components/Settings.test.jsx` — Settings form tests.
- `src/components/Timer.test.jsx` — Timer regression tests (mocked `useCountdown`, `useWakeLock`).

**Modified:**
- `package.json` — add devDeps, add `test`/`test:watch` scripts, remove `push.js`.
- `vite.config.js` — switch `VitePWA` to `injectManifest`.
- `src/utils/defaultValues.js` — remove `sound`, add `wakeLock: false`.
- `src/components/Settings.jsx` — remove Sound toggle, add "Keep screen awake", extend notification alert.
- `src/hooks/useCountdown.jsx` — talk to SW instead of `TimerWorker`; add `query` resync on mount.
- `src/components/Timer.jsx` — remove `Audio`/`Push`, call `useWakeLock`.

**Removed:**
- `src/workers/timer.worker.js`
- `src/assets/audio/bell-ring.mp3`, `src/assets/audio/switch.mp3` — optional (see Task 8).

---

### Task 1: Add Vitest tooling and setup

**Files:**
- Create: `vitest.config.js`
- Create: `src/test/setup.js`
- Modify: `package.json` (devDeps + scripts)

**Interfaces:**
- Consumes: none.
- Produces: `npm test` / `npm run test:watch` scripts; jsdom environment; `src/test/setup.js` available to all test files via `setupFiles`.

- [ ] **Step 1: Write a smoke test that will fail (no test infra yet)**

Create `src/test/setup.test.js`:

```js
import { describe, it, expect } from "vitest";

describe("vitest setup smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/setup.test.js`
Expected: FAIL — "node_modules/.bin/vitest: not found" (vitest not installed).

- [ ] **Step 3: Install devDeps and wire config**

In `package.json`, add to `devDependencies`:

```json
"vitest": "^2.1.0",
"@testing-library/react": "^16.1.0",
"@testing-library/jest-dom": "^6.6.3",
"jsdom": "^25.0.1"
```

Add to `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `vitest.config.js`:

```js
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    globals: true,
  },
});
```

Create `src/test/setup.js`:

```js
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm install && npm test -- src/test/setup.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Delete the smoke test (it was scaffolding only)**

Delete `src/test/setup.test.js`.

- [ ] **Step 6: Commit**

```sh
git add -A && git commit -m "chore: add vitest tooling and jsdom setup"
```

---

### Task 2: Settings form changes (add `wakeLock`, remove `sound`)

**Files:**
- Modify: `src/utils/defaultValues.js`
- Modify: `src/components/Settings.jsx`
- Create: `src/components/Settings.test.jsx`

**Interfaces:**
- Consumes: existing `Switch` component API: `<Switch name checked onChange />`.
- Produces: `defaultSettingsForm` now has `wakeLock: false` and no longer has `sound`. `Settings` renders a "Keep screen awake" Switch bound to `form.wakeLock` and no Sound Switch. Tail consumers (`Timer.jsx`, `Pomodoro.jsx`) read `settings.wakeLock` and no longer read `settings.sound`.

- [ ] **Step 1: Write the failing test**

Create `src/components/Settings.test.jsx`:

```jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Settings from "./Settings";

const renderSettings = (form, setForm = vi.fn()) =>
  render(<Settings closeModal={vi.fn()} form={form} setForm={setForm} />);

const baseForm = {
  notification: false,
  addTimeAmount: 1,
  showAddTimeAmount: true,
  showIdleTimer: true,
  wakeLock: false,
};

describe("Settings", () => {
  it("renders the 'Keep screen awake' Switch bound to form.wakeLock", () => {
    renderSettings({ ...baseForm, wakeLock: true });
    const label = screen.getByText("Keep screen awake");
    expect(label).toBeInTheDocument();
    const sw = label
      .closest("div")
      .querySelector("input, button, [role='switch']");
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  it("toggling 'Keep screen awake' calls setForm with wakeLock: true", () => {
    const setForm = vi.fn();
    renderSettings(baseForm, setForm);
    const row = screen.getByText("Keep screen awake").closest("div");
    const sw = row.querySelector("[role='switch'], input[type='checkbox'], button");
    fireEvent.click(sw);
    expect(setForm).toHaveBeenCalledWith({ ...baseForm, wakeLock: true });
  });

  it("does NOT render the 'Sound' Setting field", () => {
    renderSettings(baseForm);
    expect(screen.queryByText("Sound")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Settings.test.jsx`
Expected: FAIL — "Unable to find element with text 'Keep screen awake'" / `queryByText` finds "Sound".

- [ ] **Step 3: Implement minimal code**

Edit `src/utils/defaultValues.js` — replace `defaultSettingsForm` with:

```js
export const defaultSettingsForm = {
  notification: false,
  addTimeAmount: 1,
  showAddTimeAmount: true,
  showIdleTimer: true,
  wakeLock: false, // NEW — opt-in screen wake lock while timer runs
};
```

(`sound: false` line is removed.)

Edit `src/components/Settings.jsx`:

In the `handleChecked` `notification` unavailable alert (the branch with "Notifications aren't available here."), append a sentence clarifying iOS:

```js
alert(
  "Notifications aren't available here. On iPhone/iPad, open the site in Safari, " +
    'tap Share → "Add to Home Screen", then launch Pomo-san from there to enable notifications. ' +
    "On iOS, notifications only arrive if the app is launched from the home-screen icon."
);
```

Remove the "Sound" field block:

```jsx
<div className="settings__field">
  <span>Sound</span>
  <Switch name="sound" checked={form.sound} onChange={handleChecked} />
</div>
```

Add a "Keep screen awake" field in its place:

```jsx
<div className="settings__field">
  <span>Keep screen awake</span>
  <Switch
    name="wakeLock"
    checked={form.wakeLock}
    onChange={handleChecked}
  />
</div>
```

(`wakeLock` falls through the generic `else` branch of `handleChecked`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/Settings.test.jsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Verify lint stays clean**

Run: `npm run lint:check`
Expected: no new errors/warnings.

- [ ] **Step 6: Commit**

```sh
git add -A && git commit -m "feat(settings): add wakeLock toggle, remove sound toggle"
```

---

### Task 3: `useWakeLock` hook

**Files:**
- Create: `src/hooks/useWakeLock.js`
- Create: `src/hooks/useWakeLock.test.js`

**Interfaces:**
- Consumes: `navigator.wakeLock.request("screen")` returning a sentinel with a `release()` method (Promise-returning). `document.visibilityState`.
- Produces: `useWakeLock(enabled: boolean)` — requests a screen wake lock when `enabled && document.visibilityState === "visible"`; releases it on cleanup or when `enabled` flips to `false`; re-arms on `visibilitychange` → visible. Feature-detects `navigator.wakeLock` and no-ops when absent. Swallows `AbortError`/`NotAllowedError`.

- [ ] **Step 1: Write the failing test**

Create `src/hooks/useWakeLock.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWakeLock } from "./useWakeLock";

const makeSentinel = () => ({ release: vi.fn(() => Promise.resolve()) });

beforeEach(() => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  delete navigator.wakeLock;
});

const setWakeLock = (impl) =>
  Object.defineProperty(navigator, "wakeLock", {
    configurable: true,
    value: impl,
  });

describe("useWakeLock", () => {
  it("requests a screen wake lock when enabled and visible", async () => {
    const sentinel = makeSentinel();
    const request = vi.fn(() => Promise.resolve(sentinel));
    setWakeLock({ request });
    renderHook(() => useWakeLock(true));
    await Promise.resolve();
    expect(request).toHaveBeenCalledWith("screen");
  });

  it("releases the sentinel when enabled flips to false", async () => {
    const sentinel = makeSentinel();
    const request = vi.fn(() => Promise.resolve(sentinel));
    setWakeLock({ request });
    const { rerender } = renderHook(({ e }) => useWakeLock(e), {
      initialProps: { e: true },
    });
    await Promise.resolve();
    rerender({ e: false });
    await Promise.resolve();
    expect(sentinel.release).toHaveBeenCalled();
  });

  it("re-arms on visibilitychange → visible", async () => {
    const sentinel = makeSentinel();
    const request = vi.fn(() => Promise.resolve(sentinel));
    setWakeLock({ request });
    renderHook(() => useWakeLock(true));
    await Promise.resolve();
    request.mockClear();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    await Promise.resolve();
    expect(request).not.toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    await Promise.resolve();
    expect(request).toHaveBeenCalledWith("screen");
  });

  it("no-ops when navigator.wakeLock is undefined", () => {
    renderHook(() => useWakeLock(true));
    expect(true).toBe(true);
  });

  it("swallows AbortError from request", async () => {
    const err = new DOMException("aborted", "AbortError");
    setWakeLock({ request: vi.fn(() => Promise.reject(err)) });
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderHook(() => useWakeLock(true));
    await Promise.resolve();
    await Promise.resolve();
    expect(spy).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/hooks/useWakeLock.test.js`
Expected: FAIL — "Cannot find module './useWakeLock'".

- [ ] **Step 3: Implement minimal code**

Create `src/hooks/useWakeLock.js`:

```js
import { useEffect, useRef } from "react";

/**
 * Best-effort screen wake lock. When `enabled` is true and the page is
 * visible, requests (and holds) a screen wake lock. Re-arms on
 * visibilitychange → visible. No-ops on browsers without `navigator.wakeLock`.
 *
 * @param {boolean} enabled
 */
export function useWakeLock(enabled) {
  const sentinelRef = useRef(null);

  const release = async () => {
    const s = sentinelRef.current;
    sentinelRef.current = null;
    if (s) {
      try {
        await s.release();
      } catch {
        /* already released */
      }
    }
  };

  const request = async () => {
    if (!enabled || document.visibilityState !== "visible") return;
    if (!("wakeLock" in navigator)) return;
    try {
      sentinelRef.current = await navigator.wakeLock.request("screen");
    } catch (err) {
      console.warn("wakeLock request failed", err?.name ?? err);
    }
  };

  useEffect(() => {
    request();
    const onVis = () => {
      if (document.visibilityState === "visible") request();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      release();
    };
  }, [enabled]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/hooks/useWakeLock.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```sh
git add -A && git commit -m "feat(hooks): add useWakeLock hook"
```

---

### Task 4: Custom Service Worker (`src/sw/sw.js`)

**Files:**
- Create: `src/sw/sw.js`
- Create: `src/sw/sw.test.js`

**Interfaces:**
- Consumes: a mocked SW global (`self.registration.showNotification`, `self.clients.matchAll`, `self.Notification.permission`, `self.addEventListener`, `self.skipWaiting`, `self.clients.claim`); real timers overridden with `vi.useFakeTimers`. The test supplies `event.source` for `query` messages.
- Produces: a module that:
  - Listens on `self.onmessage` for `{ command, value, notification? }` (and reads `event.source` for `query`).
  - On `start`: clears any existing interval, sets `endTime = Date.now() + value*1000`, sends an immediate `tick` to all clients, starts a 1 Hz `setInterval` that posts `tick` each second and, when `remaining <= 0`, posts `finish` and calls `self.registration.showNotification(...)` if `notification` provided and `Notification.permission === "granted"`.
  - On `stop`: clears interval, nulls state.
  - On `extend`: adjusts `endTime` and posts an immediate `tick`.
  - On `query`:
    - If `endTime == null`, replies `{ type: "remaining", remaining: null }`.
    - If `endTime` is in the past (`remaining <= 0`), emits `tick(0)` + `finish` to the requesting client, calls `showNotification` if enabled, and clears state (missed-finish recovery).
    - Otherwise replies `{ type: "remaining", remaining }`.
  - Calls `self.skipWaiting()` on `install` and `self.clients.claim()` on `activate`.

- [ ] **Step 1: Write the failing test**

Create `src/sw/sw.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetModules();
});

afterEach(() => {
  vi.useRealTimers();
});

const installSelf = ({ permission = "granted" } = {}) => {
  const postedToClients = [];
  const shown = [];
  const listeners = {};

  const fakeSelf = {
    _postedToClients: postedToClients,
    _shown: shown,
    _listeners: listeners,
    Notification: { permission },
    registration: {
      showNotification: vi.fn((title, opts) => shown.push({ title, opts })),
    },
    clients: {
      matchAll: vi.fn(async () => [
        { postMessage: (m) => postedToClients.push(m) },
      ]),
    },
    addEventListener: vi.fn((ev, cb) => {
      listeners[ev] = cb;
    }),
    skipWaiting: vi.fn(),
    clientsClaim: vi.fn(),
    setInterval: (fn, ms) => setInterval(fn, ms),
    clearInterval: (id) => clearInterval(id),
  };
  globalThis.self = fakeSelf;
  return fakeSelf;
};

const trigger = (data, event = {}) =>
  globalThis.self._listeners["message"]({
    data,
    source: event.source,
  });

describe("sw.js", () => {
  it("start: sends immediate tick then counts down to finish + one showNotification", async () => {
    installSelf({ permission: "granted" });
    await import("./sw.js");
    trigger({
      command: "start",
      value: 3,
      notification: { title: "Pomodoro finished", body: "Take a break" },
    });
    await Promise.resolve();

    expect(globalThis.self._postedToClients[0]).toEqual({
      type: "tick",
      remaining: 3,
    });

    vi.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(globalThis.self._postedToClients.at(-1)).toEqual({
      type: "tick",
      remaining: 2,
    });

    vi.advanceTimersByTime(1000);
    await Promise.resolve();
    vi.advanceTimersByTime(1000);
    await Promise.resolve();

    const lastMsgs = globalThis.self._postedToClients.slice(-2);
    expect(lastMsgs).toContainEqual({ type: "tick", remaining: 0 });
    expect(lastMsgs).toContainEqual({ type: "finish" });
    expect(globalThis.self._shown).toHaveLength(1);
    expect(globalThis.self._shown[0]).toMatchObject({
      title: "Pomodoro finished",
    });
  });

  it("start without notification payload does not call showNotification", async () => {
    installSelf({ permission: "granted" });
    await import("./sw.js");
    trigger({ command: "start", value: 1 });
    await Promise.resolve();
    vi.advanceTimersByTime(1100);
    await Promise.resolve();
    expect(globalThis.self._shown).toHaveLength(0);
  });

  it("start with denied permission still posts finish but no showNotification", async () => {
    installSelf({ permission: "denied" });
    await import("./sw.js");
    trigger({
      command: "start",
      value: 1,
      notification: { title: "x", body: "y" },
    });
    await Promise.resolve();
    vi.advanceTimersByTime(1100);
    await Promise.resolve();
    expect(globalThis.self._shown).toHaveLength(0);
    expect(globalThis.self._postedToClients).toContainEqual({
      type: "finish",
    });
  });

  it("stop clears the running interval so no further ticks fire", async () => {
    installSelf();
    await import("./sw.js");
    trigger({ command: "start", value: 60 });
    await Promise.resolve();
    vi.advanceTimersByTime(2000);
    await Promise.resolve();
    const countBefore = globalThis.self._postedToClients.length;
    trigger({ command: "stop" });
    await Promise.resolve();
    vi.advanceTimersByTime(5000);
    await Promise.resolve();
    expect(globalThis.self._postedToClients.length).toBe(countBefore);
  });

  it("extend advances endTime and the next tick reflects the new remaining", async () => {
    installSelf();
    await import("./sw.js");
    trigger({ command: "start", value: 10 });
    await Promise.resolve();
    vi.advanceTimersByTime(1000);
    await Promise.resolve();
    trigger({ command: "extend", value: 30 });
    await Promise.resolve();
    const last = globalThis.self._postedToClients.at(-1);
    expect(last.type).toBe("tick");
    expect(last.remaining).toBeGreaterThan(38);
    expect(last.remaining).toBeLessThanOrEqual(39);
  });

  it("query with no running timer replies remaining: null", async () => {
    const fakeSelf = installSelf();
    await import("./sw.js");
    const sourceClient = { postMessage: vi.fn() };
    trigger({ command: "query" }, { source: sourceClient });
    await Promise.resolve();
    expect(sourceClient.postMessage).toHaveBeenCalledWith({
      type: "remaining",
      remaining: null,
    });
  });

  it("query with running timer replies accurate remaining", async () => {
    const fakeSelf = installSelf();
    await import("./sw.js");
    trigger({ command: "start", value: 60 });
    await Promise.resolve();
    vi.advanceTimersByTime(1000);
    await Promise.resolve();
    const sourceClient = { postMessage: vi.fn() };
    trigger({ command: "query" }, { source: sourceClient });
    await Promise.resolve();
    const reply = sourceClient.postMessage.mock.calls[0][0];
    expect(reply.type).toBe("remaining");
    expect(reply.remaining).toBeLessThanOrEqual(59);
    expect(reply.remaining).toBeGreaterThan(55);
  });

  it("query with past endTime emits tick(0)+finish and clears state", async () => {
    const fakeSelf = installSelf({ permission: "granted" });
    await import("./sw.js");
    trigger({
      command: "start",
      value: 0,
      notification: { title: "Done", body: "x" },
    });
    // Stop the immediate interval from racing the query by stopping first
    // and using a fresh start at value=0:
    await Promise.resolve();
    // value=0 → endTime is now; an immediate tick fires finish via the
    // interval path. Stop the interval so we can verify the query path:
    trigger({ command: "stop" });
    // Re-start with value=0 and immediately query (rather than tick):
    trigger({
      command: "start",
      value: 0,
      notification: { title: "Done", body: "x" },
    });
    const sourceClient = { postMessage: vi.fn() };
    // Query before advancing timers so interval doesn't fire:
    trigger({ command: "query" }, { source: sourceClient });
    await Promise.resolve();
    await Promise.resolve();
    const msgs = sourceClient.postMessage.mock.calls.map((c) => c[0]);
    expect(msgs).toContainEqual({ type: "tick", remaining: 0 });
    expect(msgs).toContainEqual({ type: "finish" });
  });

  it("start while already running clears the prior interval first", async () => {
    installSelf();
    await import("./sw.js");
    trigger({ command: "start", value: 60 });
    await Promise.resolve();
    vi.advanceTimersByTime(2000);
    await Promise.resolve();
    const beforeCount = globalThis.self._postedToClients.length;
    trigger({ command: "start", value: 30 });
    await Promise.resolve();
    vi.advanceTimersByTime(2000);
    await Promise.resolve();
    const after = globalThis.self._postedToClients.length;
    // New ticker fires at most 3 messages over 2s (1 immediate + up to 2 ticks),
    // not the 4 we'd see if the old interval kept running.
    expect(after - beforeCount).toBeLessThanOrEqual(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/sw/sw.test.js`
Expected: FAIL — "Cannot find module './sw'".

- [ ] **Step 3: Implement minimal code**

Create `src/sw/sw.js`:

```js
/// <reference lib="webworker" />

let intervalId = null;
let endTime = null;
let notificationPayload = null;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());

const broadcast = async (msg) => {
  const clients = await self.clients.matchAll({ type: "window" });
  for (const c of clients) c.postMessage(msg);
};

const fireFinish = async () => {
  await broadcast({ type: "tick", remaining: 0 });
  await broadcast({ type: "finish" });
  if (
    notificationPayload &&
    self.Notification &&
    self.Notification.permission === "granted"
  ) {
    try {
      self.registration.showNotification(notificationPayload.title, {
        body: notificationPayload.body,
        icon: "/pomo-san-logo.svg",
        tag: "pomo-san",
      });
    } catch (err) {
      console.error("SW showNotification failed", err);
    }
  }
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  endTime = null;
  notificationPayload = null;
};

const tick = async () => {
  if (endTime == null) return;
  const remaining = Math.ceil((endTime - Date.now()) / 1000);
  if (remaining <= 0) {
    await fireFinish();
  } else {
    await broadcast({ type: "tick", remaining });
  }
};

self.onmessage = (e) => {
  const { command, value, notification } = e.data ?? {};
  switch (command) {
    case "start":
      if (intervalId) clearInterval(intervalId);
      notificationPayload = notification ?? null;
      endTime = Date.now() + (value ?? 0) * 1000;
      tick();
      intervalId = setInterval(tick, 1000);
      break;
    case "stop":
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      endTime = null;
      notificationPayload = null;
      break;
    case "extend":
      if (endTime != null && Number(value) > 0) {
        endTime += Number(value) * 1000;
        tick();
      }
      break;
    case "query": {
      const source = e.source;
      if (endTime == null) {
        source?.postMessage({ type: "remaining", remaining: null });
      } else {
        const remaining = Math.ceil((endTime - Date.now()) / 1000);
        if (remaining <= 0) {
          // Missed finish while SW was also suspended — fire it now to the
          // requesting client + all clients, then clear state.
          fireFinish().then(() =>
            source.postMessage({ type: "remaining", remaining: null })
          );
        } else {
          source.postMessage({ type: "remaining", remaining });
        }
      }
      break;
    }
    default:
      break;
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/sw/sw.test.js`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```sh
git add -A && git commit -m "feat(sw): add custom service worker that self-notifies"
```

---

### Task 5: Rewrite `useCountdown` to use the Service Worker

**Files:**
- Modify: `src/hooks/useCountdown.jsx` (full rewrite; preserve exported signature)
- Create: `src/hooks/useCountdown.test.jsx`

**Interfaces:**
- Consumes: `navigator.serviceWorker.controller` (`postMessage`) and `navigator.serviceWorker.ready` (`Promise<Registration>`).
- Produces: `useCountdown(initialCount)` returns the same array shape as today: `[{ minutes, seconds, count }, setCount, startCountdown, stopCountdown, resetCountdown, isCountdownFinished, extendCountdown]`. `startCountdown(value, notification?)` posts `{ command: "start", value, notification? }`. `stopCountdown` posts `{ command: "stop" }`. `resetCountdown` posts `stop` and resets local state from `initialCount`. `extendCountdown(seconds)` posts `{ command: "extend", value: seconds }`. On mount, sends `{ command: "query" }` to resync from a possibly-running SW timer; on reply `{ type: "remaining", remaining }` with non-null, positive `remaining`, sets local `count` accordingly.

- [ ] **Step 1: Write the failing test**

Create `src/hooks/useCountdown.test.jsx`:

```jsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCountdown } from "./useCountdown";

const makeController = () => ({ postMessage: vi.fn() });

const makeSW = ({ controller } = {}) => {
  const listeners = new Map();
  const sw = {
    controller,
    ready: Promise.resolve({}),
    addEventListener: vi.fn((ev, cb) => listeners.set(ev, cb)),
    removeEventListener: vi.fn(),
  };
  sw._emit = (ev, payload) => listeners.get(ev)?.(payload);
  return sw;
};

const installSW = (sw) =>
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: sw,
  });

afterEach(() => {
  delete navigator.serviceWorker;
  vi.restoreAllMocks();
});

describe("useCountdown", () => {
  it("posts 'start' on startCountdown(value)", () => {
    const controller = makeController();
    installSW(makeSW({ controller }));
    const { result } = renderHook(() => useCountdown(60));
    act(() => result[2](60));
    expect(controller.postMessage).toHaveBeenCalledWith({
      command: "start",
      value: 60,
      notification: undefined,
    });
  });

  it("posts 'start' with notification when passed", () => {
    const controller = makeController();
    installSW(makeSW({ controller }));
    const { result } = renderHook(() => useCountdown(60));
    const msg = { title: "Done", body: "Take a break" };
    act(() => result[2](60, msg));
    expect(controller.postMessage).toHaveBeenCalledWith({
      command: "start",
      value: 60,
      notification: msg,
    });
  });

  it("posts 'stop' on stopCountdown", () => {
    const controller = makeController();
    installSW(makeSW({ controller }));
    const { result } = renderHook(() => useCountdown(60));
    act(() => result[3]());
    expect(controller.postMessage).toHaveBeenCalledWith({ command: "stop" });
  });

  it("posts 'stop' and resets from initialCount on resetCountdown", () => {
    const controller = makeController();
    installSW(makeSW({ controller }));
    const { result } = renderHook(() => useCountdown(30));
    act(() => result[4]());
    expect(controller.postMessage).toHaveBeenCalledWith({ command: "stop" });
    expect(result[0].count).toBe(30);
  });

  it("posts 'extend' with value on extendCountdown", () => {
    const controller = makeController();
    installSW(makeSW({ controller }));
    const { result } = renderHook(() => useCountdown(60));
    act(() => result[6](30));
    expect(controller.postMessage).toHaveBeenCalledWith({
      command: "extend",
      value: 30,
    });
  });

  const getMessageHandler = (sw) =>
    sw.addEventListener.mock.calls.find((c) => c[0] === "message")?.[1];

  it("a 'tick' message updates count", () => {
    const controller = makeController();
    const sw = makeSW({ controller });
    installSW(sw);
    const { result } = renderHook(() => useCountdown(60));
    act(() => getMessageHandler(sw)({ data: { type: "tick", remaining: 42 } }));
    expect(result[0].count).toBe(42);
  });

  it("a 'finish' message flips isCountdownFinished and zeroes count", () => {
    const controller = makeController();
    const sw = makeSW({ controller });
    installSW(sw);
    const { result } = renderHook(() => useCountdown(60));
    act(() => getMessageHandler(sw)({ data: { type: "finish" } }));
    expect(result[5]).toBe(true);
    expect(result[0].count).toBe(0);
  });

  it("on mount, posts 'query' to resync", () => {
    const controller = makeController();
    installSW(makeSW({ controller }));
    renderHook(() => useCountdown(60));
    expect(controller.postMessage).toHaveBeenCalledWith({ command: "query" });
  });

  it("a query reply with positive remaining updates count from SW", () => {
    const controller = makeController();
    const sw = makeSW({ controller });
    installSW(sw);
    const { result } = renderHook(() => useCountdown(60));
    act(() =>
      getMessageHandler(sw)({ data: { type: "remaining", remaining: 17 } })
    );
    expect(result[0].count).toBe(17);
  });

  it("a query reply with remaining: null keeps initial count", () => {
    const controller = makeController();
    const sw = makeSW({ controller });
    installSW(sw);
    const { result } = renderHook(() => useCountdown(60));
    act(() =>
      getMessageHandler(sw)({ data: { type: "remaining", remaining: null } })
    );
    expect(result[0].count).toBe(60);
  });

  it("when controller is null initially, sends query after controllerchange", () => {
    const sw = makeSW({ controller: null });
    installSW(sw);
    const controller = makeController();
    renderHook(() => useCountdown(60));
    act(() => {
      Object.defineProperty(navigator.serviceWorker, "controller", {
        configurable: true,
        value: controller,
      });
      sw._emit("controllerchange", {});
    });
    expect(controller.postMessage).toHaveBeenCalledWith({ command: "query" });
  });

  it("when serviceWorker API is missing, does not throw and keeps initial count", () => {
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: undefined,
    });
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useCountdown(45));
    expect(result[0].count).toBe(45);
    expect(spy).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/hooks/useCountdown.test.jsx`
Expected: FAIL — current `useCountdown` imports the `TimerWorker` URL import (`?worker`), which doesn't resolve under jsdom + the SW API isn't used.

- [ ] **Step 3: Implement minimal code**

Replace the entire contents of `src/hooks/useCountdown.jsx` with:

```jsx
import { useEffect, useState, useRef, useCallback } from "react";

export function useCountdown(initialCount) {
  if (typeof initialCount !== "number") {
    return console.error("You must set an initial number in seconds");
  }

  const [count, setCount] = useState(initialCount);
  const [isCountdownFinished, setIsCountdownFinished] = useState(false);
  const resyncedRef = useRef(false);

  const getController = () => navigator.serviceWorker?.controller ?? null;
  const post = (msg) => {
    const c = getController();
    if (c) c.postMessage(msg);
  };

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker) {
      console.warn("Service Worker unavailable; countdown disabled.");
      return;
    }

    const onMessage = (e) => {
      const { type, remaining } = e.data ?? {};
      if (type === "tick") {
        setCount(remaining);
      } else if (type === "finish") {
        setIsCountdownFinished(true);
        setCount(0);
      } else if (type === "remaining") {
        if (typeof remaining === "number" && remaining > 0) {
          setCount(remaining);
        }
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    const sendQuery = () => {
      if (resyncedRef.current) return;
      resyncedRef.current = true;
      post({ command: "query" });
    };

    if (getController()) {
      sendQuery();
    } else {
      navigator.serviceWorker.addEventListener("controllerchange", sendQuery);
    }

    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        sendQuery
      );
    };
  }, []);

  useEffect(() => {
    setCount(initialCount);
    setIsCountdownFinished(false);
  }, [initialCount]);

  const startCountDown = useCallback((value, notification) => {
    if (value > 0) {
      post({ command: "start", value, notification });
      setIsCountdownFinished(false);
    }
  }, []);

  const stopCountdown = useCallback(() => {
    post({ command: "stop" });
  }, []);

  const resetCountdown = useCallback(() => {
    post({ command: "stop" });
    setCount(initialCount);
    setIsCountdownFinished(false);
  }, [initialCount]);

  const extendCountdown = useCallback((seconds) => {
    if (typeof seconds === "number" && seconds > 0) {
      post({ command: "extend", value: seconds });
    }
  }, []);

  const SECS_PER_MINUTE = 60;

  return [
    {
      minutes: Math.floor(count / SECS_PER_MINUTE),
      seconds: count % SECS_PER_MINUTE,
      count,
    },
    setCount,
    startCountDown,
    stopCountdown,
    resetCountdown,
    isCountdownFinished,
    extendCountdown,
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/hooks/useCountdown.test.jsx`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```sh
git add -A && git commit -m "feat(hooks): rewrite useCountdown to use the Service Worker"
```

---

### Task 6: Switch Vite PWA to `injectManifest`

**Files:**
- Modify: `vite.config.js`

**Interfaces:**
- Consumes: `src/sw/sw.js` from Task 4.
- Produces: `npm run build`/`dev` register the custom SW (not the generated one).

- [ ] **Step 1: Verify the SW file exists from Task 4**

Run: `test -f src/sw/sw.js && echo ok`
Expected: prints `ok`.

- [ ] **Step 2: Patch `vite.config.js`**

Replace the `VitePWA({ ... })` block with:

```js
VitePWA({
  registerType: "autoUpdate",
  strategies: "injectManifest",
  srcDir: "src/sw",
  filename: "sw.js",
  injectManifest: {
    injectionPoint: undefined,
  },
  manifest: {
    name: "Pomo-san",
    short_name: "Pomo-san",
    description: "Simple pomodoro app to burst your productivity",
    theme_color: "#FFF2F2",
    background_color: "#FFF2F2",
    display: "standalone",
    orientation: "portrait",
    start_url: "/",
    scope: "/",
    icons: [
      {
        src: "/images/pomo-san(192x192).png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/images/pomo-san(512x512).png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  },
}),
```

Leave the `css.preprocessorOptions.scss` block untouched.

- [ ] **Step 3: Verify the build wires the SW**

Run: `npm run build`
Expected: completes; `dist/sw.js` exists.

```sh
test -f dist/sw.js && echo ok
```

Expected: prints `ok`.

- [ ] **Step 4: Verify dev server starts without errors**

Run: `timeout 8 npm run dev || true`
Expected: server boots; no error mentioning `injectManifest` or `sw.js`.

- [ ] **Step 5: Commit**

```sh
git add -A && git commit -m "build(pwa): switch to injectManifest custom SW"
```

---

### Task 7: Update `Timer.jsx` (remove audio/push, add wake lock)

**Files:**
- Modify: `src/components/Timer.jsx`
- Create: `src/components/Timer.test.jsx`

**Interfaces:**
- Consumes: `useCountdown` from Task 5 (now SW-backed); `useWakeLock` from Task 3; `settings.wakeLock` (added in Task 2). The `skipSession` prop API is unchanged. `count.count` and `isCountdownFinished` from `useCountdown` are unchanged.
- Produces: `Timer` renders the same UI without `Audio`/`Push` usage; calls `useWakeLock(settings.wakeLock && isTimerRunning)`; starts the SW countdown with the notification payload only when `settings.notification` is true; on `isCountdownFinished`, runs `handleSkip` and (if `settings.showIdleTimer`) sets `isIdle` — no audio, no `displayNotification`.

- [ ] **Step 1: Write the failing test**

Create `src/components/Timer.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";

let finishFn = null;
vi.mock("../hooks/useCountdown", () => ({
  useCountdown: (seconds) => {
    const [count, setCount] = React.useState({
      minutes: Math.floor(seconds / 60),
      seconds: seconds % 60,
      count: seconds,
    });
    const [finished, setFinished] = React.useState(false);
    finishFn = () => {
      setFinished(true);
      setCount({ minutes: 0, seconds: 0, count: 0 });
    };
    return [count, setCount, vi.fn(), vi.fn(), vi.fn(), finished, vi.fn()];
  },
}));

const wakeLockMock = vi.fn();
vi.mock("../hooks/useWakeLock", () => ({ useWakeLock: wakeLockMock }));

import Timer from "./Timer";

const baseProps = {
  seconds: 300,
  skipSession: vi.fn(),
  currentSession: "pomodoro",
  finishedSessions: [{ id: 1, finishedSessions: 0 }],
  currentProfile: { id: 1, name: "Study", sessionsBeforeLongBreak: 4 },
  openSettingsModal: vi.fn(),
  settings: {
    notification: true,
    addTimeAmount: 1,
    showAddTimeAmount: true,
    showIdleTimer: true,
    wakeLock: false,
  },
};

beforeEach(() => {
  wakeLockMock.mockClear();
});

afterEach(() => {
  finishFn = null;
});

describe("Timer", () => {
  it("calls skipSession on finish", () => {
    const skip = vi.fn();
    render(<Timer {...baseProps} seconds={300} skipSession={skip} />);
    act(() => finishFn?.());
    expect(skip).toHaveBeenCalled();
  });

  it("does NOT construct any Audio across interactions", () => {
    const audioCtor = vi.fn();
    global.Audio = audioCtor;
    render(<Timer {...baseProps} />);
    fireEvent.click(screen.getByLabelText(/Add time to countdown/));
    act(() => finishFn?.());
    expect(audioCtor).not.toHaveBeenCalled();
  });

  it("calls useWakeLock with false when wakeLock setting is off", () => {
    render(<Timer {...baseProps} />);
    const lastCall = wakeLockMock.mock.calls.at(-1)?.[0];
    expect(lastCall).toBe(false);
  });

  it("calls useWakeLock with true when wakeLock setting is on and timer running", () => {
    const props = {
      ...baseProps,
      settings: { ...baseProps.settings, wakeLock: true },
    };
    render(<Timer {...props} />);
    // Click the Play/Pause toggle to set isTimerRunning true.
    const playBtn = screen
      .getAllByRole("button")
      .find((b) => b.querySelector("svg.lucide-play, svg.lucide-pause"));
    fireEvent.click(playBtn);
    const lastCall = wakeLockMock.mock.calls.at(-1)?.[0];
    expect(lastCall).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Timer.test.jsx`
Expected: FAIL — current `Timer.jsx` imports `push.js` (mock not present), constructs `new Audio()`, and never calls `useWakeLock`.

- [ ] **Step 3: Implement changes in `src/components/Timer.jsx`**

Remove these imports:

```js
import switchSoundURL from "../assets/audio/switch.mp3";
import bellRingSoundURL from "../assets/audio/bell-ring.mp3";
```

```js
import Push from "push.js";
```

Add the `useWakeLock` import next to the `useCountdown` import:

```js
import { useWakeLock } from "../hooks/useWakeLock";
```

After the existing hook/state declarations, call:

```js
useWakeLock(settings.wakeLock && isTimerRunning);
```

Replace the `isCountdownFinished` effect with:

```js
useEffect(() => {
  if (count.count === 0) {
    handleSkip();
    if (settings.showIdleTimer) setIsIdle(true);
  }
}, [isCountdownFinished]);
```

Delete the `displayNotification` function entirely.

Delete the `playSound` function entirely.

In `handleRunning("play")`, change the `startCountdown(msg)` call to pass the explicit value:

```js
startCountdown(count.count, msg);
```

(`msg` remains `settings.notification ? { ... } : null` — preserves the user's notification preference.)

In the Pause and Play button handlers, remove the `playSound(switchSoundURL)` calls.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/Timer.test.jsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: ALL PASS.

- [ ] **Step 6: Lint check**

Run: `npm run lint:check`
Expected: clean.

- [ ] **Step 7: Commit**

```sh
git add -A && git commit -m "feat(timer): use SW notifications, add wake lock, drop audio/push"
```

---

### Task 8: Remove dead deps and the old Web Worker

**Files:**
- Delete: `src/workers/timer.worker.js`
- Modify: `package.json` — remove `push.js` from `dependencies`.
- Optional delete: `src/assets/audio/bell-ring.mp3`, `src/assets/audio/switch.mp3`

**Interfaces:**
- Consumes: Task 7's removal of all `Audio`/`Push` imports.
- Produces: `package-lock.json` no longer references `push.js`; no orphaned worker file. Builds and tests still pass.

- [ ] **Step 1: Verify nothing references the worker or `push.js`**

Run:
```sh
! grep -rn "timer.worker" src && ! grep -rn "push.js" src && echo ok
```
Expected: prints `ok` (no references found).

- [ ] **Step 2: Delete the worker file**

```sh
rm src/workers/timer.worker.js && rmdir src/workers 2>/dev/null; true
```

- [ ] **Step 3: Remove `push.js` from `package.json`**

Remove the line:
```json
"push.js": "^1.0.12",
```

Run: `npm install`
Expected: lockfile updates, no errors.

- [ ] **Step 4: Verify build + tests**

Run:
```sh
npm test && npm run build
```
Expected: tests pass; `dist/sw.js` produced.

- [ ] **Step 5: Delete unused audio assets**

```sh
rm src/assets/audio/bell-ring.mp3 src/assets/audio/switch.mp3
rmdir src/assets/audio 2>/dev/null; true
```

- [ ] **Step 6: Commit**

```sh
git add -A && git commit -m "chore: remove push.js dep and old Web Worker"
```

---

## Self-Review

**1. Spec coverage**
- SW holds `endTime` + `setInterval` + `showNotification` → Task 4. ✓
- `useCountdown` talks to SW, resyncs via `query` on mount, graceful failure → Task 5. ✓
- `useWakeLock` opt-in via `settings.wakeLock`, releases on cleanup/disable, re-arms on visible, feature-detects → Tasks 2, 3. ✓
- Settings: remove Sound, add "Keep screen awake", iOS alert clarification → Task 2. ✓
- Timer: drop `<audio>`, drop `push.js`, pass `value` to `start`, call `useWakeLock` → Task 7. ✓
- `vite.config.js` switches to `injectManifest` → Task 6. ✓
- Remove `push.js` dep, delete worker → Task 8. ✓
- Vitest tooling + jsdom → Task 1. ✓
- Tests for SW, hooks, Settings, Timer (including the regression that no `Audio`/`Push` is constructed) → Tasks 2–5, 7. ✓
- Missed-finish recovery (query detects past `endTime` → emit `finish`) → Task 4 + test. ✓
- Manual-only items (real SW behavior, iOS/Android suspension, install flow) → per spec. ✓

**2. Placeholder scan:** No TBD/TODO; no "add error handling"/"similar to Task N"; every code step includes full code; no missing references.

**3. Type/signature consistency**
- `useWakeLock(enabled)` — used identically in Task 3 impl, Task 7 test mock, Task 7 component call (`settings.wakeLock && isTimerRunning`). ✓
- `startCountdown(value, notification?)` — defined in Task 5 impl; called as `startCountdown(count.count, msg)` in Task 7. The Task 5 test exercises both `startCountdown(60)` and `startCountdown(60, msg)`. ✓
- SW commands `{ command, value, notification? }` and `query` reply shapes — used consistently across Task 4 tests, Task 4 impl, Task 5 (consumes `remaining` reply). ✓
- `defaultSettingsForm` after Task 2: `{ notification, addTimeAmount, showAddTimeAmount, showIdleTimer, wakeLock }` — Task 7 test's `baseProps.settings` matches. ✓
- `skipSession(bool)` API unchanged from today's `Timer.jsx`; Task 7 test verifies a call occurs. ✓
