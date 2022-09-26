import "./Modal.css";

export default function Modals({ isOpen, closeModal, children }) {
  return (
    <article
      className={`modal ${isOpen && "modal--open"}`}
      onClick={closeModal}
    >
      <div className="modal__container" onClick={(e) => e.stopPropagation()}>
        <button onClick={closeModal} className="modal__close">
          ✖
        </button>
        {children}
      </div>
    </article>
  );
}
