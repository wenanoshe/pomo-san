import { Feather, Trash2, X } from "lucide-react";

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
          <Feather />
        </Button>

        {currentProfile.id !== profile.id && (
          <Button onClick={handleDelProfile} className="btn--sm sec-2">
            <Trash2 />
          </Button>
        )}
      </div>

      <Modal
        isOpen={isOpenEPModal}
        closeModal={closeEPModal}
        className="ps__modal-profiles"
      >
        <div className="ps__header">
          <h3 className="ps__title">
            Editing &quot;{profile.name}&quot; profile
          </h3>
          <Button
            onClick={() => closeEPModal()}
            className="btn--md sec ps__modal-close"
          >
            <X />
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
