# Idle Timer After Session Ends — Design

Date: 2026-06-23

## Goal

Show a small, neutral "Idle 0:23" badge next to the session label in the
action button row whenever a session has _naturally_ ended and the user has
not yet started the next one. The badge is purely informational — it does
not auto-start the next session, does not play sounds, and does not persist
across reloads.

## Non-goals

- Auto-starting the next session after a delay.
- Persisting the idle counter across page reloads.
- Counting idle time when the user manually clicks Skip.
- Changing the existing "settings" localStorage shape beyond adding one
  boolean field.

## User-visible behavior

| Aspect               | Behavior                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Trigger              | A countdown reaches `00:00` naturally (i.e. the timer's `isCountdownFinished` flips to `true`).                                     |
| Does **not** trigger | The user clicks Skip (treated as a manual abort, not a finished session).                                                           |
| Counter source       | Wall-clock time via a 1 Hz `setInterval` in the React component.                                                                    |
| Display format       | `⏳ Idle 0:23` (lucide `Hourglass` + text) up to 59:59, then `⏳ Idle 12m` (minutes only, no leading `0:`).                         |
| Reset                | When the user clicks Play on the next session, when the user clicks Skip while idle, and when the user switches profile while idle. |
| On app reload        | Hidden. The timer is "00:00" and the idle badge is hidden until the next natural session end.                                       |
| Toggle               | New `Settings → "Show idle timer"`, default **ON**, persisted via the existing `settings` localStorage entry.                       |
| Color                | Neutral / muted (low contrast), independent of the current session theme.                                                           |
| Position             | Inline in the `timer__currentSession` row, next to the existing "focus / break / long break" label and its icon.                    |

## Architecture

### 1. New setting

Add one boolean to `defaultSettingsForm` in
`src/utils/defaultValues.js`:

```js
defaultSettingsForm = {
  notification: false,
  sound: false,
  addTimeAmount: 1,
  showAddTimeAmount: true,
  showIdleTimer: true, // NEW
};
```

This persists to `localStorage` under the existing `settings` key,
following the same pattern as the existing `notification` and `sound`
toggles. Existing users get `showIdleTimer: true` on first read because
`Pomodoro.jsx` already does
`JSON.parse(localStorage.getItem("settings")) || defaultSettingsForm`.

### 2. New state in `Timer.jsx`

```js
const [isIdle, setIsIdle] = useState(false);
const [idleSeconds, setIdleSeconds] = useState(0);
```

Both live in `Timer.jsx`. They do not need to lift to `Pomodoro.jsx`
because nothing outside the timer display cares about them.

### 3. Detect natural session end

Extend the existing effect in `Timer.jsx` that watches
`isCountdownFinished`:

```js
useEffect(() => {
  if (count.count === 0) {
    handleSkip();
    displayNotification();
    playSound(bellRingSoundURL);
    if (settings.showIdleTimer) setIsIdle(true);
  }
}, [isCountdownFinished]);
```

The user-triggered Skip path goes through the same `handleSkip` function
but does not flip `isCountdownFinished`, so it does not re-enter this
effect. This is what naturally gates the badge to "natural end only".

### 4. Tick the idle counter

```js
useEffect(() => {
  if (!isIdle) return;
  const id = setInterval(() => setIdleSeconds((s) => s + 1), 1000);
  return () => clearInterval(id);
}, [isIdle]);
```

Wall-clock only. If the tab is backgrounded, the browser throttles
`setInterval` to roughly 1 Hz, which is the desired behavior (see
"Tab hidden" in Edge cases).

### 5. Reset on user action

Reset `isIdle` and `idleSeconds` in three places:

- **Play** — inside `handleRunning("play")`:
  ```js
  setIsIdle(false);
  setIdleSeconds(0);
  ```
- **Skip while idle** — inside `handleSkip` (the user-clickable skip
  path), so the badge clears when the user moves to the next session by
  hand.
- **Profile switch** — extend the existing effect on `currentProfile`
  in `Timer.jsx` to also clear idle state, matching the existing pattern
  of treating a profile switch as a full stop.

The natural-end path (`isCountdownFinished` → `handleSkip`) does **not**
need to reset, because we _want_ idle to start there.

### 6. Format helper

```js
const formatIdle = (s) => {
  if (s < 3600) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }
  return `${Math.floor(s / 60)}m`;
};
```

Threshold of 60 minutes (3600 seconds) is the "roll over to minutes"
boundary, matching the agreed cap.

### 7. Render in the action row

Inside the `timer__currentSession` `<span>` in `Timer.jsx`, append the
badge when active:

```jsx
{
  isIdle && settings.showIdleTimer && (
    <span className="timer__idleBadge" aria-live="polite">
      <Hourglass size={14} />
      Idle {formatIdle(idleSeconds)}
    </span>
  );
}
```

`Hourglass` is already imported from `lucide-react` in `Timer.jsx`.
`aria-live="polite"` lets screen readers announce updates without
interrupting.

### 8. Settings modal

In `src/components/Settings.jsx`, add a new `<Switch>` for
`"Show idle timer"` bound to `form.showIdleTimer`, placed alongside the
existing `notification` and `sound` toggles. Same visual pattern, no new
component.

### 9. SCSS

Add to `src/styles/components/Timer.scss`:

```scss
.timer__idleBadge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.5rem;
  padding: 0.1rem 0.5rem;
  font-size: 0.85rem;
  color: var(--color-text-muted, #888);
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
  white-space: nowrap;
}
```

The exact muted color is the existing text-muted token if one is defined
in the project's design system; otherwise the fallback `#888` is used.
The badge uses neutral colors regardless of the current session theme.

## Data flow

```
Worker (timer.worker.js) → posts "finish"
   ↓
useCountdown → isCountdownFinished = true
   ↓
Timer.jsx effect on isCountdownFinished
   ↓
   count.count === 0  →  handleSkip()  (moves to next session type)
   ↓
   setIsIdle(true)            (only if settings.showIdleTimer)
   ↓
1 Hz setInterval ticks idleSeconds
   ↓
formatIdle(idleSeconds) renders "Idle 0:23" / "Idle 12m"
   ↓
User clicks Play (or Skip, or switches profile)
   ↓
setIsIdle(false), setIdleSeconds(0)  →  badge disappears
```

## Edge cases

- **Skip during idle.** The user lets a focus session end (badge appears),
  then clicks Skip. `handleSkip` clears `isIdle` and `idleSeconds` along
  with the existing pause state. The next session type loads normally.
- **Profile switch during idle.** The existing effect on `currentProfile`
  pauses the timer; we extend it to also clear idle state so the badge
  doesn't linger under a different profile.
- **Settings toggle off mid-idle.** Turning the toggle off hides the
  badge but does not stop the underlying counter. Toggling it back on
  shows the badge with the up-to-date count. The setting is a display
  preference, not an authoritative state.
- **Tab hidden / window minimized.** The `setInterval` is throttled by
  the browser to ~1 Hz in background tabs, which is exactly the
  granularity we want. The counter still reflects real wall-clock time
  within browser-imposed limits.
- **Multiple `isCountdownFinished` flips in one session.** Defensive: if
  it ever happens, `setIsIdle(true)` is idempotent and the counter
  simply keeps going from its current value. Not expected to fire
  because the worker clears `endTime` on finish, but the UI does not
  crash if it does.
- **localStorage missing or stale.** For brand-new users with no stored
  `settings` blob, `Pomodoro.jsx` falls back to `defaultSettingsForm`,
  which now contains `showIdleTimer: true` — the badge is on by default.
  For existing users with a stored `settings` blob, the field is
  `undefined`, which is falsy, so the badge is hidden until the toggle
  is enabled in Settings. The first time such a user opens the Settings
  modal, the existing effect on `form` writes the (merged) form back
  to `localStorage`, so `showIdleTimer: true` becomes persisted. We
  accept this small "off until first Settings visit" window for
  existing users as the simplest path; the alternative (a one-time
  migration read in `Pomodoro.jsx`) is not worth the code. No crash
  path: the render guard `settings.showIdleTimer` short-circuits on
  `undefined`.

## Files to modify

| File                               | Change                                                                                                                            |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `src/utils/defaultValues.js`       | Add `showIdleTimer: true` to `defaultSettingsForm`                                                                                |
| `src/components/Settings.jsx`      | Add a `<Switch>` for "Show idle timer"                                                                                            |
| `src/components/Timer.jsx`         | Add `isIdle` / `idleSeconds` state, idle-tick effect, format helper, badge JSX, reset calls in Play / Skip / profile-switch paths |
| `src/styles/components/Timer.scss` | Style for `.timer__idleBadge`                                                                                                     |

## Validation

- `npm run lint` passes.
- `npm run build` succeeds.
- Manual:
  1. Let a focus session end naturally → "Idle 0:01", "Idle 0:02" ticks
     up. After 60 s, switches to "Idle 1m".
  2. Click Play → badge disappears, timer starts.
  3. Click Skip on a fresh session → no badge appears.
  4. Open Settings, toggle "Show idle timer" off → badge never appears
     on natural end. Toggle back on → reappears with up-to-date count.
  5. Switch profile while idle → badge clears.
  6. Reload the page after natural end → no badge, timer is "00:00".
