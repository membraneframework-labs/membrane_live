import React from "react";
import { storageGetName, storageGetPicture } from "../../utils/storageUtils";
import { User1 } from "react-swm-icon-pack";
import "../../../css/dashboard/welcomepanel.css";

const WelcomePanel = () => {
    const name = storageGetName();
    const picture = storageGetPicture();

    return (
        <div className="WelcomePanel">
            <div className="NamePanel">
                <p className="HiText">Hi {name.split(" ")[0]}!</p>
                <p className="EncouragingText">What event would you like to join today?</p>
            </div>
            <div className="UserContainer">
                {picture ? (
                <img src={picture} className="DashboardUserIcon"/>
                ) : (
                <User1 className="DashboardUserIcon" />
                )}
                <div className="DashboardUserName">{name}</div>
            </div>
        </div>
    );
}

export default WelcomePanel;