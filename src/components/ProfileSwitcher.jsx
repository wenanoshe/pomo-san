import { useModal } from "../hooks/useModal";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faFeather } from "@fortawesome/free-solid-svg-icons";

import AddProfile from "./AddProfile";
import Modal from "./Modal";
import Button from "./Button";

import "../styles/components/ProfileSwitcher.scss";

const ProfileSwitcher = ({
  profiles,
  currentProfile,
  handleChangeProfile,
  addNewProfile,
  currentSession,
}) => {
  const [isOpenModal, openModal, closeModal] = useModal();
  const [isOpenAddProfile, openAddProfileModal, closeAddProfileModal] =
    useModal();

  const handleClick = () => {
    closeModal();
    handleChangeProfile();
  };

  return (
    <div className="ps">
      <Modal isOpen={isOpenModal} closeModal={closeModal}>
        <ul>
          {profiles.map((el) => (
            <li
              key={el.id}
              data-value={JSON.stringify(el)}
              onClick={handleClick}
            >
              <FontAwesomeIcon icon={faFeather} />
              <span>{el.name}</span>
            </li>
          ))}
        </ul>
        <button onClick={openAddProfileModal}>Add Profile</button>
      </Modal>

      <Modal isOpen={isOpenAddProfile} closeModal={closeAddProfileModal}>
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
