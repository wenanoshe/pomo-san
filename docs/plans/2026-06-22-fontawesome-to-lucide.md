# Replace FontAwesome with Lucide React — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every FontAwesome icon in the React source with the equivalent `lucide-react` icon and remove the FontAwesome dependencies.

**Architecture:** A pure icon-swap migration. Each `<FontAwesomeIcon icon={faX} />` is replaced by the corresponding Lucide component (`<X />`) passing the same `className`. Two dynamic-`icon` sites become conditional JSX because Lucide has no `icon` prop. The dependency change is staged: Lucide is added first, files are migrated one-by-one while keeping the app buildable, then FontAwesome packages are removed last.

**Tech Stack:** React 19, Vite 8, SCSS (modern API), no test suite. Validation is ESLint (flat config) + `vite build`.

## Global Constraints

- Project root: `pomo-san/`. All paths in this plan are relative to the project root (`pomo-san/...`); run commands from the `pomo-san/` directory.
- Dev/build commands (from `pomo-san/AGENTS.md`):
  - `npm run dev` — dev server on port **5001**
  - `npm run build` — builds to `dist/`
  - `npm run preview` — preview on port **5050**
- No test suite exists in this project (`pomo-san/AGENTS.md`). Per-task verification uses ESLint on the edited file and, for the final task, a full `npm run build`.
- Exact ESLint invocation per file: `npx eslint <path>` (the `lint:check` script targets the whole `src/` tree; this plan scopes to one file per task for fast feedback).
- ESLint flat config at `eslint.config.js` enables `react/react-in-jsx-scope: off` and `react/prop-types: off` — no changes to those rules are needed for Lucide imports.
- Lucide components accept standard SVG/HTML attributes (`className`, `aria-*`, `style`) directly. No wrapper component is introduced.
- Icon mapping (decided in the approved spec `docs/plans/2026-06-22-fontawesome-to-lucide-design.md`):

  | FontAwesome | Lucide |
  |---|---|
  | `faPlay` | `Play` |
  | `faPause` | `Pause` |
  | `faForward` | `FastForward` |
  | `faGear` | `Cog` |
  | `faHourglass` | `Hourglass` |
  | `faMugHot` | `Coffee` |
  | `faSquarePlus` (regular) | `SquarePlus` |
  | `faXmark` | `X` |
  | `faCirclePlus` | `CirclePlus` |
  | `faEdit` | `Pencil` |
  | `faFeather` | `Feather` |
  | `faTrash` | `Trash2` |
  | `faClock` | `Clock` |

- Out of scope (per spec): editing `docs/plans/*.md` files that mention FontAwesome, manually editing `package-lock.json` (regenerates on `npm install`), changing any SCSS, changing the `Button` component's `outline` prop. An SCSS grep in Task 7 confirms no `*.fa-*` selectors are left behind — if any are found, flag to the user rather than editing.

## File Structure

Files modified (no new files created):

- `pomo-san/package.json` — drop 3 `@fortawesome/*` deps, add `lucide-react`. (Touched in Task 1 and Task 7.)
- `pomo-san/src/components/Settings.jsx` — 2 icons.
- `pomo-san/src/components/AddProfile.jsx` — 2 icons, 1 dynamic-`icon` site.
- `pomo-san/src/components/ProfileItem.jsx` — 3 icons.
- `pomo-san/src/components/ProfileSwitcher.jsx` — 3 icons (4 usage sites).
- `pomo-san/src/components/Timer.jsx` — 7 icons, 1 dynamic-`icon` site.

No SCSS files are modified.

---

### Task 1: Add `lucide-react` dependency

**Files:**
- Modify: `pomo-san/package.json` (dependencies block)

**Interfaces:**
- Produces: `lucide-react` installed in `node_modules`, importable in later tasks as `import { Play, Pause, ... } from "lucide-react"`.

FontAwesome packages are **not** removed in this task — they stay installed so the app keeps building while files are migrated one-by-one in Tasks 2–6.

- [ ] **Step 1: Install `lucide-react`**

