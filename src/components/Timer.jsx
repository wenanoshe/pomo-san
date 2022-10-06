import { FontAwesomeIcon as FAI } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faForward,
  faGear,
  faBrain,
  faHourglass,
  faMugHot,
} from "@fortawesome/free-solid-svg-icons";
import Button from "./Button";

import { useEffect, useState } from "react";
import { useCountdown } from "../hooks/useCountdown";

import "../styles/components/Timer.scss";

const Timer = ({
  secs,
  skipSession,
  currentSession,
  finishedSessions,
  currentProfile,
}) => {
  const [count, setCount, startCountdown, stopCountdown, resetCountdown] =
    useCountdown(secs);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const currentFinishedSessions = finishedSessions.find(
    (i) => i.id === currentProfile.id
  ).finishedSessions;

  useEffect(() => {
    setCount(secs);

    // When the timer is removed
    return resetCountdown();
  }, [secs]);

  const handleSkip = () => {
    setIsTimerRunning(false);
    // Passing a parameter that allow if count the pomodoro sesion as one
    let minimumToCountAsSession = secs * 0.2;

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
        <span>{count.minutes.toString().padStart(2, 0)}</span>
        <span>{count.seconds.toString().padStart(2, 0)}</span>

        {currentFinishedSessions > 0 && (
          <span className="timer__finishedSessions">
            {currentFinishedSessions}
          </span>
        )}
      </div>

      <div className="timer__actions">
        <Button className={`btn--md sec btn--${currentSession}`}>
          <FAI icon={faGear} className="btn__icon" />
        </Button>

        {isTimerRunning ? (
          <Button
            className={`btn--${currentSession} timer__btn`}
            onClick={() => handleRunning("pause")}
          >
            <FAI className="btn__icon" icon={faPause} />
          </Button>
        ) : (
          <Button
            className={`btn--${currentSession} timer__btn`}
            onClick={() => handleRunning("play")}
          >
            <FAI className="btn__icon" icon={faPlay} />
          </Button>
        )}

        <Button
          onClick={handleSkip}
          className={`btn--md sec btn--${currentSession}`}
        >
          <FAI icon={faForward} className="btn__icon" />
        </Button>

        <span className="timer__currentSession">
          {currentSession === "pomodoro"
            ? "focus"
            : currentSession === "longBreak"
            ? "long break"
            : currentSession}

          <FAI icon={currentSession === "pomodoro" ? faHourglass : faMugHot} />
        </span>
      </div>
    </div>
  );
};

export default Timer;
