import "../styles/components/Pomodoro.scss";

// COMPONENS
import Timer from "./Timer";
import ProfileSwitcher from "./ProfileSwitcher";
import Settings from "./Settings";
import Modal from "./Modal";

// HOOKS
import { useState, useEffect } from "react";
import { useModal } from "../hooks/useModal";

// UTILS
import {
  defaultProfiles,
  defaultFinishedSessions,
  session,
  defaultSettingsForm,
} from "../utils/defaultValues";

const init = {
  profiles: JSON.parse(localStorage.getItem("profiles")) || defaultProfiles,
  finishedSessions:
    JSON.parse(localStorage.getItem("finishedSessions")) ||
    defaultFinishedSessions,
  form: JSON.parse(localStorage.getItem("settings")) || defaultSettingsForm,
  currentProfile:
    JSON.parse(localStorage.getItem("currentProfile")) || defaultProfiles[0],
};

const Pomodoro = () => {
  // ---- States ----
  const [profiles, setProfiles] = useState(init.profiles);
  const [currentProfile, setCurrentProfile] = useState(init.currentProfile);
  const [currentSession, setCurrentSession] = useState(session.pomodoro);
  const [finishedSessions, setFinishedSessions] = useState(
    init.finishedSessions
  );
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState(
    currentProfile.sessionsBeforeLongBreak
  );

  const [isOpenSettings, openSettingsModal, closeSettingsModal] = useModal();
  const [settings, setSettings] = useState(init.form);
  const [form, setForm] = useState(settings);

  // ---- Effects ----
  useEffect(() => {
    document.body.className = currentSession;
  }, [currentSession]);

  useEffect(() => {
    setSessionsBeforeLongBreak(currentProfile.sessionsBeforeLongBreak);
    localStorage.setItem("currentProfile", JSON.stringify(currentProfile));
  }, [currentProfile]);

  useEffect(() => {
    localStorage.setItem("profiles", JSON.stringify(profiles));

    const newCurrentProfile = profiles.find((i) => i.id === currentProfile.id);

    setCurrentProfile(newCurrentProfile);
  }, [profiles]);

  useEffect(() => {
    // To update settings
    localStorage.setItem("settings", JSON.stringify(form));
    setSettings(JSON.parse(localStorage.getItem("settings")));
  }, [form]);

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

  const countAsFinishedPomo = (countAsSession) => {
    if (countAsSession) {
      let copy = [...finishedSessions];
      let whichProfileIsCounted = copy.find(
        (i) => currentProfile.name === i.name
      );
      // Updating finished sessions
      whichProfileIsCounted.finishedSessions += 1;
      setFinishedSessions(copy);

      // Verify if pass to long or normal break
      if (whichProfileIsCounted.finishedSessions < sessionsBeforeLongBreak)
        setCurrentSession(session.break);
      else {
        setCurrentSession(session.longBreak);

        // This what do is to increment the sessionsBeforeLongBreak
        setSessionsBeforeLongBreak(
          sessionsBeforeLongBreak + currentProfile.sessionsBeforeLongBreak
        );
      }
    } else {
      setCurrentSession(session.break);
    }
  };

  const skipSession = (countAsSession) => {
    if (currentSession === session.pomodoro) {
      countAsFinishedPomo(countAsSession);
    } else {
      setCurrentSession(session.pomodoro);
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

  const editProfile = (newData) => {
    const copy = [...profiles];

    let itemToEdit = copy.find((i) => i.id === newData.id);
    for (const val in itemToEdit) {
      if (itemToEdit[val] !== newData[val]) {
        itemToEdit[val] = newData[val];
      }
    }

    setProfiles(copy);

    const FSCopy = [...finishedSessions];

    FSCopy.find((i) => i.id === newData.id).name = newData.name;

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
        countAsFinishedPomo={countAsFinishedPomo}
        currentSession={currentSession}
        finishedSessions={finishedSessions}
        currentProfile={currentProfile}
        openSettingsModal={openSettingsModal}
        settings={settings}
      />
      <Modal isOpen={isOpenSettings} closeModal={closeSettingsModal}>
        <Settings
          closeModal={closeSettingsModal}
          form={form}
          setForm={setForm}
        />
      </Modal>
    </div>
  );
};

export default Pomodoro;
