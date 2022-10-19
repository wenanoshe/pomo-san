import { useEffect, useState } from "react";

export function useCountdown(initialCount) {
  if (typeof initialCount !== "number") {
    return console.error("You must set an initial number in seconds");
  }

  const [intervalId, setIntervalId] = useState(null);
  const [count, setCount] = useState(initialCount);
  const [isCountdownFinished, setIsCountdownFinished] = useState(false);

  // handling functions

  useEffect(() => {
    if (count === 0) {
      setIsCountdownFinished(true);
    } else {
      setIsCountdownFinished(false);
    }
  }, [count]);

  const countdown = () => {
    // Stop countdown when reaches 0
    setCount((last) => {
      if (last <= 0) {
        clearInterval(intervalId);

        return last;
      } else return last - 1;
    });
  };

  const startCountDown = () => {
    intervalId || setIntervalId(setInterval(countdown, 1000));
  };

  const stopCountdown = () => {
    clearInterval(intervalId);
    setIntervalId(null);
  };

  const resetCountdown = () => {
    stopCountdown();
    setCount(initialCount);
  };

  return [
    { minutes: Math.floor(count / 60), seconds: count % 60, count },
    setCount,
    startCountDown,
    stopCountdown,
    resetCountdown,
    isCountdownFinished,
  ];
}
