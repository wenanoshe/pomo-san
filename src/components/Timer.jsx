// ASSETS
import {
  Play,
  Pause,
  FastForward,
  Settings,
  Hourglass,
  Coffee,
  Plus,
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
  const [isIdle, setIsIdle] = useState(false);
  const [idleSeconds, setIdleSeconds] = useState(0);

  /*
   * EFFECTS
   */

  const formatIdle = (s) => {
    if (s < 3600) {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${String(sec).padStart(2, "0")}`;
    }
    return `${Math.floor(s / 60)}m`;
  };

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
      if (settings.showIdleTimer) setIsIdle(true);
    }
  }, [isCountdownFinished]);

  useEffect(() => {
    if (!isIdle) return;
    const id = setInterval(() => setIdleSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isIdle]);

  useEffect(() => {
    // When we change the profile in a running session
    handleRunning("pause");
    setIsPaused(false);
    setIsIdle(false);
    setIdleSeconds(0);
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
    setIsIdle(false);
    setIdleSeconds(0);
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
        setIsIdle(false);
        setIdleSeconds(0);
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
            <Plus className="btn__icon" />
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
          <Settings className="btn__icon" />
        </Button>

        {isTimerRunning ? (
          <Button
            className={`btn--${currentSession} timer__btn`}
            onClick={() => {
              handleRunning("pause");
              playSound(switchSoundURL);
            }}
          >
            <Pause className="btn__icon" size={32} />
          </Button>
        ) : (
          <Button
            className={`btn--${currentSession} timer__btn`}
            onClick={() => {
              handleRunning("play");
              playSound(switchSoundURL);
            }}
          >
            <Play className="btn__icon" size={32} />
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

          {currentSession === "pomodoro" ? (
            <Hourglass size={18} />
          ) : (
            <Coffee size={18} />
          )}

          {isIdle && settings.showIdleTimer && (
            <span className="timer__idleBadge" aria-live="polite">
              <Hourglass size={14} />
              Idle {formatIdle(idleSeconds)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default Timer;
