import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MembraneLogo from "./MembraneLogo";
import { Calendar, Package, QuestionCircle, Logout } from "react-swm-icon-pack";
import { getFontColor } from "../utils/styleUtils";
import "../../css/sidedashboardpanel.css";


const SideDashboardPanel = () => {
    const navigate = useNavigate();
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
                    localStorage.clear();
                    navigate("/auth", {replace: true});
                    // TODO pewnie trzeba będzie wysłać jakiś komunikat
                    // zeby tego usera wyrzucilo ze spotkan
                })}
            </div>
        </div>
    );
}

export default SideDashboardPanel;