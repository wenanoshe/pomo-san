# Replace FontAwesome icons with Lucide React icons — Design

Date: 2026-06-22
Status: Approved (pending spec review)

## Goal

Replace all FontAwesome icon usages in the React source with [lucide-react](https://lucide.dev/) icons, then remove the FontAwesome dependencies. The visual outcome is a single, consistent stroke-icon set throughout the app.

## Non-goals

- Editing historical plan files in `docs/plans/` that mention FontAwesome (they document past decisions).
- Manually editing `package-lock.json` (it regenerates via `npm install`).
- Changing any SCSS rules or the `Button` component's `outline` prop.
- Changing layout, aria labels, or component composition beyond the icon swap.

## Current state

FontAwesome is used in 5 source files with these icons:

| File | FontAwesome icons |
|---|---|
| `src/components/Timer.jsx` | `faPlay`, `faPause`, `faForward`, `faGear`, `faHourglass`, `faMugHot` (solid); `faSquarePlus` (regular) |
| `src/components/Settings.jsx` | `faXmark`, `faGear` |
| `src/components/AddProfile.jsx` | `faCirclePlus`, `faEdit` |
| `src/components/ProfileItem.jsx` | `faFeather`, `faTrash`, `faXmark` |
| `src/components/ProfileSwitcher.jsx` | `faClock`, `faXmark`, `faCirclePlus` |

`package.json` depends on:
- `@fortawesome/free-regular-svg-icons` ^7.2.0
- `@fortawesome/free-solid-svg-icons` ^7.1.0
- `@fortawesome/react-fontawesome` ^3.1.1

## Design

### Dependency change

- Add `lucide-react` (latest stable, React 19 compatible) to `dependencies`.
- Remove all three `@fortawesome/*` entries from `package.json`.
- Run `npm install` so the lockfile updates and `node_modules/@fortawesome/*` is cleared.

### Import / usage pattern

FontAwesome:
```jsx
import { FontAwesomeIcon as FAI } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
<FAI icon={faGear} className="btn__icon" />
```

Lucide:
```jsx
import { Cog } from "lucide-react";
<Cog className="btn__icon" />
```

Lucide components accept standard SVG/HTML attributes (`className`, `aria-*`, `style`) directly, so no wrapper component is needed. The existing `className="btn__icon"` is preserved, keeping SCSS sizing rules intact.

### Icon mapping (closest-by-shape, unified stroke)

Decision: match by visual meaning and accept Lucide's stroke-only aesthetic everywhere. FontAwesome's filled-solid look cannot be replicated; the point of the switch is a single consistent stroke set.

| FontAwesome | Lucide | Reason |
|---|---|---|
| `faPlay` | `Play` | Triangle |
| `faPause` | `Pause` | Two bars |
| `faForward` | `FastForward` | Double-triangle skip |
| `faGear` | `Cog` | Plain gear; `Settings` adds sliders, not wanted |
| `faHourglass` | `Hourglass` | Same shape |
| `faMugHot` | `Coffee` | Match by concept |
| `faSquarePlus` (regular) | `SquarePlus` | Same outline shape |
| `faXmark` | `X` | ✕ |
| `faCirclePlus` | `CirclePlus` | Stroke replaces fill (per option A) |
| `faEdit` | `Pencil` | Closest pencil shape |
| `faFeather` | `Feather` | Same glyph exists |
| `faTrash` | `Trash2` | Has the lid line like FA |
| `faClock` | `Clock` | Same shape |

### Dynamic icon choices

Two spots pass a dynamic value to the `icon` prop. Lucide has no `icon` prop, so these become conditional JSX.

`src/components/AddProfile.jsx` (current):
```jsx
<FontAwesomeIcon icon={btnName ? faEdit : faCirclePlus} />
```
becomes:
```jsx
{btnName ? <Pencil /> : <CirclePlus />}
```

`src/components/Timer.jsx` (current):
```jsx
<FAI icon={currentSession === "pomodoro" ? faHourglass : faMugHot} />
```
becomes:
```jsx
{currentSession === "pomodoro" ? <Hourglass /> : <Coffee />}
```

### Files touched

- `package.json`
- `src/components/Timer.jsx`
- `src/components/Settings.jsx`
- `src/components/AddProfile.jsx`
- `src/components/ProfileItem.jsx`
- `src/components/ProfileSwitcher.jsx`

### Untouched

- `docs/plans/*.md` files that mention FontAwesome — historical plans, out of scope.
- `package-lock.json` — regenerates on `npm install`.
- All SCSS — `btn__icon` selectors target the rendered SVG and do not reference FontAwesome's internal structure. During implementation, confirm no `*.fa-*` selectors exist anywhere in the styles; if any are found, flag them to the user rather than silently editing.
- `Button` component's `outline` prop (`Timer.jsx` L174) — Button styling, not icon-related.

## Validation

- `npm run lint` passes on the 5 edited files (eslint flat config).
- `npm run build` succeeds — no missing imports, no orphan `FAI` / `faX` references.
- Visual confirmation is left to the user via `npm run preview` (no long-running dev server started by the agent).