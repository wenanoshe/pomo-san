# Add Time to Focus Countdown — Design

## Overview

Allow users to extend a running (or paused) focus countdown by a configured amount with a single click.

---

## Design Decisions

| Aspect            | Decision                                 |
| ----------------- | ---------------------------------------- |
| Button visibility | Running or paused (hidden when stopped)  |
| Config input      | Integer minutes only                     |
| Button display    | Toggle: "+" or "+N" based on setting     |
| Timer extension   | New worker `extend` command (no restart) |
| Settings scope    | Global (same for all profiles)           |

---

## Architecture

### Settings Storage

Two new fields added to `defaultSettingsForm` in `src/utils/defaultValues.js`:

```js
defaultSettingsForm = {
  notification: false,
  sound: false,
  addTimeAmount: 1, // integer minutes, default 1
  showAddTimeAmount: true, // toggle button label: "+1" vs "+"
};
```

These persist to `localStorage` under the existing `settings` key, following the same pattern as notification/sound.

### Worker Extension

Add a new `extend` command to `src/workers/timer.worker.js`:

```js
case "extend":
  // value is additional seconds to add
  endTime += value * 1000;
  break;
```

The worker does **not** restart or reset the interval — it simply pushes the `endTime` forward, ensuring a seamless extension with no timing gap.

### useCountdown Hook

Add a new exported function `extendCountdown(seconds)` that posts `{ command: "extend", value: seconds }` to the worker.

```js
const extendCountdown = useCallback((seconds) => {
  if (workerRef.current) {
    workerRef.current.postMessage({ command: "extend", value: seconds });
  }
}, []);
```

### Settings Modal

Extend `src/components/Settings.jsx` with two new fields:

1. **Number input** for `addTimeAmount` — integer, min 1
2. **Toggle/Switch** for `showAddTimeAmount` — controls whether the "+" button shows just "+" or "+N"

The input follows the same visual pattern as the existing Switch toggles.

### Timer Component

Add a "+" button to `src/components/Timer.jsx`:

- **Visibility**: `isTimerRunning || isPaused` — shown during running or paused states, hidden when stopped
- **Icon**: Uses `faPlus` from FontAwesome, rendered as an outline icon
- **Label**: If `settings.showAddTimeAmount` is true, display "+{addTimeAmount}" (e.g., "+1"); otherwise just "+"
- **Action**: Calls `extendCountdown(addTimeAmount * 60)` when clicked

The button is placed to the right of the countdown display, visually aligned with the existing timer controls.

---

## Data Flow

```
Settings Modal → form state → localStorage("settings")
                                    ↓
                           Pomodoro reads settings
                                    ↓
Timer receives settings + showAddTimeAmount + addTimeAmount
                                    ↓
Timer renders "+" button (visible when running||paused)
                                    ↓
Click → extendCountdown(addTimeAmount * 60)
            ↓
      worker.postMessage({ command: "extend", value: seconds })
            ↓
      endTime += value * 1000  (no interval restart)
```

---

## Edge Cases

- **Timer stopped**: Button hidden, no action possible
- **Timer at 0**: If countdown reaches 0 and auto-skips, button becomes hidden again
- **addTimeAmount < 1**: Enforce minimum of 1 minute in the input validation
- **localStorage absent**: Defaults apply (addTimeAmount: 1, showAddTimeAmount: true)
- **Profile switch**: If timer was running/paused, it pauses on profile switch per existing behavior; button reflects paused state

---

## Files to Modify

| File                               | Change                                                               |
| ---------------------------------- | -------------------------------------------------------------------- |
| `src/utils/defaultValues.js`       | Add `addTimeAmount` and `showAddTimeAmount` to `defaultSettingsForm` |
| `src/workers/timer.worker.js`      | Add `extend` command                                                 |
| `src/hooks/useCountdown.jsx`       | Add `extendCountdown` function                                       |
| `src/components/Settings.jsx`      | Add two new form fields                                              |
| `src/components/Timer.jsx`         | Add "+" button with visibility and action                            |
| `src/styles/components/Timer.scss` | Style the new button                                                 |
