import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MembraneLogo from "./MembraneLogo";
import { Calendar, Package, QuestionCircle, Logout } from "react-swm-icon-pack";
import { getFontColor } from "../../utils/styleUtils";
import "../../../css/dashboard/sidedashboardpanel.css";

type SideDashboardPanelProps = {
  currentEvents: string;
  setCurrentEvents: React.Dispatch<React.SetStateAction<string>>;
};

const SideDashboardPanel = ({ currentEvents, setCurrentEvents }: SideDashboardPanelProps) => {
  const navigate = useNavigate();

  const mainFontColor = getFontColor("--bg-light-color-1");
  const bgFontColor = getFontColor("--bg-light-color-3");
  const transitionFontColor = getFontColor("--bg-light-color-4");

  const getButton = (Icon: any, text: string, onClick: () => void) => {
    const [hoverColor, setHoverColor] = useState(bgFontColor);
    const isActive = currentEvents == text;

    return (
      <button
        className="DashboardPanelButton"
        onClick={onClick}
        // a very inconvinient way to add hover effect to the icon
        // as it seems to be impossible in css
        onMouseEnter={() => setHoverColor(transitionFontColor)}
        onMouseLeave={() => setHoverColor(bgFontColor)}
      >
        <Icon color={isActive ? mainFontColor : hoverColor} /> {/* TODO color transition */}
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
          localStorage.clear();
          navigate("/auth", { replace: true });
          // TODO probably some kind of message
          // needs to be sent to the server to kick the user
          // from webinars that he's participating in
        })}
      </div>
    </div>
  );
};

export default SideDashboardPanel;
