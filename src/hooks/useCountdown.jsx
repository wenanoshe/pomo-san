import { useState } from "react";

export function useCountdown(initialCount) {
  if (typeof initialCount !== "number") {
    return console.error("You must set an initial number in seconds");
  }

  const [intervalId, setIntervalId] = useState(null);
  const [count, setCount] = useState(initialCount);

  // handling functions

  const countdown = () => {
    setCount((last) => {
      if (last <= 0) {
        pauseCountDown();

        return 0;
      } else return last - 1;
    });
  };

  const startCountDown = () => {
    intervalId || setIntervalId(setInterval(countdown, 1000));
  };

  const pauseCountDown = () => {
    console.log("are");
    clearInterval(intervalId);
  };

  const resetCountDown = () => {
    pauseCountDown();
    setIntervalId(null);

    setCount(initialCount);
  };

  return [
    { minutes: Math.floor(count / 60), seconds: count % 60 },
    setCount,
    startCountDown,
    pauseCountDown,
    resetCountDown,
  ];
}
