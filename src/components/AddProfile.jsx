import { useState } from "react";

const initForm = {
  name: "Another Profile",
  id: crypto.randomUUID(),
  session: {
    pomodoro: 25,
    break: 5,
    longBreak: 15,
  },
  sessionsBeforeLongBreak: 4,
};

const regex = {
  onlyChars: new RegExp(/[a-zA-Z]{2,30}\w/),
  onlyNumbers: new RegExp(/^\d{1,2}$/),
};

const AddProfile = ({ addNewProfile }) => {
  const [form, setForm] = useState(initForm);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: parseInt(e.target.value) || e.target.value,
    });
  };

  const handleChangeSession = (e) => {
    setForm({
      ...form,
      session: { ...form.session, [e.target.name]: parseInt(e.target.value) },
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

    addNewProfile(form);
    setForm(initForm);
  };

  return (
    <form>
      <div>
        <label>Name your new profile</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Pomodoro duration (minutes)</label>
        <input
          type="number"
          name="pomodoro"
          value={form.session.pomodoro}
          onChange={handleChangeSession}
        />
      </div>

      <div>
        <label>Break duration</label>
        <input
          type="number"
          name="break"
          value={form.session.break}
          onChange={handleChangeSession}
        />
      </div>

      <div>
        <label> Long Break duration</label>
        <input
          type="number"
          name="longBreak"
          value={form.session.longBreak}
          onChange={handleChangeSession}
        />
      </div>

      <div>
        <label>Sesions before long break</label>
        <input
          type="number"
          name="sessionsBeforeLongBreak"
          value={form.sessionsBeforeLongBreak}
          onChange={handleChange}
        />
      </div>

      <button type="submit" onClick={handleSubmit}>
        Add
      </button>
    </form>
  );
};

export default AddProfile;
