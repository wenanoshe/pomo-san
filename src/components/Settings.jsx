import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faGear } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

import Button from "./Button";
import "../styles/components/Settings.scss";

const initForm = {
  notification: false,
  sound: false,
};

const Settings = ({ closeModal }) => {
  const [form, setForm] = useState(initForm);

  const handleChecked = ({ target }) => {
    setForm({ ...form, [target.name]: target.checked });
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
          <label htmlFor="notification">Notification</label>
          <input
            type="checkbox"
            id="notification"
            name="notification"
            checked={form.notification}
            onChange={handleChecked}
          />
        </div>
        <div className="settings__field">
          <label htmlFor="sound">Sound</label>
          <input
            type="checkbox"
            id="sound"
            name="sound"
            checked={form.sound}
            onChange={handleChecked}
          />
        </div>
      </form>
    </div>
  );
};

export default Settings;
