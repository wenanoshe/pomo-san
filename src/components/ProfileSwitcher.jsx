import { useModal } from "../hooks/useModal";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faFeather, faXmark } from "@fortawesome/free-solid-svg-icons";

import AddProfile from "./AddProfile";
import Modal from "./Modal";
import Button from "./Button";

import "../styles/components/ProfileSwitcher.scss";

const ProfileSwitcher = ({
  profiles,
  currentProfile,
  handleChangeProfile,
  addNewProfile,
}) => {
  const [isOpenModal, openModal, closeModal] = useModal();
  const [isOpenAddProfile, openAddProfileModal, closeAddProfileModal] =
    useModal();

  const handleClick = (e) => {
    closeModal();
    handleChangeProfile(e);
  };

  return (
    <div className="ps">
      <Modal isOpen={isOpenModal} className="ps__modal-profiles">
        <div className="ps__header">
          <h3 className="ps__title">Profiles</h3>
          <Button onClick={closeModal} className="btn--md sec ps__modal-close">
            <FontAwesomeIcon icon={faXmark} />
          </Button>
        </div>
        <ul className="ps__profiles">
          {profiles.map((el) => (
            <li
              key={el.id}
              data-value={JSON.stringify(el)}
              onClick={(e) => handleClick(e)}
              className={`ps__li ${
                currentProfile.id === el.id ? "ps__li--active" : ""
              }`}
            >
              <FontAwesomeIcon icon={faFeather} />
              <span className="ps__profile-name">{el.name}</span>
            </li>
          ))}
        </ul>
        <Button onClick={openAddProfileModal} className="ps__addProfileBtn">
          Add Profile
        </Button>
      </Modal>

      <Modal isOpen={isOpenAddProfile} className="ps__modal-profiles">
        <div className="ps__header">
          <h3 className="ps__title">Add New Profile</h3>
          <Button
            onClick={closeAddProfileModal}
            className="btn--md sec ps__modal-close"
          >
            <FontAwesomeIcon icon={faXmark} />
          </Button>
        </div>
        <AddProfile
          addNewProfile={addNewProfile}
          closeModal={closeAddProfileModal}
        />
      </Modal>

      <Button className="btn--md sec ps__openBtn" onClick={openModal}>
        <FontAwesomeIcon icon={faClock} />
        <span className="ps__stm">{currentProfile.name}</span>
      </Button>
    </div>
  );
};

export default ProfileSwitcher;
