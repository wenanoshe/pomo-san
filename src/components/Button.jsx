import "../styles/components/Button.scss";

const Button = ({ children, onClick, className, type = "button", outline }) => {
  return (
    <button
      className={`btn ${className || ""} ${outline ? "btn--outline" : ""}`}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
};

export default Button;
