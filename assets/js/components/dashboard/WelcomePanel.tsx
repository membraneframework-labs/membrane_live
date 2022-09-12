import React from "react";
import { storageGetName, storageGetPicture } from "../../utils/storageUtils";
import { User1 } from "react-swm-icon-pack";
import "../../../css/dashboard/welcomepanel.css";

type WelcomePanelProps = {
  currentEvents: string;
};

const WelcomePanel = ({ currentEvents }: WelcomePanelProps) => {
  const name = storageGetName();
  const picture = storageGetPicture();

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
        {picture ? (
          <img src={picture} className="DashboardUserIcon" />
        ) : (
          <User1 className="DashboardUserIcon" />
        )}
        <div className="DashboardUserName">{name}</div>
      </div>
    </div>
  );
};

export default WelcomePanel;
