import { useEffect, useState, useRef, useCallback } from "react";

export function useCountdown(initialCount) {
  if (typeof initialCount !== "number") {
    return console.error("You must set an initial number in seconds");
  }

  const [count, setCount] = useState(initialCount);
  const [isCountdownFinished, setIsCountdownFinished] = useState(false);
  const resyncedRef = useRef(false);

  const getController = () => navigator.serviceWorker?.controller ?? null;
  const post = (msg) => {
    const c = getController();
    if (c) c.postMessage(msg);
  };

  useEffect(() => {
    const sw = navigator.serviceWorker;
    if (!("serviceWorker" in navigator) || !sw) {
      console.warn("Service Worker unavailable; countdown disabled.");
      return;
    }

    const onMessage = (e) => {
      const { type, remaining } = e.data ?? {};
      if (type === "tick") {
        setCount(remaining);
      } else if (type === "finish") {
        setIsCountdownFinished(true);
        setCount(0);
      } else if (type === "remaining") {
        if (typeof remaining === "number" && remaining > 0) {
          setCount(remaining);
        }
      }
    };
    sw.addEventListener("message", onMessage);

    const sendQuery = () => {
      if (resyncedRef.current) return;
      resyncedRef.current = true;
      post({ command: "query" });
    };

    if (getController()) {
      sendQuery();
    } else {
      sw.addEventListener("controllerchange", sendQuery);
    }

    return () => {
      sw.removeEventListener("message", onMessage);
      sw.removeEventListener("controllerchange", sendQuery);
    };
  }, []);

  useEffect(() => {
    setCount(initialCount);
    setIsCountdownFinished(false);
  }, [initialCount]);

  const startCountDown = useCallback((value, notification) => {
    if (value > 0) {
      post({ command: "start", value, notification });
      setIsCountdownFinished(false);
    }
  }, []);

  const stopCountdown = useCallback(() => {
    post({ command: "stop" });
  }, []);

  const resetCountdown = useCallback(() => {
    post({ command: "stop" });
    setCount(initialCount);
    setIsCountdownFinished(false);
  }, [initialCount]);

  const extendCountdown = useCallback((seconds) => {
    if (typeof seconds === "number" && seconds > 0) {
      post({ command: "extend", value: seconds });
    }
  }, []);

  const SECS_PER_MINUTE = 60;

  return [
    {
      minutes: Math.floor(count / SECS_PER_MINUTE),
      seconds: count % SECS_PER_MINUTE,
      count,
    },
    setCount,
    startCountDown,
    stopCountdown,
    resetCountdown,
    isCountdownFinished,
    extendCountdown,
  ];
}
