import { useState } from "react";

import "../styles/components/AddProfile.scss";
import Button from "./Button";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faEdit } from "@fortawesome/free-solid-svg-icons";

import { initAddProfileForm as initForm } from "../utils/initValues";

const regex = {
  onlyChars: new RegExp(/[a-zA-Z]{2,30}\w/),
  onlyNumbers: new RegExp(/^\d{1,2}$/),
};

const AddProfile = ({ addNewProfile, closeModal, el, btnName }) => {
  const [form, setForm] = useState(el || initForm);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: parseInt(e.target.value) || e.target.value,
    });
  };

  const handleChangeSession = (e) => {
    setForm({
      ...form,
      session: {
        ...form.session,
        [e.target.name]: parseInt(e.target.value) || "",
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Verification
    if (!regex.onlyChars.test(form.name)) {
      alert(
        "!! Invalid Profile Name \n Only letters are allowed with a maximum of 30 chars"
      );
      return;
    }

    for (const key in form.session) {
      if (!regex.onlyNumbers.test(form.session[key])) {
        alert("Only numbers are allowed min 1, max 2 chars");
        return;
      }
    }

    if (!regex.onlyNumbers.test(form.sessionsBeforeLongBreak)) {
      alert("Only numbers are allowed min 1, max 2 chars");
      return;
    }

    el
      ? addNewProfile({ ...form })
      : addNewProfile({ ...form, id: crypto.randomUUID() });

    closeModal();
    setForm(el || initForm);
  };

  return (
    <form className="profileForm">
      <div className="profileForm__place">
        <label htmlFor="name">Profile name</label>
        <input
          id="name"
          className="profileForm__input"
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
        />
      </div>

      <div className="profileForm__place">
        <label htmlFor="focus">Focus duration</label>
        <input
          id="focus"
          className="profileForm__input"
          type="number"
          name="pomodoro"
          min="1"
          max="99"
          value={form.session.pomodoro}
          onChange={handleChangeSession}
          required
        />
      </div>

      <div className="profileForm__place">
        <label htmlFor="break">Break duration</label>
        <input
          id="break"
          type="number"
          className="profileForm__input"
          name="break"
          min="1"
          max="99"
          value={form.session.break}
          onChange={handleChangeSession}
          required
        />
      </div>

      <div className="profileForm__place">
        <label htmlFor="longBreak">Long Break duration</label>
        <input
          id="longBreak"
          type="number"
          className="profileForm__input"
          name="longBreak"
          min="1"
          max="99"
          value={form.session.longBreak}
          onChange={handleChangeSession}
          required
        />
      </div>

      <div className="profileForm__place">
        <label htmlFor="beforeLongBreak">Sesions before long break</label>
        <input
          id="beforeLongBreak"
          type="number"
          className="profileForm__input"
          name="sessionsBeforeLongBreak"
          value={form.sessionsBeforeLongBreak}
          onChange={handleChange}
          required
        />
      </div>

      <Button
        type="submit"
        onClick={handleSubmit}
        className="profileForm__submit"
      >
        <span>{btnName || "Add"}</span>
        <FontAwesomeIcon icon={btnName ? faEdit : faCirclePlus} />
      </Button>
    </form>
  );
};

export default AddProfile;