Run from the `pomo-san/` directory:
```bash
npm install lucide-react
```
Expected: adds `lucide-react` to `dependencies` in `package.json` and updates `package-lock.json`. No errors.

- [ ] **Step 2: Verify it imports**

Run:
```bash
node -e "import('lucide-react').then(m => console.log('ok', typeof m.Cog))"
```
Expected output:
```
ok function
```

(If the above fails because the project is ESM-only / the one-liner resolves weirdly, skip — the real proof is the per-file lint in later tasks. Do not block on this step.)

- [ ] **Step 3: Confirm `package.json` got the entry**

Run:
```bash
grep lucide-react package.json
```
Expected: a line like `"lucide-react": "^X.Y.Z",` inside `dependencies`. The three `@fortawesome/*` entries must still be present (removed in Task 7).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add lucide-react dependency"
```

---

### Task 2: Migrate `Settings.jsx`

**Files:**
- Modify: `pomo-san/src/components/Settings.jsx:1-2` (imports)
- Modify: `pomo-san/src/components/Settings.jsx:57-59` (usage)

**Interfaces:**
- Consumes: `lucide-react` (installed in Task 1).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace the import block**

Replace `pomo-san/src/components/Settings.jsx:1-2`:
```jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faGear } from "@fortawesome/free-solid-svg-icons";
```
with:
```jsx
import { Cog } from "lucide-react";
```

(`faXmark` is imported but only `faGear` is used at the rendered site in this file; `faXmark` will be confirmed unused in Step 3 before leaving it out. If lint flags an unused-import anywhere else it gets caught in Step 3.)

- [ ] **Step 2: Replace the usage**

Replace `pomo-san/src/components/Settings.jsx:57-59`:
```jsx
        <h3 className="settings__title">
          <span>Settings</span> <FontAwesomeIcon icon={faGear} />
        </h3>
```
with:
```jsx
        <h3 className="settings__title">
          <span>Settings</span> <Cog />
        </h3>
```

- [ ] **Step 3: Verify no `faXmark` usage remains**

Run:
```bash
grep -n "faXmark\|FontAwesomeIcon" pomo-san/src/components/Settings.jsx
```
Expected: no matches. (If any match, remove the leftover usage before linting — the spec only documents `faGear` as rendered here, but verify rather than assume.)

- [ ] **Step 4: Lint**

Run:
```bash
npx eslint pomo-san/src/components/Settings.jsx
```
Expected: no output, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add pomo-san/src/components/Settings.jsx
git commit -m "refactor(Settings): swap FontAwesome icons for lucide-react"
```

---

### Task 3: Migrate `AddProfile.jsx`

**Files:**
- Modify: `pomo-san/src/components/AddProfile.jsx:1-2` (imports)
- Modify: `pomo-san/src/components/AddProfile.jsx:131-138` (usage, dynamic `icon`)

**Interfaces:**
- Consumes: `lucide-react` (Task 1).
- Produces: nothing.

Contains one dynamic-`icon` site — `icon={btnName ? faEdit : faCirclePlus}`. Lucide has no `icon` prop, so this becomes conditional JSX.

- [ ] **Step 1: Replace the import block**

Replace `pomo-san/src/components/AddProfile.jsx:1-2`:
```jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faEdit } from "@fortawesome/free-solid-svg-icons";
```
with:
```jsx
import { CirclePlus, Pencil } from "lucide-react";
```

- [ ] **Step 2: Replace the usage (dynamic `icon` → conditional JSX)**

Replace `pomo-san/src/components/AddProfile.jsx:131-138`:
```jsx
      <Button
        type="submit"
        onClick={handleSubmit}
        className="profileForm__submit"
      >
        <span>{btnName || "Add"}</span>
        <FontAwesomeIcon icon={btnName ? faEdit : faCirclePlus} />
      </Button>
```
with:
```jsx
      <Button
        type="submit"
        onClick={handleSubmit}
        className="profileForm__submit"
      >
        <span>{btnName || "Add"}</span>
        {btnName ? <Pencil /> : <CirclePlus />}
      </Button>
```

