import "../styles/components/Pomodoro.scss";

// COMPONENS
import Timer from "./Timer";
import ProfileSwitcher from "./ProfileSwitcher";

// import { FontAwesomeIcon as FAI } from "@fortawesome/react-fontawesome";
// import { faBrain, faMugHot } from "@fortawesome/free-solid-svg-icons";

// HOOKS
import { useState, useEffect } from "react";
import { faIndianRupeeSign } from "@fortawesome/free-solid-svg-icons";
// import { useModal } from "../hooks/useModal";

const defaultProfiles = [
  {
    name: "Study",
    id: 1,
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
    name: "Study",
    id: 1,
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
  // const [isOpenModal, openModal, closeModal] = useModal();

  // ---- Effects ----
  useEffect(() => {
    document.body.className = currentSession;
  }, [currentSession]);

  useEffect(() => {
    setSessionsBeforeLongBreak(currentProfile.sessionsBeforeLongBreak);
  }, [currentProfile]);

  useEffect(() => {
    localStorage.setItem("profiles", JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    // Use a timestamp to compare the creation of the finished session,
    // and reset it to 0 if it's different

    let currentTimestamp = new Date().getDate();
    let FNCopy = [...finishedSessions];

    FNCopy.map((item) => {
      if (item.timestamp !== currentTimestamp) {
        item.finishedSessions = 0;
        item.timestamp = currentTimestamp;
      }
    });

    setFinishedSessions(FNCopy);
  }, []);

  useEffect(() => {
    localStorage.setItem("finishedSessions", JSON.stringify(finishedSessions));
  }, [finishedSessions]);

  // ---- FUNCTIONS ----

  const handleChangeProfile = (value) => {
    setCurrentProfile(JSON.parse(value.dataset.value));
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
      name: data.name,
      id: data.id,
      finishedSessions: 0,
      timestamp: new Date().getDate(),
    };

    let FSCopy = [...finishedSessions];
    FSCopy.push(newEntry);

    setFinishedSessions(FSCopy);
  };

  const editProfile = (id, newValue) => {
    const copy = [...profiles];

    const itemToEdit = copy.find((i) => i.id === id);
    itemToEdit.name = newValue;

    setProfiles(copy);

    const FSCopy = [...finishedSessions];

    FSCopy.find((i) => i.id === id).name = newValue;

    setFinishedSessions(FSCopy);
  };

  const deleteProfile = (data) => {
    let newProfiles = profiles.filter((i) => i.id !== data.id);
    let newFS = finishedSessions.filter((i) => i.id !== data.id);

    setProfiles(newProfiles);
    setFinishedSessions(newFS);
  };

  return (
    <div className="pomoApp">
      <ProfileSwitcher
        profiles={profiles}
        currentProfile={currentProfile}
        handleChangeProfile={handleChangeProfile}
        addNewProfile={addNewProfile}
        editProfile={editProfile}
        deleteProfile={deleteProfile}
      />
      <Timer
        secs={currentProfile.session[currentSession] * 60}
        skipSession={skipSession}
        currentSession={currentSession}
      />
    </div>
  );
}

/*
      <div className={`chip chip--${currentSession}`}>
        {currentSession === "pomodoro" ? (
          <FAI className="chip__icon" icon={faBrain} />
        ) : (
          <FAI className="chip__icon" icon={faMugHot} />
        )}
        <span className="chip__stm">{currentSession}</span>
      </div>

*/

export default Pomodoro;
