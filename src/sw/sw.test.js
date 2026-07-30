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
    installSelf();
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
    installSelf();
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
    installSelf({ permission: "granted" });
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
