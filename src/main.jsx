import React from "react";
import ReactDOM from "react-dom/client";
import { LucideProvider } from "lucide-react";
import Pomodoro from "./components/Pomodoro";
import "./styles/global.scss";
import "normalize.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LucideProvider strokeWidth={2.3}>
      <Pomodoro />
    </LucideProvider>
  </React.StrictMode>
);
