import React from "react";
import MembraneLogo from "./MembraneLogo";
import type { CurrentEvents } from "../types/types";
import "../../../css/dashboard/welcomepanel.css";

type MobileHeaderProps = {
  currentEvents: CurrentEvents;
  setCurrentEvents: React.Dispatch<React.SetStateAction<CurrentEvents>>;
};

const MobileHeader = ({ currentEvents, setCurrentEvents }: MobileHeaderProps) => {
  return (
    <>
      <div className="LogoContainer">
        <MembraneLogo />
        <p className="LogoText">Membrane</p>
      </div>
      <div className="ModeButtonsMobile">
        <button
          className={`ModeButtonMobile ${currentEvents == "All events" && "Clicked"}`}
          onClick={() => setCurrentEvents("All events")}
        >
          All events
        </button>
        <button
          className={`ModeButtonMobile ${currentEvents == "Recorded events" && "Clicked"}`}
          onClick={() => setCurrentEvents("Recorded events")}
        >
          Recorded events
        </button>
      </div>
    </>
  );
};

export default MobileHeader;
