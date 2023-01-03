import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFeather, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";

import Button from "./Button";

import Modal from "./Modal";
import { useModal } from "../hooks/useModal";
import AddProfile from "./AddProfile";

const ProfileItem = ({
  profile,
  handleDelProfile,
  editProfile,
  currentProfile,
  handleClick,
}) => {
  const [isOpenEPModal, openEPModal, closeEPModal] = useModal();

  const handleEditProfile = (e) => {
    e.stopPropagation();
    openEPModal();
  };

  return (
    <li
      data-value={JSON.stringify(profile)}
      onClick={handleClick}
      className={`ps__li ${
        currentProfile.id === profile.id ? "ps__li--active" : ""
      }`}
    >
      <span className="ps__profile-name">{profile.name}</span>

      <div className="ps__actions">
        <Button onClick={handleEditProfile} className="btn--sm sec-2 ">
          <FontAwesomeIcon icon={faFeather} />
        </Button>

        {currentProfile.id !== profile.id && (
          <Button onClick={handleDelProfile} className="btn--sm sec-2">
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        )}
      </div>

      <Modal
        isOpen={isOpenEPModal}
        closeModal={closeEPModal}
        className="ps__modal-profiles"
      >
        <div className="ps__header">
          <h3 className="ps__title">Editing "{profile.name}" profile</h3>
          <Button
            onClick={() => closeEPModal()}
            className="btn--md sec ps__modal-close"
          >
            <FontAwesomeIcon icon={faXmark} />
          </Button>
        </div>
        <AddProfile
          addNewProfile={editProfile}
          closeModal={closeEPModal}
          profile={profile}
          btnName="Save"
        />
      </Modal>
    </li>
  );
};

export default ProfileItem;
