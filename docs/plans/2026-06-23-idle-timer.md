# Idle Timer After Session Ends — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a small neutral "Idle 0:23" badge in the action row after any session (pomodoro, break, long break) naturally ends, with a Settings toggle to enable/disable it.

**Architecture:** New `isIdle`/`idleSeconds` state lives entirely in `Timer.jsx`. The idle counter ticks via a 1 Hz `setInterval` started by a React effect gated on `isIdle`. One new boolean field added to `defaultSettingsForm`, rendered as a `<Switch>` in the Settings modal, following the existing settings pattern exactly.

**Tech Stack:** React 19, SCSS (api: "modern"), lucide-react `Hourglass` icon (already imported), no new dependencies.

---

## Global Constraints

- Dev server: `npm run dev` on port **5001**
- Build: `npm run build` outputs to `dist/`
- Lint: `npm run lint` (ESLint flat config, `eslint.config.js`)
- No test suite exists (per AGENTS.md)
- SCSS uses `api: "modern"` (required for Vite 8 + sass 1.97+)

---

## File map

| File | Role |
| --- | --- |
| `src/utils/defaultValues.js` | Add `showIdleTimer: true` to `defaultSettingsForm` |
| `src/components/Settings.jsx` | Add "Show idle timer" `<Switch>` |
| `src/components/Timer.jsx` | All idle logic: state, effects, format helper, badge JSX, reset calls |
| `src/styles/components/Timer.scss` | Style for `.timer__idleBadge` |

---

## Task 1: Add `showIdleTimer` to `defaultSettingsForm`

**File:** `src/utils/defaultValues.js`

**Change:** Add `showIdleTimer: true` to the exported `defaultSettingsForm` object, as the last field.

```js
export const defaultSettingsForm = {
  notification: false,
  sound: false,
  addTimeAmount: 1,
  showAddTimeAmount: true,
  showIdleTimer: true, // NEW
};
```

---

## Task 2: Add "Show idle timer" Switch to Settings modal

**File:** `src/components/Settings.jsx`

**Interface:** No inputs/outputs change. The `form` prop already flows in/out; `form.showIdleTimer` is a new boolean field managed by the existing `setForm`.

**Change:** In the `<form className="settings__form">` block, after the existing `"Show time on button"` field, add:

```jsx
<div className="settings__field">
  <span>Show idle timer</span>
  <Switch
    name="showIdleTimer"
    checked={form.showIdleTimer}
    onChange={handleChecked}
  />
</div>
```

`handleChecked` already handles generic `target.checked` for boolean switches via the `else` branch (`setForm({ ...form, [target.name]: target.checked })`), so no logic change is needed.

---

## Task 3: Wire all idle logic into `Timer.jsx`

**File:** `src/components/Timer.jsx`

This is the largest task. All changes are additive; no existing logic is removed except where explicitly noted.

### 3a. New state declarations

Add after the existing `useCountdown` destructure:

```js
const [isIdle, setIsIdle] = useState(false);
const [idleSeconds, setIdleSeconds] = useState(0);
```

### 3b. Format helper

Add as a module-level (or component-local, before the `return`) function:

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

### 3c. Idle-tick effect

Add as a new `useEffect` block in the effects section (alongside the existing `useEffect` for `document.title`, `count.count === 0`, and `currentProfile`):

```js
useEffect(() => {
  if (!isIdle) return;
  const id = setInterval(() => setIdleSeconds((s) => s + 1), 1000);
  return () => clearInterval(id);
}, [isIdle]);
```

### 3d. Extend the natural-end effect

In the existing `useEffect` that watches `isCountdownFinished` and fires when `count.count === 0`, add the idle trigger as the last line inside the `if`:

```js
useEffect(() => {
  if (count.count === 0) {
    handleSkip();
    displayNotification();
    playSound(bellRingSoundURL);
    if (settings.showIdleTimer) setIsIdle(true); // NEW
  }
}, [isCountdownFinished]);
```

### 3e. Reset on Play

In `handleRunning("play")`, add at the start of the `"play"` case (before `startCountdown(msg)`):

```js
setIsIdle(false);
setIdleSeconds(0);
```

### 3f. Reset on Skip (user-initiated)

In `handleSkip()`, add at the top of the function (before the `minimumToCountAsSession` logic):

```js
setIsIdle(false);
setIdleSeconds(0);
```

Note: This fires for *all* skips — both natural-end skips and user-initiated skips. This is correct: we want the badge gone in both cases.

### 3g. Reset on profile switch

Extend the existing `useEffect` on `currentProfile` to also clear idle state:

```js
useEffect(() => {
  // When we change the profile in a running session
  handleRunning("pause");
  setIsPaused(false);
  setIsIdle(false);    // NEW
  setIdleSeconds(0);   // NEW
}, [currentProfile]);
```

### 3h. Render the badge

In the `timer__currentSession` `<span>`, after the existing session text and icon, append:

```jsx
{isIdle && settings.showIdleTimer && (
  <span className="timer__idleBadge" aria-live="polite">
    <Hourglass size={14} />
    Idle {formatIdle(idleSeconds)}
  </span>
)}
```

The `Hourglass` icon is already imported from `lucide-react` at the top of the file. The `aria-live="polite"` attribute ensures screen readers announce idle-time updates without interrupting.

---

## Task 4: Style the idle badge

**File:** `src/styles/components/Timer.scss`

**Change:** Append the `.timer__idleBadge` rule inside the existing `.timer` block (or after it, at the root level — both work with the existing SCSS structure):

```scss
.timer__idleBadge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.5rem;
  padding: 0.1rem 0.5rem;
  font-size: 0.85rem;
  color: #888;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
  white-space: nowrap;
}
```

No new CSS variable is introduced; the existing design system has no `color-text-muted` token, so a hardcoded muted gray `#888` is used directly (matching the fallback documented in the spec).

---

## Task 5: Validate

- [ ] `npm run lint` — must pass with no errors
- [ ] `npm run build` — must succeed and produce `dist/`
- [ ] **Manual testing** (all six scenarios from the spec):
  1. Let a focus session end naturally → "Idle 0:01", "Idle 0:02"... after 60 s → "Idle 1m"
  2. Click Play → badge disappears, timer starts
  3. Click Skip on a fresh session → no badge appears
  4. Settings → toggle "Show idle timer" off → badge never appears on natural end; toggle back on → badge reappears with current count
  5. Switch profile while idle → badge clears
  6. Reload page after natural end → no badge, timer is "00:00"

---

## Spec coverage check

| Spec requirement | Task |
| --- | --- |
| Badge appears only on natural session end | Task 3d (effect gate via `count.count === 0`) |
| Does NOT trigger on Skip | Task 3f (reset on skip; `isCountdownFinished` only flips on natural end) |
| Wall-clock counter at 1 Hz | Task 3c (`setInterval` effect) |
| Format: `M:SS` up to 59:59, then `Nm` | Task 3b (`formatIdle` helper) |
| Reset on Play | Task 3e |
| Reset on Skip while idle | Task 3f |
| Reset on profile switch | Task 3g |
| No persistence on reload | Task 3a (state is component-local, no localStorage writes) |
| Settings toggle default ON | Task 1 (`defaultSettingsForm`) + Task 2 (Switch) |
| Toggle persisted via existing settings | Task 2 (handled by existing `Pomodoro.jsx` effects) |
| Neutral muted color | Task 4 |
| Inline with session label | Task 3h |
| `Hourglass` icon (already imported) | Task 3h |
| `aria-live="polite"` | Task 3h |
| No new dependencies | All tasks |

All spec requirements are covered. No placeholders, no TODOs, no vague steps.
