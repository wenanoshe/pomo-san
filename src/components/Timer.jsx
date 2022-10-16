// ASSETS
import { FontAwesomeIcon as FAI } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faForward,
  faGear,
  faHourglass,
  faMugHot,
} from "@fortawesome/free-solid-svg-icons";

import switchSoundURL from "../assets/audio/switch.mp3";
import bellRingSoundURL from "../assets/audio/bell-ring.mp3";

import { useEffect, useState } from "react";
import { useCountdown } from "../hooks/useCountdown";
import Button from "./Button";

import "../styles/components/Timer.scss";

const Timer = ({
  secs,
  skipSession,
  currentSession,
  finishedSessions,
  currentProfile,
  openSettingsModal,
  settings,
}) => {
  const [
    count,
    setCount,
    startCountdown,
    stopCountdown,
    resetCountdown,
    isCountdownFinished,
  ] = useCountdown(secs);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  /*
   * EFFECTS
   */

  useEffect(() => {
    setCount(secs);

    // When the timer is removed
    handleRunning("pause");
    return resetCountdown();
  }, [secs]);

  useEffect(() => {
    if (count.count === 0) {
      handleSkip();

      if (settings.notification) {
        const msg = {
          title: `${
            currentSession === "pomodoro" ? "Pomodoro" : "Break"
          } finished`,
          body:
            currentSession === "pomodoro"
              ? "You have been finished your work, take a break!"
              : "Continue focused",
        };

        const notification = new Notification(msg.title, { body: msg.body });

        setTimeout(() => {
          notification.close();
        }, 3000);
      }
    }

    playSound(bellRingSoundURL);
  }, [isCountdownFinished]);

  useEffect(() => {
    // When we change the profile in a running session
    handleRunning("pause");
  }, [currentProfile]);

  /*
   * FUNCTIONS
   */

  const playSound = (url) => {
    if (!settings.sound) return;

    const audio = new Audio(url);
    audio.play();
  };

  const currentFinishedSessions = finishedSessions.find(
    (i) => i.id === currentProfile.id
  ).finishedSessions;

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
      default:
        console.warn("You did not define what action to use");
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
        <Button
          onClick={openSettingsModal}
          className={`btn--md sec btn--${currentSession}`}
        >
          <FAI icon={faGear} className="btn__icon" />
        </Button>

        {isTimerRunning ? (
          <Button
            className={`btn--${currentSession} timer__btn`}
            onClick={() => {
              handleRunning("pause");
              playSound(switchSoundURL);
            }}
          >
            <FAI className="btn__icon" icon={faPause} />
          </Button>
        ) : (
          <Button
            className={`btn--${currentSession} timer__btn`}
            onClick={() => {
              handleRunning("play");
              playSound(switchSoundURL);
            }}
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
