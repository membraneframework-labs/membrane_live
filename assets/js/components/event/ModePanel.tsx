import React, { useEffect, useState } from "react";
import { Screen } from "react-swm-icon-pack";
import { syncPresentersNumber } from "../../utils/modePanelUtils";
import { Channel } from "phoenix";
import type { Client, Mode } from "../../types/types";

import "../../../css/event/modepanel.css";
import "../../../css/event/animation.css";

export type ModeButtonProps = {
  onClick: () => void;
  name: string;
  active?: boolean;
};

export const ModeButton = ({ onClick, name, active = true }: ModeButtonProps) => {
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
  const [isHeartClicked, setHeartClicked] = useState(false);
  const [isConfettiClicked, setConfettiClicked] = useState(false);

  useEffect(
    () => syncPresentersNumber(eventChannel, setPresentersNumber, setAmIPresenter, client),
    [client, eventChannel]
  );

  useEffect(() => {
    const ref = setTimeout(() => setHeartClicked(false), 5_000);
    return () => {
      clearTimeout(ref);
    };
  }, [isHeartClicked]);

  useEffect(() => {
    const ref = setTimeout(() => setConfettiClicked(false), 2_500);
    return () => {
      clearTimeout(ref);
    };
  }, [isConfettiClicked]);

  const sendHeartReaction = () => {
    setHeartClicked(true);
    eventChannel?.push("reaction_heart", {});
  };

  const sendConfetti = () => {
    setConfettiClicked(true);
    eventChannel?.push("reaction_confetti", {});
  };

  return (
    <div className="ModePanel">
      <Screen className="ScreenIcon" />
      <div className="PresentingNow">
        {presenterName ? `Presenting now...` : "Waiting for the presenter to be chosen..."}
      </div>
      <div className="ModeButtons">
        {presenterName && (
          <div>
            <button className="heartButton" onClick={sendHeartReaction}>
              💕
            </button>
            <button className="confettiButton" onClick={sendConfetti} disabled={isConfettiClicked}>
              🎉
            </button>
          </div>
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
