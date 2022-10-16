export const defaultProfiles = [
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

export const defaultFinishedSessions = [
  {
    name: "Study",
    id: 1,
    finishedSessions: 0,
    timestamp: new Date().getDate(),
  },
];

export const session = {
  pomodoro: "pomodoro",
  break: "break",
  longBreak: "longBreak",
};

export const initAddProfileForm = {
  name: "Profile",
  session: {
    pomodoro: 25,
    break: 5,
    longBreak: 15,
  },
  sessionsBeforeLongBreak: 4,
};

export const initSettingsForm = {
  notification: false,
  sound: false,
};
