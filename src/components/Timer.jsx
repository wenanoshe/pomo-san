import { useEffect } from "react";
import { useCountdown } from "../hooks/useCountdown";

const Timer = ({ secs }) => {
  const [count, setCount, startCountdown, pauseCountDown, resetCountDown] =
    useCountdown(secs);

  const { minutes, seconds } = count;

  useEffect(() => {
    setCount(secs);
  }, [secs]);

  // useEffect(() => {
  //   console.log("this is mounted");
  //   // When the timer is removed
  //   return () => {
  //     console.log("Is this unmounted");
  //   };
  // }, []);

  return (
    <div>
      <span>
        {minutes} : {seconds}
      </span>
      <button onClick={startCountdown}>start</button>
      <button onClick={pauseCountDown}>pause</button>
      <button onClick={resetCountDown}>restart</button>
    </div>
  );
};

export default Timer;
