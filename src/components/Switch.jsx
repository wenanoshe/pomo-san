import "../styles/components/Switch.scss";

const Switch = ({ name, checked, onChange }) => {
  return (
    <label className="switch">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
      />
      <span className="slider"></span>
    </label>
  );
};

export default Switch;
