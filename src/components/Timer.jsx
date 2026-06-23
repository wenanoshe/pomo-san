// ASSETS
import {
  Play,
  Pause,
  FastForward,
  Cog,
  Hourglass,
  Coffee,
  SquarePlus,
} from "lucide-react";

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
    extendCountdown,
  ] = useCountdown(seconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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
    setIsPaused(false); // session changed → fully stopped
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
    setIsPaused(false);
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
    setIsPaused(false);
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
        setIsPaused(false);
        break;
      case "pause":
        stopCountdown();
        setIsTimerRunning(false);
        setIsPaused(true);
        break;
      default:
        console.warn("You did not define what action to use");
        stopCountdown();
        setIsTimerRunning(false);
        setIsPaused(true);
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

        {(isTimerRunning || isPaused) && (
          <Button
            onClick={() => extendCountdown(settings.addTimeAmount * 60)}
            className={`btn--${currentSession} timer__addTime`}
            outline
            aria-label="Add time to countdown"
          >
            <SquarePlus className="btn__icon" />
            {settings.showAddTimeAmount && (
              <span className="timer__addTimeLabel">
                {settings.addTimeAmount}
              </span>
            )}
          </Button>
        )}
      </div>

      <div className="timer__actions">
        <Button
          onClick={openSettingsModal}
          className={`btn--md sec btn--${currentSession}`}
        >
          <Cog className="btn__icon" />
        </Button>

        {isTimerRunning ? (
          <Button
            className={`btn--${currentSession} timer__btn`}
            onClick={() => {
              handleRunning("pause");
              playSound(switchSoundURL);
            }}
          >
            <Pause className="btn__icon" />
          </Button>
        ) : (
          <Button
            className={`btn--${currentSession} timer__btn`}
            onClick={() => {
              handleRunning("play");
              playSound(switchSoundURL);
            }}
          >
            <Play className="btn__icon" />
          </Button>
        )}

        <Button
          onClick={handleSkip}
          className={`btn--md sec btn--${currentSession}`}
        >
          <FastForward className="btn__icon" />
        </Button>

        <span className="timer__currentSession">
          {currentSession === "pomodoro"
            ? "focus"
            : currentSession === "longBreak"
              ? "long break"
              : currentSession}

          {currentSession === "pomodoro" ? <Hourglass /> : <Coffee />}
        </span>
      </div>
    </div>
  );
};

export default Timer;
