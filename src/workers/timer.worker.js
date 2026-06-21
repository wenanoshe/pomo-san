let intervalId = null;
let endTime = null;
let notificationData = null;

self.onmessage = (e) => {
  const { command, value, notification } = e.data;

  switch (command) {
    case "start":
      // value is duration in seconds
      if (intervalId) clearInterval(intervalId);
      if (notification) notificationData = notification;

      // Calculate target end time
      endTime = Date.now() + value * 1000;

      // Immediate check
      // eslint-disable-next-line no-case-declarations
      const now = Date.now();
      // eslint-disable-next-line no-case-declarations
      const left = Math.ceil((endTime - now) / 1000);
      self.postMessage({ type: "tick", remaining: left });

      intervalId = setInterval(() => {
        const now = Date.now();
        const left = Math.ceil((endTime - now) / 1000);

        if (left <= 0) {
          self.postMessage({ type: "tick", remaining: 0 });
          self.postMessage({ type: "finish" });

          // Try to show notification from worker
          if (
            notificationData &&
            self.Notification &&
            self.Notification.permission === "granted"
          ) {
            try {
              new self.Notification(notificationData.title, {
                body: notificationData.body,
                icon: "/pomo-san-logo.svg", // absolute path from public
              });
            } catch (err) {
              console.error("Worker notification failed", err);
            }
          }

          clearInterval(intervalId);
          intervalId = null;
          endTime = null;
        } else {
          self.postMessage({ type: "tick", remaining: left });
        }
      }, 1000);
      break;

    case "stop":
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      endTime = null;
      break;

    case "extend":
      if (endTime && value > 0) {
        endTime += value * 1000;
        // Emit an immediate tick so the UI reflects the new remaining time
        const now = Date.now();
        const left = Math.ceil((endTime - now) / 1000);
        self.postMessage({ type: "tick", remaining: left });
      }
      break;

    default:
      break;
  }
};
