import React from "react";
import { getIsAuthenticated, storageGetName, storageGetPicture } from "../../utils/storageUtils";
import UserField from "./UserField";
import useCheckScreenType from "../../utils/useCheckScreenType";
import MobileHeader from "./MobileHeader";
import type { CurrentEvents } from "../../types/types";
import "../../../css/dashboard/welcomepanel.css";

type WelcomePanelProps = {
  currentEvents: CurrentEvents;
  setCurrentEvents: React.Dispatch<React.SetStateAction<CurrentEvents>>;
};

const WelcomePanel = ({ currentEvents, setCurrentEvents }: WelcomePanelProps) => {
  const name = storageGetName();
  const picture = storageGetPicture();
  const isAuthenticated = getIsAuthenticated();
  const screenType = useCheckScreenType();

  return (
    <div className="WelcomePanel">
      {screenType.device == "mobile" && (
        <MobileHeader
          isAuthenticated={isAuthenticated}
          currentEvents={currentEvents}
          setCurrentEvents={setCurrentEvents}
        />
      )}
      <div className="NamePanel">
        {currentEvents == "All events" && (
          <>
            <p className="HiText">Hi{name ? ` ${name.split(" ")[0]}` : ""}!</p>
            <p className="EncouragingText">What event would you like to join today?</p>
          </>
        )}
        {currentEvents == "Recorded events" && (
          <>
            <p className="HiText">Recorded events</p>
            <p className="EncouragingText">
              Here you will find past events that have been recorded
              <br />
              Enjoy your watch!
            </p>
          </>
        )}
      </div>
      {screenType.device == "desktop" && (
        <div className="UserContainer">
          <UserField isAuthenticated={isAuthenticated} name={name} picture={picture} />
        </div>
      )}
    </div>
  );
};

export default WelcomePanel;
