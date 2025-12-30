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

import Push from "push.js";

const Timer = ({
  seconds,
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
  ] = useCountdown(seconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  /*
   * EFFECTS
   */
  const sessionText = {
    pomodoro: "Focus",
    break: "Break",
    longBreak: "Long Break",
  }[currentSession];

  // Change the title of the page
  useEffect(() => {
    document.title = `${count.minutes.toString().padStart(2, 0)}:${count.seconds
      .toString()
      .padStart(2, 0)} ${sessionText} | Pomo-san`;
  }, [count.count]);

  useEffect(() => {
    setCount(seconds);

    // When the timer is removed
    handleRunning("pause");
    return resetCountdown();
  }, [seconds]);

  useEffect(() => {
    if (count.count === 0) {
      handleSkip();
      displayNotification();
      playSound(bellRingSoundURL);
    }
  }, [isCountdownFinished]);

  useEffect(() => {
    // When we change the profile in a running session
    handleRunning("pause");
  }, [currentProfile]);

  /*
   * FUNCTIONS
   */

  const displayNotification = () => {
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

      Push.create(msg.title, { body: msg.body });
    }
  };

  const playSound = (url) => {
    if (settings.sound === false) return;

    const audio = new Audio(url);
    audio.play();
  };

  const currentFinishedSessions = finishedSessions.find(
    (i) => i.id === currentProfile.id
  ).finishedSessions;

  const handleSkip = () => {
    setIsTimerRunning(false);
    // Passing a parameter that allow if count the pomodoro sesion as one
    let minimumToCountAsSession = seconds * 0.2;

    if (count.count < minimumToCountAsSession) skipSession(true);
    else skipSession(false);
  };

  const handleRunning = (action) => {
    switch (action) {
      case "play":
        // eslint-disable-next-line no-case-declarations
        const msg = settings.notification
          ? {
              title: `${
                currentSession === "pomodoro" ? "Pomodoro" : "Break"
              } finished`,
              body:
                currentSession === "pomodoro"
                  ? "You have been finished your work, take a break!"
                  : "Continue focused",
            }
          : null;

        startCountdown(msg);
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
