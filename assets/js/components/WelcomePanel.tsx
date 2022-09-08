import React from "react";
import { storageGetName, storageGetPicture } from "../utils/storageUtils";
import { Avatar } from "@chakra-ui/react";
import { User1 } from "react-swm-icon-pack";
import "../../css/welcomepanel.css";

const WelcomePanel = () => {
    const name = storageGetName();
    const picture = storageGetPicture();

    return (
        <div className="WelcomePanel">
            <div className="NamePanel">
                <p className="HiText">Hi {name.split(" ")[0]}!</p>
                <div className="UserContainer">
                    {picture ? (
                    <Avatar name={name} src={picture} className="DashboardUserIcon"/>
                    ) : (
                    <User1 className="DashboardUserIcon" />
                    )}
                    <div className="DashboardUserName">{name}</div>
                </div>
            </div>
            <p className="EncouragingText">What event would you like to join today?</p>
        </div>
    );
}

export default WelcomePanel;