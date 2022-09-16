import React from "react";
import { useNavigate } from "react-router-dom";
import MembraneLogo from "./MembraneLogo";
import { Calendar, Package, QuestionCircle, Logout } from "react-swm-icon-pack";
import "../../../css/dashboard/sidedashboardpanel.css";

type SideDashboardPanelProps = {
  currentEvents: string;
  setCurrentEvents: React.Dispatch<React.SetStateAction<string>>;
};

const SideDashboardPanel = ({ currentEvents, setCurrentEvents }: SideDashboardPanelProps) => {
  const navigate = useNavigate();

  const getButton = (Icon: any, text: string, onClick: () => void) => {
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
          navigate("/auth", { replace: true });
        })}
      </div>
    </div>
  );
};

export default SideDashboardPanel;