import "../styles/components/Button.scss";

const Button = ({ children, onClick, className, type = "button" }) => {
  return (
    <button className={`btn ${className || ""}`} onClick={onClick} type={type}>
      {children}
    </button>
  );
};

export default Button;
