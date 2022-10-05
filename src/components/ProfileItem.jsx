import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFeather, faTrash } from "@fortawesome/free-solid-svg-icons";

import Button from "./Button";

import { useState } from "react";
import EditProfileForm from "./EditProfileForm";

const ProfileItem = ({
  el,
  handleDelProfile,
  editProfile,
  currentProfile,
  handleClick,
}) => {
  const [isEdit, setIsEdit] = useState(false);

  const handleEditProfile = (e) => {
    e.stopPropagation();
    setIsEdit(true);
  };

  const onUpdate = (id, newValue) => {
    editProfile(id, newValue);
    setIsEdit(false);
  };

  const onCancel = () => {
    setIsEdit(false);
  };

  return isEdit ? (
    <EditProfileForm el={el} onUpdate={onUpdate} onCancel={onCancel} />
  ) : (
    <li
      data-value={JSON.stringify(el)}
      onClick={handleClick}
      className={`ps__li ${
        currentProfile.id === el.id ? "ps__li--active" : ""
      }`}
    >
      <span className="ps__profile-name">{el.name}</span>

      <div className="ps__actions">
        <Button onClick={handleEditProfile} className="btn--sm sec-2 ">
          <FontAwesomeIcon icon={faFeather} />
        </Button>

        {currentProfile.id !== el.id && (
          <Button onClick={handleDelProfile} className="btn--sm sec-2">
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        )}
      </div>
    </li>
  );
};

export default ProfileItem;
