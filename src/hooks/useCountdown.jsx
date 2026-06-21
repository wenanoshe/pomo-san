import { useEffect, useState, useRef, useCallback } from "react";
import TimerWorker from "../workers/timer.worker.js?worker";

export function useCountdown(initialCount) {
  if (typeof initialCount !== "number") {
    return console.error("You must set an initial number in seconds");
  }

  const [count, setCount] = useState(initialCount);
  const [isCountdownFinished, setIsCountdownFinished] = useState(false);
  const workerRef = useRef(null);

  // Initialize Worker
  useEffect(() => {
    workerRef.current = new TimerWorker();

    workerRef.current.onmessage = (e) => {
      const { type, remaining } = e.data;
      if (type === "tick") {
        setCount(remaining);
      } else if (type === "finish") {
        setIsCountdownFinished(true);
        setCount(0);
      }
    };

    return () => {
      workerRef.current.terminate();
    };
  }, []);

  // Sync count with initialCount when it changes
  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ command: "stop" });
    }
    setCount(initialCount);
    setIsCountdownFinished(false);
  }, [initialCount]);

  // Handling functions

  const startCountDown = useCallback(() => {
    if (workerRef.current && count > 0) {
      workerRef.current.postMessage({ command: "start", value: count });
      setIsCountdownFinished(false);
    }
  }, [count]);

  const stopCountdown = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ command: "stop" });
    }
  }, []);

  const resetCountdown = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ command: "stop" });
    }
    setCount(initialCount);
    setIsCountdownFinished(false);
  }, [initialCount]);

  const extendCountdown = useCallback((seconds) => {
    if (workerRef.current && typeof seconds === "number" && seconds > 0) {
      workerRef.current.postMessage({ command: "extend", value: seconds });
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
