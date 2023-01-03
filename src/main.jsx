import React from "react";
import ReactDOM from "react-dom/client";
import Pomodoro from "./components/Pomodoro";
import "./styles/global.scss";
import "normalize.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Pomodoro />
  </React.StrictMode>
);
