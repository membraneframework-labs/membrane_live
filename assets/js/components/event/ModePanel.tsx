import React, { useEffect, useState } from "react";
import { Screen } from "react-swm-icon-pack";
import { syncPresentersNumber } from "../../utils/modePanelUtils";
import { Channel } from "phoenix";
import type { Client, Mode } from "../../types/types";
import "../../../css/event/modepanel.css";
import "../../../css/event/animation.css";

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
  eventChannel: Channel | undefined;
  client: Client;
};

const ModePanel = ({ mode, setMode, presenterName, eventChannel, client }: ModePanelProps) => {
  const [presentersNumber, setPresentersNumber] = useState(0);
  const [amIPresenter, setAmIPresenter] = useState(false);
  const [isClicked, setClicked] = useState(false);

  useEffect(
    () => syncPresentersNumber(eventChannel, setPresentersNumber, setAmIPresenter, client),
    [client, eventChannel]
  );

  useEffect(() => {
    const ref = setTimeout(() => setClicked(false), 5_000);
    return () => {
      clearTimeout(ref);
    };
  }, [isClicked]);

  const sendReaction = () => {
    setClicked(true);
    eventChannel?.push("reaction", {});
  };

  return (
    <div className="ModePanel">
      <Screen className="ScreenIcon" />
      <div className="PresentingNow">
        {presenterName ? `Presenting now...` : "Waiting for the presenter to be chosen..."}
      </div>
      <div className="ModeButtons">
        {presenterName && (
          <div className={`heartButton ${isClicked ? "isActive" : ""}`} onClick={() => sendReaction()} />
        )}
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
