import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faGear } from "@fortawesome/free-solid-svg-icons";

import Button from "./Button";
import Switch from "./Switch";
import "../styles/components/Settings.scss";

const Settings = ({ closeModal, form, setForm }) => {
  const handleChecked = ({ target }) => {
    if (target.name === "notification") {
      if (!("Notification" in window)) {
        console.log("Your browser don't support Notifications");
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
      console.log("are");
      setForm({ ...form, [target.name]: target.checked });
    }
  };

  return (
    <div className="settings">
      <div className="settings__header">
        <h3 className="settings__title">
          <span>Settings</span> <FontAwesomeIcon icon={faGear} />
        </h3>
        <Button
          onClick={closeModal}
          className="btn--md sec settings__closeModal"
        >
          <FontAwesomeIcon icon={faXmark} />
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
      </form>

      <div className="attribution">
        <span>
          {" "}
          Based on the design of{" "}
          <a
            href="https://www.figma.com/community/file/1112830528857083939"
            target="_blank"
          >
            AlexandrLo
          </a>
        </span>
        <span>
          Developed by <a href="github.com/wenanoshe">Wenanoshe</a>
        </span>
      </div>
    </div>
  );
};

export default Settings;
