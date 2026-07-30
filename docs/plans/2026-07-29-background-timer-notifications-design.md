# Background Timer & Service-Worker Notifications — Design

Date: 2026-07-29

## Goal

Make Pomo-san reliably alert the user when a countdown finishes while the
phone is idle or the PWA is backgrounded. Today the bell only plays when
the app is in the foreground, because both the `finish` signal and the
`<audio>` playback run as main-thread/worker JS that the OS suspends.

## Root cause (from investigation)

- The Web Worker's `setInterval` (`src/workers/timer.worker.js`) is
  throttled/suspended when the PWA is backgrounded on mobile, so the
  `left <= 0` branch never fires on time while the phone is idle.
- `playSound` in `src/components/Timer.jsx` does `new Audio(url);
  audio.play()` from the page; mobile browsers refuse to start audio
  while backgrounded, and the React effect can't run while suspended.
- `push.js` notifications (`Timer.jsx`) also originate from the page,
  so they don't fire on iOS when backgrounded.
- When the user reopens the app, the throttled interval resumes, the
  `finish` branch fires immediately, and the bell plays then — exactly
  the reported "only when on the app" symptom.

## Non-goals

- A push server / web-push subscription. The app stays serverless.
- Periodic Background Sync, since it's unsupported on iOS Safari.
- Per-tab session isolation across multiple open clients.
- A fallback main-thread `setInterval` timer (that's the pattern being
  removed — it's the bug).
- Restoring the in-bell `<audio>` sound, even in the foreground. The OS
  notification sound/vibration replaces it everywhere.
- Coverage tooling (`@vitest/coverage-v8`).

## Decision

- **Target lowest-common-denominator (iOS):** service-worker
  `showNotification` is the only reliable background channel for both
  iOS and Android. No `<audio>` while backgrounded is acceptable; the
  OS notification sound is what the user hears.
- **Drop `<audio>` entirely (option B):** single notification path in
  foreground and background; the existing `sound` setting and its
  Settings toggle are removed.
- **Move the timer into the Service Worker (option C3):** the SW holds
  `endTime`, runs its own `setInterval`, and self-notifies at finish.
  `push.js` and the dedicated Web Worker are removed.
- **Screen Wake Lock as a user setting (option C4):** opt-in toggle;
  disabled by default (battery-conscious).
- **Missed-finish recovery:** when the SW was also suspended, a `query`
  from a reopened page with `endTime` in the past makes the SW emit
  `tick(0)` + `finish` (and `showNotification` if enabled) and clear
  state. The UI is therefore consistent on reopen even when the
  notification fired late (or never did).

## User-visible behavior

| Aspect                   | Behavior                                                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Foreground finish       | OS notification banner appears at `00:00`; OS sound/vibration plays; session advances; UI shows finished state.                                |
| Background / idle finish | OS notification fires at the right wall-clock time (or as soon as the SW wakes on iOS); on reopen, UI shows finished state, session advanced.    |
| Sound at finish         | The previous `<audio>` bell is **gone**. Only the OS notification's own sound/vibration is heard.                                              |
| "Sound" setting         | Removed from Settings and from `defaultSettingsForm`.                                                                                          |
| New "Keep screen awake" | Default **OFF**. While ON and the timer is running and the page is visible, the screen doesn't dim via `navigator.wakeLock`. Best-effort.      |
| Notifications disabled  | No banner at finish; `finish` event still reaches the page so session bookkeeping runs.                                                        |
| Notifications on iOS    | Only fires when the PWA is installed ("Add to Home Screen") and launched from the home-screen icon. Existing alert in `Settings.jsx` clarified. |
| Multi-tab               | SW broadcasts `tick`/`finish` to all controlled clients. Last-write-wins on `start` with different values.                                    |

## Architecture

### 1. Custom Service Worker (`src/sw/sw.js`, new)

`vite-plugin-pwa` switches from generated SW to `injectManifest` mode.

```js
// vite.config.js
VitePWA({
  registerType: "autoUpdate",
  strategies: "injectManifest",
  srcDir: "src/sw",
  filename: "sw.js",
  manifest: { /* unchanged */ },
})
```

`src/sw/sw.js` holds module-level state and a message protocol identical
in shape to today's worker (so `useCountdown` barely changes):

- Commands: `{ command: "start", value, notification? }`, `{ command: "stop" }`, `{ command: "extend", value }`, `{ command: "query" }`.
- Messages out: `{ type: "tick", remaining }`, `{ type: "finish" }`, `{ type: "remaining", remaining }` (for `query` when no missed finish).
- `start` sets `endTime = Date.now() + value*1000`, clears any prior interval, starts a 1 Hz `setInterval`, and immediately sends a tick.
- On `remaining <= 0`: post `finish` to **all controlled clients** via `clients.matchAll()`, then `self.registration.showNotification(title, { body, icon, tag: "pomo-san" })` iff `notification` was supplied and `Notification.permission === "granted"`. Wrapped in `try/catch` (can throw `TypeError` if permission changed). Clears `endTime`/`intervalId`/`notificationPayload`.
- `extend` adjusts `endTime` and emits an immediate tick.
- `query`:
  - If `endTime == null`, replies `{ type: "remaining", remaining: null }`.
  - If `endTime` is in the past (`remaining <= 0`), emits `tick(0)` + `finish` to the requesting client, calls `showNotification` if enabled, and clears state (missed-finish recovery).
  - Otherwise replies `{ type: "remaining", remaining }` so the UI resyncs.
- `install`/`activate` call `skipWaiting()` / `clients.claim()` to preserve today's `autoUpdate` UX.

### 2. Rewrite `src/hooks/useCountdown.jsx` (same exported signature)

- Replaces `new TimerWorker()` with `navigator.serviceWorker.ready`
  + posting to `navigator.serviceWorker.controller`.
- `onmessage` unchanged: `tick` → `setCount`, `finish` → `setIsCountdownFinished(true)`. Also handles `remaining` replies (non-null, > 0 → resync local `count`).
- On mount: sends `query` to resync from a possibly-running SW countdown; falls back to `initialCount` when reply is null.
- Graceful failure: if SW API is missing or `ready` rejects, the hook logs a warning and leaves `count` at `initialCount` (no fallback main-thread interval — that would re-introduce the bug).

### 3. New `src/hooks/useWakeLock.js`

```js
export function useWakeLock(enabled) { /* navigator.wakeLock?.request("screen"),
  release on cleanup/disable, re-arm on visibilitychange→visible,
  feature-detect, swallow AbortError/NotAllowedError */ }
```

### 4. `src/components/Timer.jsx` changes

- Remove imports of `switchSoundURL` / `bellRingSoundURL`, the `playSound`
  function, the `displayNotification` function (and `Push.create`), and
  the `playSound(...)` calls on Play/Pause/Skip buttons.
- Remove the `playSound(bellRingSoundURL)` line in the `isCountdownFinished`
  effect; keep `handleSkip()` (session bookkeeping) and
  `if (settings.showIdleTimer) setIsIdle(true)`.
- The Play handler still builds the notification payload only when
  `settings.notification` and passes it (plus the explicit `count.count`
  value) to `startCountdown(count.count, msg)` — this keeps the user's
  notification preference respected at the SW.
- Call `useWakeLock(settings.wakeLock && isTimerRunning)`.

### 5. `src/components/Settings.jsx` + `defaultSettingsForm`

```js
// src/utils/defaultValues.js
defaultSettingsForm = {
  notification: false,
  // sound: false,  // REMOVED
  addTimeAmount: 1,
  showAddTimeAmount: true,
  showIdleTimer: true,
  wakeLock: false, // NEW — opt-in
};
```

- Remove the "Sound" `<Switch>` row in `Settings.jsx`.
- Add a "Keep screen awake" `<Switch name="wakeLock">` row; it falls through the generic `else` branch of `handleChecked` (no permission flow).
- Extend the `notification` alert text to mention that on iOS the site must be launched from the home-screen icon for notifications to arrive.

### 6. Removals

- `src/workers/timer.worker.js` — deleted (logic moves to `src/sw/sw.js`).
- `push.js` dependency removed from `package.json`; the `import Push from "push.js"` line removed.
- `bell-ring.mp3` / `switch.mp3` files left in place unless requested otherwise.

## Data flow

**Start (Play tapped):** page sends `{ command: "start", value, notification? }`. SW stores `endTime`, starts interval, broadcasts first `tick`. Page `setCount`s. `useWakeLock` arms if enabled + visible.

**Finish, foreground:** SW posts `finish` to all clients and calls `showNotification`. Page flips `isCountdownFinished`, `Timer` effect runs `handleSkip` (session bookkeeping, idle-timer reset). Wake lock released.

**Finish, background/idle (the fix):** SW `setInterval` continues as long as the browser keeps the SW alive. On `remaining <= 0`, SW posts `finish` (queued for next client wake) and calls `showNotification`. OS banner + OS sound/vibration appear. On reopen, queued `finish` arrives, UI resyncs, session advances.

**Missed finish (SW was also suspended):** on page reopen `useCountdown` sends `query`; if `endTime <= Date.now()`, SW emits `tick(0)` + `finish` to the requester, calls `showNotification` if enabled, and clears state; if `endTime` is in the future, SW replies with the current `remaining` so the UI resumes in sync; if no `endTime`, hook initializes from `initialCount`.

**Extend / Pause / Stop:** `extend` adjusts `endTime`+immediate tick; `stop` clears state. Closing the tab entirely: SW keeps running its interval as long as the browser permits (`showNotification` still fires without a page on Android; limited on iOS).

## Error handling

- **SW unavailable / fails to register:** `useCountdown` warns and leaves `count` at `initialCount`. No crash, no in-app error UI. No fallback to main-thread interval (that's the bug pattern).
- **Notification permission denied (at start or revoked mid-run):** Settings flow unchanged for `notification` toggle. SW wraps `showNotification` in `try/catch`; on catch logs and still posts `finish` so session bookkeeping works. `notification` payload only sent when `settings.notification` is true.
- **Wake Lock missing/denied:** `useWakeLock` feature-detects `navigator.wakeLock`; no-ops if absent. Catches `AbortError`/`NotAllowedError`, releases sentinel ref. Re-arms on `visibilitychange` → visible. No user-facing error.
- **Clock drift / missed finishes:** covered by `query` on page (re)open (above).
- **Fresh SW during an active session:** `skipWaiting`+`claim` take over but new SW has no `endTime`; `query` returns nothing; hook resets from `initialCount`. User retaps Play. Acceptable (rare).
- **Multiple controlled clients:** SW broadcasts to all. Last-write-wins on `start`. No per-tab isolation.

## Testing (Vitest, new)

Added devDeps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`,
`jsdom` environment. New `vitest.config.js` with `environment: "jsdom"` and
`setupFiles: ["./src/test/setup.js"]` (jest-dom matchers). New `package.json`
scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

SW and platform APIs are mocked at the file level; no real SW in jsdom.

| File | What's verified |
| ---- | --------------- |
| `src/sw/sw.test.js` | `start` immediate tick + countdown → `finish` + exactly one `showNotification` (and none when `notification` absent); `stop` clears interval; `extend` advances `endTime` and next tick reflects it; `query` returns accurate `remaining`; `query` with past `endTime` emits `tick(0)`+`finish` and clears state; `start` while running clears prior interval first. Uses `vi.useFakeTimers` + mocked `self.registration`/`self.clients`/`self.Notification`. |
| `src/hooks/useCountdown.test.jsx` | `startCountdown(60)` posts `start`; `tick` message updates `count`; `finish` flips `isCountdownFinished` and zeros `count`; `resetCountdown` posts `stop` + resets from `initialCount`; `controller` null initially waits for `controllerchange`; SW-down path (`ready` rejects) leaves `count` at `initialCount` and warns. |
| `src/hooks/useWakeLock.test.js` | `useWakeLock(true)` while visible requests once; flipping `false` calls `release`; `visibilitychange` hidden→visible re-arms; API absent → no throw, no request. |
| `src/components/Settings.test.jsx` | "Keep screen awake" Switch calls `setForm` with `wakeLock: true`; "Sound" Switch is **absent**; "Notification" toggle retains existing alert behavior. |
| `src/components/Timer.test.jsx` (regression) | On mocked `finish`, `Timer` calls `skipSession(true)` when count < 20% of `seconds` else `skipSession(false)`; **assert `new Audio` spy count is 0** across all interactions; **assert `Push.create` is never called**; Play/Pause/Skip clicks trigger no `Audio` calls. |

**Out of scope (manual only):** real SW behavior in a browser, iOS/Android
suspension timings, end-to-end notification delivery, PWA install flow.

## Files touched

- New: `src/sw/sw.js`, `src/test/setup.js`, `vitest.config.js`,
  `src/sw/sw.test.js`, `src/hooks/useCountdown.test.jsx`,
  `src/hooks/useWakeLock.js`, `src/hooks/useWakeLock.test.js`,
  `src/components/Settings.test.jsx`, `src/components/Timer.test.jsx`.
- Modified: `vite.config.js` (injectManifest), `package.json` (deps +
  scripts), `src/hooks/useCountdown.jsx`, `src/components/Timer.jsx`,
  `src/components/Settings.jsx`, `src/utils/defaultValues.js`.
- Removed: `src/workers/timer.worker.js`, `push.js` dependency.
