import { useEffect } from "react";
import { useCountdown } from "../hooks/useCountdown";

const Timer = ({ secs, skipSession }) => {
  const [count, setCount, startCountdown, stopCountdown, resetCountdown] =
    useCountdown(secs);

  useEffect(() => {
    setCount(secs);

    // When the timer is removed
    return resetCountdown();
  }, [secs]);

  const handleSkip = () => {
    // Passing a parameter that allow if count the pomodoro sesion as one
    let minimumToCountAsSession = secs * 1;

    if (count.count < minimumToCountAsSession) skipSession(true);
    else skipSession(false);
  };

  return (
    <div>
      <span>
        {count.minutes} : {count.seconds}
      </span>
      <button onClick={startCountdown}>start</button>
      <button onClick={stopCountdown}>pause</button>
      <button onClick={resetCountdown}>restart</button>
      <button onClick={handleSkip}>⏭</button>
    </div>
  );
};

export default Timer;
