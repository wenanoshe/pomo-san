import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFeather, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";

import Button from "./Button";

import Modal from "./Modal";
import { useModal } from "../hooks/useModal";
import AddProfile from "./AddProfile";

const ProfileItem = ({
  el,
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

      <Modal
        isOpen={isOpenEPModal}
        closeModal={closeEPModal}
        className="ps__modal-profiles"
      >
        <div className="ps__header">
          <h3 className="ps__title">Editing "{el.name}" profile</h3>
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
          el={el}
          btnName="Edit"
        />
      </Modal>
    </li>
  );
};

export default ProfileItem;