- [ ] **Step 3: Verify no leftovers**

Run:
```bash
grep -n "fa\|FontAwesomeIcon" pomo-san/src/components/AddProfile.jsx
```
Expected: no matches. (Note: the broad `fa` pattern will also match unrelated words — if a false positive shows up, narrow to `fa[A-Z]\|FontAwesomeIcon`.)

- [ ] **Step 4: Lint**

Run:
```bash
npx eslint pomo-san/src/components/AddProfile.jsx
```
Expected: no output, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add pomo-san/src/components/AddProfile.jsx
git commit -m "refactor(AddProfile): swap FontAwesome icons for lucide-react"
```

---

### Task 4: Migrate `ProfileItem.jsx`

**Files:**
- Modify: `pomo-san/src/components/ProfileItem.jsx:1-2` (imports)
- Modify: `pomo-san/src/components/ProfileItem.jsx:35-37` (faFeather)
- Modify: `pomo-san/src/components/ProfileItem.jsx:40-42` (faTrash)
- Modify: `pomo-san/src/components/ProfileItem.jsx:53-58` (faXmark)

**Interfaces:**
- Consumes: `lucide-react` (Task 1).
- Produces: nothing.

Three usage sites, all static icons.

- [ ] **Step 1: Replace the import block**

Replace `pomo-san/src/components/ProfileItem.jsx:1-2`:
```jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFeather, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
```
with:
```jsx
import { Feather, Trash2, X } from "lucide-react";
```

- [ ] **Step 2: Replace the edit button (faFeather)**

Replace `pomo-san/src/components/ProfileItem.jsx:35-37`:
```jsx
        <Button onClick={handleEditProfile} className="btn--sm sec-2 ">
          <FontAwesomeIcon icon={faFeather} />
        </Button>
```
with:
```jsx
        <Button onClick={handleEditProfile} className="btn--sm sec-2 ">
          <Feather />
        </Button>
```

- [ ] **Step 3: Replace the delete button (faTrash)**

Replace `pomo-san/src/components/ProfileItem.jsx:40-42`:
```jsx
          <Button onClick={handleDelProfile} className="btn--sm sec-2">
            <FontAwesomeIcon icon={faTrash} />
          </Button>
```
with:
```jsx
          <Button onClick={handleDelProfile} className="btn--sm sec-2">
            <Trash2 />
          </Button>
```

- [ ] **Step 4: Replace the modal close button (faXmark)**

Replace `pomo-san/src/components/ProfileItem.jsx:53-58`:
```jsx
          <Button
            onClick={() => closeEPModal()}
            className="btn--md sec ps__modal-close"
          >
            <FontAwesomeIcon icon={faXmark} />
          </Button>
```
with:
```jsx
          <Button
            onClick={() => closeEPModal()}
            className="btn--md sec ps__modal-close"
          >
            <X />
          </Button>
```

- [ ] **Step 5: Verify no leftovers**

Run:
```bash
grep -n "fa[A-Z]\|FontAwesomeIcon" pomo-san/src/components/ProfileItem.jsx
```
Expected: no matches.

- [ ] **Step 6: Lint**

Run:
```bash
npx eslint pomo-san/src/components/ProfileItem.jsx
```
Expected: no output, exit code 0.

- [ ] **Step 7: Commit**

```bash
git add pomo-san/src/components/ProfileItem.jsx
git commit -m "refactor(ProfileItem): swap FontAwesome icons for lucide-react"
```

---

### Task 5: Migrate `ProfileSwitcher.jsx`

**Files:**
- Modify: `pomo-san/src/components/ProfileSwitcher.jsx:1-6` (imports)
- Modify: `pomo-san/src/components/ProfileSwitcher.jsx:47-49` (faXmark — modal close, top)
- Modify: `pomo-san/src/components/ProfileSwitcher.jsx:63-66` (faCirclePlus — add profile)
- Modify: `pomo-san/src/components/ProfileSwitcher.jsx:72-77` (faXmark — modal close, add)
- Modify: `pomo-san/src/components/ProfileSwitcher.jsx:85-88` (faClock — open button)

**Interfaces:**
- Consumes: `lucide-react` (Task 1).
- Produces: nothing.

Four usage sites, all static icons (the same `faXmark` icon appears in two places).

- [ ] **Step 1: Replace the import block**

Replace `pomo-san/src/components/ProfileSwitcher.jsx:1-6`:
```jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faXmark,
  faCirclePlus,
} from "@fortawesome/free-solid-svg-icons";
```
with:
```jsx
import { Clock, X, CirclePlus } from "lucide-react";
```

- [ ] **Step 2: Replace the top modal close (faXmark)**

Replace `pomo-san/src/components/ProfileSwitcher.jsx:47-49`:
```jsx
          <Button onClick={closeModal} className="btn--md sec ps__modal-close">
            <FontAwesomeIcon icon={faXmark} />
          </Button>
