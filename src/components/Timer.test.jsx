import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";

const { finishFnRef, wakeLockMock, pushCreateMock } = vi.hoisted(() => ({
  finishFnRef: { current: null },
  wakeLockMock: vi.fn(),
  pushCreateMock: vi.fn(() => ({})),
}));

vi.mock("../hooks/useCountdown", () => ({
  // Mirror the real hook's contract: `count` is a NUMBER in state and gets
  // wrapped into { minutes, seconds, count } at return. Otherwise Timer's
  // `setCount(seconds)` effect replaces the object with a bare number.
  useCountdown: (seconds) => {
    const [count, setCount] = React.useState(seconds);
    const [finished, setFinished] = React.useState(false);
    finishFnRef.current = () => {
      setFinished(true);
      setCount(0);
    };
    return [
      {
        minutes: Math.floor(count / 60),
        seconds: count % 60,
        count,
      },
      setCount,
      vi.fn(),
      vi.fn(),
      vi.fn(),
      finished,
      vi.fn(),
    ];
  },
}));

vi.mock("../hooks/useWakeLock", () => ({ useWakeLock: wakeLockMock }));

vi.mock("push.js", () => ({
  default: { create: pushCreateMock },
}));

// `push.js` is mocked so that if a regression reintroduces `import Push from
// "push.js"`, the test still isolates behavior and we can assert `Push.create`
// is never called from the page.

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
  pushCreateMock.mockClear();
  finishFnRef.current = null;
});

afterEach(() => {
  finishFnRef.current = null;
});

describe("Timer", () => {
  it("calls skipSession on finish", () => {
    const skip = vi.fn();
    render(<Timer {...baseProps} seconds={300} skipSession={skip} />);
    act(() => finishFnRef.current?.());
    expect(skip).toHaveBeenCalled();
  });

  it("does NOT construct any Audio across interactions", () => {
    const audioCtor = vi.fn();
    window.Audio = audioCtor;
    render(<Timer {...baseProps} />);
    // Start the timer so the Add-time control becomes available, then drive
    // every interaction that used to call `playSound`.
    const playBtn = screen
      .getAllByRole("button")
      .find((b) => b.querySelector("svg.lucide-play, svg.lucide-pause"));
    fireEvent.click(playBtn);
    // The Add-time button is identified by its Plus icon (Button.jsx doesn't
    // currently forward `aria-label`, so `getByLabelText` can't find it —
    // a separate accessibility gap, not what this regression asserts).
    const addTimeBtn = screen
      .getAllByRole("button")
      .find((b) => b.querySelector("svg.lucide-plus"));
    fireEvent.click(addTimeBtn);
    const pauseBtn = screen
      .getAllByRole("button")
      .find((b) => b.querySelector("svg.lucide-pause"));
    fireEvent.click(pauseBtn);
    act(() => finishFnRef.current?.());
    expect(audioCtor).not.toHaveBeenCalled();
    // Regression: no push.js notifications fired from the page either.
    expect(pushCreateMock).not.toHaveBeenCalled();
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
    // Click the Play/Pause toggle to set isTimerRunning true. lucide-react v1
    // renders class `lucide lucide-play lucide-play`; query by either icon.
    const playBtn = screen
      .getAllByRole("button")
      .find((b) => b.querySelector("svg.lucide-play, svg.lucide-pause"));
    fireEvent.click(playBtn);
    const lastCall = wakeLockMock.mock.calls.at(-1)?.[0];
    expect(lastCall).toBe(true);
  });
});
