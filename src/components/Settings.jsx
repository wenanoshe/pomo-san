import { Settings as SettingsIcon, X } from "lucide-react";

import Button from "./Button";
import Switch from "./Switch";
import "../styles/components/Settings.scss";

const Settings = ({ closeModal, form, setForm }) => {
  const handleAddTimeChange = ({ target }) => {
    const value = parseInt(target.value, 10);
    if (Number.isNaN(value) || value < 1) {
      setForm({ ...form, addTimeAmount: 1 });
    } else {
      setForm({ ...form, addTimeAmount: value });
    }
  };

  const handleChecked = ({ target }) => {
    if (target.name === "notification") {
      if (!("Notification" in window)) {
        console.warn("Your browser don't support Notifications");
        return;
      }

      if (Notification.permission === "denied") {
        alert(
          'Change your notification permission to "granted" in the notification icon in your address bar'
        );
        setForm({ ...form, notification: false });
        return;
      }

      if (Notification.permission === "default") {
        setForm({ ...form, notification: false });
      }

      if (Notification.permission === "granted") {
        setForm({ ...form, notification: !form.notification });
        return;
      }

      Notification.requestPermission().then((res) => {
        if (res === "granted") setForm({ ...form, notification: true });
        else {
          alert("You'll not recive notifications");
          setForm({ ...form, notification: false });
        }
      });
    } else {
      setForm({ ...form, [target.name]: target.checked });
    }
  };

  return (
    <div className="settings">
      <div className="settings__header">
        <h3 className="settings__title">
          <span>Settings</span> <SettingsIcon />
        </h3>
        <Button
          onClick={closeModal}
          className="btn--md sec settings__closeModal"
        >
          <X />
        </Button>
      </div>

      <form className="settings__form">
        <div className="settings__field">
          <span>Notification</span>
          <Switch
            name="notification"
            checked={form.notification}
            onChange={handleChecked}
          />
        </div>
        <div className="settings__field">
          <span>Sound</span>
          <Switch name="sound" checked={form.sound} onChange={handleChecked} />
        </div>
        <div className="settings__field">
          <span>Add time (minutes)</span>
          <input
            type="number"
            name="addTimeAmount"
            min="1"
            step="1"
            value={form.addTimeAmount}
            onChange={handleAddTimeChange}
            className="settings__numberInput"
          />
        </div>
        <div className="settings__field">
          <span>Show time on button</span>
          <Switch
            name="showAddTimeAmount"
            checked={form.showAddTimeAmount}
            onChange={handleChecked}
          />
        </div>
        <div className="settings__field">
          <span>Show idle timer</span>
          <Switch
            name="showIdleTimer"
            checked={form.showIdleTimer}
            onChange={handleChecked}
          />
        </div>
      </form>

      <div className="attribution">
        <span>
          {" "}
          Based on the design of{" "}
          <a
            href="https://www.figma.com/community/file/1112830528857083939"
            target="_blank"
            rel="noopener noreferrer"
          >
            AlexandrLo
          </a>
        </span>
        <span>
          Developed by{" "}
          <a
            href="https://github.com/wenanoshe"
            target="_blank"
            rel="noopener noreferrer"
          >
            Wenanoshe
          </a>
        </span>
      </div>
    </div>
  );
};

export default Settings;
