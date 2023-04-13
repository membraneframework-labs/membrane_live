import React from "react";
import MembraneLogo from "./MembraneLogo";
import type { CurrentEvents } from "../../types/types";
import GoogleButton from "../helpers/GoogleButton";
import { roundedGoogleButton } from "../../utils/const";
import { Logout } from "react-swm-icon-pack";
import { logOut } from "../../utils/storageUtils";
import "../../../css/dashboard/welcomepanel.css";

type MobileHeaderProps = {
  isAuthenticated: boolean;
  currentEvents: CurrentEvents;
  setCurrentEvents: React.Dispatch<React.SetStateAction<CurrentEvents>>;
};

const MobileHeader = ({ isAuthenticated, currentEvents, setCurrentEvents }: MobileHeaderProps) => {
  return (
    <>
      <div className="LogoContainer">
        <MembraneLogo />
        <p className="LogoText">Membrane</p>
        {isAuthenticated ? (
          <button className="MobileLoggingButton" onClick={() => logOut()}>
            <Logout />
          </button>
        ) : (
          <GoogleButton buttonId="MobileHeaderButton" className="MobileLoggingButton" options={roundedGoogleButton} />
        )}
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
