import React from "react";
import MembraneLogo from "./MembraneLogo";
import { Calendar, Package, QuestionCircle, Logout, iconType } from "react-swm-icon-pack";
import "../../../css/dashboard/sidedashboardpanel.css";

type SideDashboardPanelProps = {
  currentEvents: string;
  setCurrentEvents: React.Dispatch<React.SetStateAction<string>>;
};

const SideDashboardPanel = ({ currentEvents, setCurrentEvents }: SideDashboardPanelProps) => {
  const getButton = (Icon: iconType, text: string, onClick: () => void) => {
    const isActive = currentEvents == text;

    return (
      <button className="DashboardPanelButton" onClick={onClick}>
        <Icon className={`SideDashboardPanelButton ${isActive ? "ActiveButton" : ""}`} />
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
          setCurrentEvents("All events");
        })}
        {getButton(Package, "Recorded events", () => {
          setCurrentEvents("Recorded events");
        })}
      </div>
      <div className="DashboardPanelItems PanelFooter">
        {getButton(QuestionCircle, "Help", () => {
          // TODO
        })}
        {getButton(Logout, "Logout", () => {
          ["name", "picture", "email", "authJwt", "refreshJwt"].forEach((key) => {
            localStorage.removeItem(key);
          });
          window.location.reload();
        })}
      </div>
    </div>
  );
};

export default SideDashboardPanel;
