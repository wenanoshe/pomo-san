import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faXmark,
  faCirclePlus,
} from "@fortawesome/free-solid-svg-icons";

import AddProfile from "./AddProfile";
import Modal from "./Modal";
import Button from "./Button";
import ProfileItem from "./ProfileItem";

import { useModal } from "../hooks/useModal";

import "../styles/components/ProfileSwitcher.scss";

const ProfileSwitcher = ({
  profiles,
  currentProfile,
  handleChangeProfile,
  addNewProfile,
  editProfile,
  deleteProfile,
}) => {
  const [isOpenModal, openModal, closeModal] = useModal();
  const [isOpenAddProfile, openAddProfileModal, closeAddProfileModal] =
    useModal();

  // FUNCTIONS

  const handleClick = (e) => {
    closeModal();
    handleChangeProfile(e.currentTarget);
  };

  const handleDelProfile = (e) => {
    e.stopPropagation();
    const li = e.currentTarget.parentElement.parentElement.dataset.value;
    deleteProfile(JSON.parse(li));
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
            <ProfileItem
              key={el.id}
              profile={el}
              editProfile={editProfile}
              handleDelProfile={handleDelProfile}
              currentProfile={currentProfile}
              handleClick={handleClick}
            />
          ))}
        </ul>
        <Button onClick={openAddProfileModal} className="ps__addProfileBtn">
          <span>Add new Profile</span>
          <FontAwesomeIcon icon={faCirclePlus} />
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
