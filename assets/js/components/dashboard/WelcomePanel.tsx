import React from "react";
import { storageGetAuthToken, storageGetName, storageGetPicture } from "../../utils/storageUtils";
import UserField from "./UserField";
import "../../../css/dashboard/welcomepanel.css";

type WelcomePanelProps = {
  currentEvents: string;
};

const WelcomePanel = ({ currentEvents }: WelcomePanelProps) => {
  const name = storageGetName();
  const picture = storageGetPicture();
  const isAuthenticated = storageGetAuthToken() ? true : false;

  return (
    <div className="WelcomePanel">
      <div className="NamePanel">
        {currentEvents == "All events" && (
          <>
            <p className="HiText">Hi {name.split(" ")[0]}!</p>
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
      <div className="UserContainer">
        <UserField isAuthenticated={isAuthenticated} name={name} picture={picture} />
      </div>
    </div>
  );
};

export default WelcomePanel;