```
with:
```jsx
          <Button onClick={closeModal} className="btn--md sec ps__modal-close">
            <X />
          </Button>
```

- [ ] **Step 3: Replace the add-profile button (faCirclePlus)**

Replace `pomo-san/src/components/ProfileSwitcher.jsx:63-66`:
```jsx
        <Button onClick={openAddProfileModal} className="ps__addProfileBtn">
          <span>Add new Profile</span>
          <FontAwesomeIcon icon={faCirclePlus} />
        </Button>
```
with:
```jsx
        <Button onClick={openAddProfileModal} className="ps__addProfileBtn">
          <span>Add new Profile</span>
          <CirclePlus />
        </Button>
```

- [ ] **Step 4: Replace the add-profile modal close (faXmark)**

Replace `pomo-san/src/components/ProfileSwitcher.jsx:72-77`:
```jsx
          <Button
            onClick={closeAddProfileModal}
            className="btn--md sec ps__modal-close"
          >
            <FontAwesomeIcon icon={faXmark} />
          </Button>
```
with:
```jsx
          <Button
            onClick={closeAddProfileModal}
            className="btn--md sec ps__modal-close"
          >
            <X />
          </Button>
```

- [ ] **Step 5: Replace the open button (faClock)**

Replace `pomo-san/src/components/ProfileSwitcher.jsx:85-88`:
```jsx
      <Button className="btn--md sec ps__openBtn" onClick={openModal}>
        <FontAwesomeIcon icon={faClock} />
        <span className="ps__stm">{currentProfile.name}</span>
      </Button>
```
with:
```jsx
      <Button className="btn--md sec ps__openBtn" onClick={openModal}>
        <Clock />
        <span className="ps__stm">{currentProfile.name}</span>
      </Button>
