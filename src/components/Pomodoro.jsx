// COMPONENS
import Timer from "./Timer";
import Modal from "./Modal";
import AddProfile from "./AddProfile";

// HOOKS
import { useState, useEffect } from "react";
import { useModal } from "../hooks/useModal";

const defaultProfiles = [
  {
    name: "Study",
    id: crypto.randomUUID(),
    session: {
      pomodoro: 25,
      break: 5,
      longBreak: 15,
    },
    sessionsBeforeLongBreak: 4,
  },
];

let initProfiles =
  JSON.parse(localStorage.getItem("profiles")) || defaultProfiles;

const session = {
  pomodoro: "pomodoro",
  break: "break",
  longBreak: "longBreak",
};

const defaultFinishedSessions = [
  {
    sessionName: "Study",
    finishedSessions: 0,
    timestamp: new Date().getDate(),
  },
];

let initFinishedSessions =
  JSON.parse(localStorage.getItem("finishedSessions")) ||
  defaultFinishedSessions;

function Pomodoro() {
  // ---- States ----
  const [profiles, setProfiles] = useState(initProfiles);
  const [currentProfile, setCurrentProfile] = useState(profiles[0]);
  const [currentSession, setCurrentSession] = useState(session.pomodoro);
  const [finishedSessions, setFinishedSessions] =
    useState(initFinishedSessions);
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState(
    currentProfile.sessionsBeforeLongBreak
  );

  // Add profile modal hook
  const [isOpenModal, openModal, closeModal] = useModal();

  // ---- Effects ----
  useEffect(() => {
    setSessionsBeforeLongBreak(currentProfile.sessionsBeforeLongBreak);
  }, [currentProfile]);

  useEffect(() => {
    localStorage.setItem("profiles", JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem("finishedSessions", JSON.stringify(finishedSessions));
  }, [finishedSessions]);

  // ---- Functions ----

  const handleChangeProfile = (e) => {
    setCurrentProfile(JSON.parse(e.target.value));
  };

  const skipSession = (countAsSession) => {
    switch (currentSession) {
      case session.pomodoro:
        if (countAsSession) {
          // Updating finished sessions
          let copy = [...finishedSessions];
          let match = copy.find((i) => {
            return currentProfile.name === i.sessionName;
          });
          match.finishedSessions += 1;
          setFinishedSessions(copy);

          // Verify if pass to long or normal break
          if (match.finishedSessions < sessionsBeforeLongBreak)
            setCurrentSession(session.break);
          else {
            setCurrentSession(session.longBreak);

            // This what do is to increment the sessionsBeforeLongBreak
            setSessionsBeforeLongBreak(
              (last) => last + currentProfile.sessionsBeforeLongBreak
            );
          }
        } else {
          setCurrentSession(session.break);
        }

        break;

      case session.break:
        setCurrentSession(session.pomodoro);
        break;

      case session.longBreak:
        setCurrentSession(session.pomodoro);
        break;
    }
  };

  const addNewProfile = (data) => {
    let copy = [...profiles];
    copy.push(data);

    setProfiles(copy);

    // Updating finishedSessions
    let newEntry = {
      sessionName: data.name,
      finishedSessions: 0,
      timestamp: new Date().getDate(),
    };

    let FSCopy = [...finishedSessions];
    FSCopy.push(newEntry);

    setFinishedSessions(FSCopy);

    closeModal();
  };

  return (
    <div className="pomodoro">
      <select onChange={handleChangeProfile}>
        {profiles.map((el) => (
          <option key={el.id} value={JSON.stringify(el)}>
            {el.name}
          </option>
        ))}
      </select>
      <button onClick={openModal}>Add new profile ➕</button>
      <Modal isOpen={isOpenModal} closeModal={closeModal}>
        <AddProfile addNewProfile={addNewProfile} />
      </Modal>
      <hr />
      <h3>Current Session: {currentSession}</h3>
      {
        <Timer
          secs={currentProfile.session[currentSession] * 60}
          skipSession={skipSession}
        />
      }
    </div>
  );
}

export default Pomodoro;
