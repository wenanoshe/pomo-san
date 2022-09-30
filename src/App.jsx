import { FontAwesomeIcon as FAI } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

import Pomodoro from "./components/Pomodoro";
import Button from "./components/Button";

function App() {
  return (
    <div className="App">
      <Pomodoro />
    </div>
  );
}

<Button className="btn--pomodoro">
  {<FAI icon={faPlay} className="btn__icon" />}
</Button>;
export default App;
