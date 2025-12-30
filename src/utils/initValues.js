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
