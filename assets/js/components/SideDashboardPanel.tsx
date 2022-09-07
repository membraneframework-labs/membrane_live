import React, { useState } from "react";
import MembraneLogo from "./membraneLogo";
import { Calendar, Package, QuestionCircle, Logout } from "react-swm-icon-pack";
import { getFontColor } from "../utils/styleUtils";
import "../../css/sidedashboardpanel.css";


const SideDashboardPanel = () => {
    const [currentlyActiveButton, setCurrentlyActiveButton] = useState("All events");

    const mainFontColor = getFontColor("--bg-light-color-1");
    const bgFontColor = getFontColor("--bg-light-color-3");

    const getButton = (Icon: any, text: string, onClick: () => void) => {
        const isActive = currentlyActiveButton == text;

        return (
            <button className="DashboardPanelButton" onClick={onClick}>
                <Icon color={isActive ? mainFontColor : bgFontColor} />
                <p className={`PanelText ${isActive ? "ActiveButton" : ""}`}>{text}</p>
                <div className={`Accent ${isActive ? "ActiveAccent" : ""}`} />
            </button>
        );
    };

    return (
        <div className="SideDashboardPanel">
            <div className="LogoContainer">
            <MembraneLogo />
                <p className="LogoText">Membrane</p>
            </div>
            <div className="DashboardPanelItems PagesList">
                {getButton(Calendar, "All events", () => {
                    setCurrentlyActiveButton("All events");
                })}
                {getButton(Package, "Recorded events", () => {
                    setCurrentlyActiveButton("Recorded events");
                })}
            </div>
            <div className="DashboardPanelItems PanelFooter">
                {getButton(QuestionCircle, "Help", () => {
                    // TODO
                })}
                {getButton(Logout, "Logout", () => {
                    // TODO
                })}
            </div>
        </div>
    );
}

export default SideDashboardPanel;