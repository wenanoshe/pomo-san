import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faXmark } from "@fortawesome/free-solid-svg-icons";

import { useState } from "react";
import Button from "./Button";

import "../styles/components/EditProfileForm.scss";

const EditProfileForm = ({ el, onCancel, onUpdate }) => {
  const [value, setValue] = useState(el.name ?? "");

  const regex = new RegExp(/[a-zA-Z]{0,30}\w/);

  const handleClick = (e) => {
    e.preventDefault();
    if (regex.test(value)) {
      onUpdate(el.id, value);
    } else alert("Why you need an empty value?");
  };

  return (
    <form className="epf">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="epf__input"
      />
      <div className="epf__actions">
        <Button onClick={handleClick} className="btn--sm sec-2" type="submit">
          <FontAwesomeIcon icon={faUpload} />
        </Button>
        <Button onClick={onCancel} className="btn--sm sec-2">
          <FontAwesomeIcon icon={faXmark} />
        </Button>
      </div>
    </form>
  );
};

export default EditProfileForm;
