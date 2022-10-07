// import ReactDOM from "react-dom";
import "../styles/components/Modal.scss";

export default function Modal({ isOpen, closeModal, children, className }) {
  return (
    <article
      className={`modal ${isOpen && "modal--open"}`}
      onClick={closeModal}
    >
      <div
        className={`${className} modal__container`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </article>
  );
}
