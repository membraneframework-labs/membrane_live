import React, { useEffect, useState } from "react";
import { Screen } from "react-swm-icon-pack";
import { syncPresentersNumber } from "../../utils/modePanelUtils";
import type { Client, Mode } from "../../types";
import "../../../css/event/modepanel.css";

type ModeButtonProps = {
  onClick: () => void;
  active: boolean;
  name: string;
};

const ModeButton = ({ onClick, active, name }: ModeButtonProps) => {
  return (
    <button className={`ModeButton ${active && "Clicked"}`} onClick={onClick} name={name}>
      {name}
    </button>
  );
};

type ModePanelProps = {
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  presenterName: string;
  eventChannel: any;
  client: Client;
};

const ModePanel = ({ mode, setMode, presenterName, eventChannel, client }: ModePanelProps) => {
  const [presentersNumber, setPresentersNumber] = useState(0);
  const [amIPresenter, setAmIPresenter] = useState(false);

  useEffect(
    () => syncPresentersNumber(eventChannel, setPresentersNumber, setAmIPresenter, client),
    [eventChannel]
  );

  return (
    <div className="ModePanel">
      <Screen className="ScreenIcon" />
      <div className="PresentingNow">
        {presenterName
          ? `Presenting now...`
          : "Waiting for the presenter to be chosen..."}
      </div>
      <div className="ModeButtons">
        {amIPresenter && (
          <>
            <ModeButton name="Main Stream" active={mode == "hls"} onClick={() => setMode("hls")} />
            <ModeButton
              name={`All presenters (${presentersNumber})`}
              active={mode == "presenters"}
              onClick={() => setMode("presenters")}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ModePanel;
