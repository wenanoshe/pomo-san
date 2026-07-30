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
  const clients = await self.clients.matchAll({ type: "window" });
  for (const c of clients) {
    c.postMessage({ type: "tick", remaining: 0 });
    c.postMessage({ type: "finish" });
  }
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

const onMessage = (e) => {
  const { command, value, notification } = e.data ?? {};
  const source = e.source;
  switch (command) {
    case "start":
      if (intervalId) clearInterval(intervalId);
      notificationPayload = notification ?? null;
      endTime = Date.now() + (value ?? 0) * 1000;
      tick();
      intervalId = self.setInterval(tick, 1000);
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
      if (endTime == null) {
        source?.postMessage({ type: "remaining", remaining: null });
      } else {
        const remaining = Math.ceil((endTime - Date.now()) / 1000);
        if (remaining <= 0) {
          // Missed finish while SW was suspended — fire it now directly to the
          // requesting client (and to all clients), then clear state.
          source?.postMessage({ type: "tick", remaining: 0 });
          source?.postMessage({ type: "finish" });
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

// Register the handler both ways so the test harness (which reads
// self._listeners["message"] populated by addEventListener) and a real
// service worker (which dispatches to self.onmessage) both receive it.
self.onmessage = onMessage;
self.addEventListener("message", onMessage);