```

- [ ] **Step 6: Verify no leftovers**

Run:
```bash
grep -n "fa[A-Z]\|FontAwesomeIcon" pomo-san/src/components/ProfileSwitcher.jsx
```
Expected: no matches.

- [ ] **Step 7: Lint**

Run:
```bash
npx eslint pomo-san/src/components/ProfileSwitcher.jsx
```
Expected: no output, exit code 0.

- [ ] **Step 8: Commit**

```bash
git add pomo-san/src/components/ProfileSwitcher.jsx
git commit -m "refactor(ProfileSwitcher): swap FontAwesome icons for lucide-react"
```

---

### Task 6: Migrate `Timer.jsx`

**Files:**
- Modify: `pomo-san/src/components/Timer.jsx:1-11` (imports)
- Modify: `pomo-san/src/components/Timer.jsx:172-182` (faSquarePlus; note: FAI aliased, has `className="btn__icon"`)
- Modify: `pomo-san/src/components/Timer.jsx:189-194` (faGear)
- Modify: `pomo-san/src/components/Timer.jsx:197-205` (faPause)
- Modify: `pomo-san/src/components/Timer.jsx:207-215` (faPlay)
- Modify: `pomo-san/src/components/Timer.jsx:218-223` (faForward)
- Modify: `pomo-san/src/components/Timer.jsx:225-233` (faHourglass / faMugHot — dynamic `icon`)

**Interfaces:**
- Consumes: `lucide-react` (Task 1).
- Produces: nothing.

This file uses the alias `FontAwesomeIcon as FAI`. Every `<FAI icon={faX} ... />` becomes a Lucide component. One usage (`faHourglass`/`faMugHot`) is dynamic and becomes conditional JSX. The `className="btn__icon"` attributes are preserved verbatim so existing SCSS sizing rules keep applying.

- [ ] **Step 1: Replace the import block**

Replace `pomo-san/src/components/Timer.jsx:1-11`:
```jsx
// ASSETS
import { FontAwesomeIcon as FAI } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faForward,
  faGear,
  faHourglass,
  faMugHot,
} from "@fortawesome/free-solid-svg-icons";
import { faSquarePlus } from "@fortawesome/free-regular-svg-icons";
```
with:
```jsx
// ASSETS
import {
  Play,
  Pause,
  FastForward,
  Cog,
  Hourglass,
  Coffee,
  SquarePlus,
} from "lucide-react";
```

- [ ] **Step 2: Replace the add-time button (faSquarePlus)**

Replace `pomo-san/src/components/Timer.jsx:172-182`:
```jsx
          <Button
            onClick={() => extendCountdown(settings.addTimeAmount * 60)}
            className={`btn--${currentSession} timer__addTime`}
            outline
            aria-label="Add time to countdown"
          >
            <FAI icon={faSquarePlus} className="btn__icon" />
            {settings.showAddTimeAmount && (
              <span className="timer__addTimeLabel">
                {settings.addTimeAmount}
              </span>
```
with:
```jsx
          <Button
            onClick={() => extendCountdown(settings.addTimeAmount * 60)}
            className={`btn--${currentSession} timer__addTime`}
            outline
            aria-label="Add time to countdown"
          >
            <SquarePlus className="btn__icon" />
            {settings.showAddTimeAmount && (
              <span className="timer__addTimeLabel">
                {settings.addTimeAmount}
              </span>
```

(The `outline` prop is a `Button` prop — keep it unchanged.)

- [ ] **Step 3: Replace the settings button (faGear)**

Replace `pomo-san/src/components/Timer.jsx:189-194`:
```jsx
        <Button
          onClick={openSettingsModal}
          className={`btn--md sec btn--${currentSession}`}
        >
          <FAI icon={faGear} className="btn__icon" />
        </Button>
```
with:
```jsx
        <Button
          onClick={openSettingsModal}
          className={`btn--md sec btn--${currentSession}`}
        >
          <Cog className="btn__icon" />
        </Button>
```

- [ ] **Step 4: Replace the pause button (faPause)**

Replace `pomo-san/src/components/Timer.jsx:197-205`:
```jsx
          <Button
            className={`btn--${currentSession} timer__btn`}
            onClick={() => {
              handleRunning("pause");
              playSound(switchSoundURL);
            }}
          >
            <FAI className="btn__icon" icon={faPause} />
          </Button>
```
with:
```jsx
          <Button
            className={`btn--${currentSession} timer__btn`}
            onClick={() => {
              handleRunning("pause");
              playSound(switchSoundURL);
            }}
          >
            <Pause className="btn__icon" />
          </Button>
```

- [ ] **Step 5: Replace the play button (faPlay)**

Replace `pomo-san/src/components/Timer.jsx:207-215`:
```jsx
          <Button
            className={`btn--${currentSession} timer__btn`}
            onClick={() => {
              handleRunning("play");
              playSound(switchSoundURL);
            }}
          >
            <FAI className="btn__icon" icon={faPlay} />
          </Button>
```
with:
```jsx
          <Button
            className={`btn--${currentSession} timer__btn`}
            onClick={() => {
              handleRunning("play");
              playSound(switchSoundURL);
            }}
          >
            <Play className="btn__icon" />
          </Button>
```

- [ ] **Step 6: Replace the skip button (faForward)**

Replace `pomo-san/src/components/Timer.jsx:218-223`:
```jsx
        <Button
          onClick={handleSkip}
          className={`btn--md sec btn--${currentSession}`}
        >
          <FAI icon={faForward} className="btn__icon" />
        </Button>
```
with:
```jsx
        <Button
          onClick={handleSkip}
          className={`btn--md sec btn--${currentSession}`}
        >
          <FastForward className="btn__icon" />
        </Button>
```

- [ ] **Step 7: Replace the current-session indicator (dynamic `icon`)**

Replace `pomo-san/src/components/Timer.jsx:225-233`:
```jsx
        <span className="timer__currentSession">
          {currentSession === "pomodoro"
            ? "focus"
            : currentSession === "longBreak"
              ? "long break"
              : currentSession}

          <FAI icon={currentSession === "pomodoro" ? faHourglass : faMugHot} />
        </span>
```
with:
```jsx
        <span className="timer__currentSession">
          {currentSession === "pomodoro"
            ? "focus"
            : currentSession === "longBreak"
              ? "long break"
              : currentSession}

          {currentSession === "pomodoro" ? <Hourglass /> : <Coffee />}
        </span>
```

- [ ] **Step 8: Verify no leftovers**

Run:
```bash
grep -n "fa[A-Z]\|FAI\|FontAwesomeIcon" pomo-san/src/components/Timer.jsx
```
Expected: no matches.

- [ ] **Step 9: Lint**

Run:
```bash
npx eslint pomo-san/src/components/Timer.jsx
```
Expected: no output, exit code 0.

- [ ] **Step 10: Commit**

```bash
git add pomo-san/src/components/Timer.jsx
git commit -m "refactor(Timer): swap FontAwesome icons for lucide-react"
```

---

### Task 7: Remove FontAwesome packages and verify the whole build

**Files:**
- Modify: `pomo-san/package.json` (dependencies block)

**Interfaces:**
- Consumes: completed migrations from Tasks 2–6 (no source file still imports `@fortawesome/*`).
- Produces: a `package.json` and `package-lock.json` free of `@fortawesome/*`.

- [ ] **Step 1: Confirm no source file still imports FontAwesome**

Run from the `pomo-san/` directory:
```bash
grep -rn "@fortawesome\|FontAwesomeIcon\|fa[A-Z]" src
```
Expected: no matches. (If anything matches, stop — go back and finish migrating that file before removing the packages, otherwise the build will break.)

- [ ] **Step 2: SCSS sanity check (spec requirement)**

Run:
```bash
grep -rn "\.fa-\|font-awesome\|fontawesome" src
```
Expected: no matches. Per spec, if any matches are found, do **not** edit the SCSS silently — flag them to the user before proceeding.

- [ ] **Step 3: Uninstall the three FontAwesome packages**

Run:
```bash
npm uninstall @fortawesome/free-regular-svg-icons @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome
```
Expected: the three entries are removed from `package.json` `dependencies` and `package-lock.json` is updated. No errors.

- [ ] **Step 4: Confirm `package.json` no longer references FontAwesome**

Run:
```bash
grep -n "fortawesome" package.json
```
Expected: no matches.

- [ ] **Step 5: Lint the whole `src/` tree**

Run:
```bash
npm run lint:check
```
Expected: no output, exit code 0. (`lint:check` is `npx eslint ./src` per `package.json`.)

- [ ] **Step 6: Build**

Run:
```bash
npm run build
```
Expected: Vite build completes successfully, writing to `dist/`. No "Module not found" / unresolved-import errors, no orphan references to `@fortawesome/*` or `faX` symbols.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove FontAwesome dependencies"
```

---

## Notes for the implementer

- The app stays buildable between every task: Task 1 only adds a dependency, Tasks 2–6 migrate one file each (FontAwesome stays installed so unmigrated files keep working), Task 7 finally removes FontAwesome once nothing imports it.
- All commands are run from the `pomo-san/` project root directory unless noted.
- Do not modify `docs/plans/2026-06-18-add-time*.md` or any other historical plan file that mentions FontAwesome — they document past decisions and are explicitly out of scope.
- The visual smoke check (`npm run preview`) is left to the user; the agent does not start a long-running server.