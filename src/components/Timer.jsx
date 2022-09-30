import { FontAwesomeIcon as FAI } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faForward,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
import Button from "./Button";

import { useEffect, useState } from "react";
import { useCountdown } from "../hooks/useCountdown";

import "../styles/components/Timer.scss";

const Timer = ({ secs, skipSession, currentSession }) => {
  const [count, setCount, startCountdown, stopCountdown, resetCountdown] =
    useCountdown(secs);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    setCount(secs);

    // When the timer is removed
    return resetCountdown();
  }, [secs]);

  const handleSkip = () => {
    setIsTimerRunning(false);
    // Passing a parameter that allow if count the pomodoro sesion as one
    let minimumToCountAsSession = secs * 1;

    if (count.count < minimumToCountAsSession) skipSession(true);
    else skipSession(false);
  };

  const handleRunning = (action) => {
    switch (action) {
      case "play":
        startCountdown();
        setIsTimerRunning(true);
        break;
      case "pause":
        stopCountdown();
        setIsTimerRunning(false);
        break;
    }
  };

  return (
    <div className="timer">
      <div className="timer__clock">
        <span className="timer__mins">
          {count.minutes.toString().padStart(2, 0)}
        </span>
        <span className="tiemr__secs">
          {count.seconds.toString().padStart(2, 0)}
        </span>
      </div>

      <div className="timer__actions">
        <Button className={`btn--md sec btn--${currentSession}`}>
          <FAI icon={faGear} className="btn__icon" />
        </Button>

        {isTimerRunning ? (
          <Button
            className={`btn--${currentSession}`}
            onClick={() => handleRunning("pause")}
          >
            <FAI className="btn__icon" icon={faPause} />
          </Button>
        ) : (
          <Button
            className={`btn--${currentSession}`}
            onClick={() => handleRunning("play")}
          >
            <FAI className="btn__icon" icon={faPlay} />
          </Button>
        )}

        <Button
          onClick={handleSkip}
          className={`btn--md sec btn--${currentSession}`}
        >
          <FAI icon={faForward} className="btn__icon" />{" "}
        </Button>
      </div>
    </div>
  );
};

export default Timer;
