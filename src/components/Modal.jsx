import ReactDOM from "react-dom";
import "../styles/components/Modal.scss";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export default function Modals({ isOpen, closeModal, children }) {
  return ReactDOM.createPortal(
    <article
      className={`modal ${isOpen && "modal--open"}`}
      onClick={closeModal}
    >
      <div className="modal__container" onClick={(e) => e.stopPropagation()}>
        <button onClick={closeModal} className="modal__close">
          <FontAwesomeIcon icon={faXmark} />
        </button>
        {children}
      </div>
    </article>,
    document.getElementById("modals")
  );
}
