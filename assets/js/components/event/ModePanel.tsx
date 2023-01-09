import React, { useEffect, useState } from "react";
import { Screen } from "react-swm-icon-pack";
import { syncPresentersNumber } from "../../utils/modePanelUtils";
import { Channel } from "phoenix";
import type { Client, Mode } from "../../types/types";
import { useStateTimeout } from "../../utils/reactUtils";

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
  const heartReactionMessage = "reaction_heart";
  const confettiReactionMessage = "reaction_confetti";

  const [presentersNumber, setPresentersNumber] = useState(0);
  const [amIPresenter, setAmIPresenter] = useState(false);

  useEffect(
    () => syncPresentersNumber(eventChannel, setPresentersNumber, setAmIPresenter, client),
    [client, eventChannel]
  );

  const [heart, toggleHeart] = useStateTimeout(() => {
    eventChannel?.push(heartReactionMessage, {});
  }, false, 5_000);

  const [confetti, toggleConfetti] = useStateTimeout(() => {
    eventChannel?.push(confettiReactionMessage, {});
  }, false, 2_500);

  return (
    <div className="ModePanel">
      <Screen className="ScreenIcon" />
      <div className="PresentingNow">
        {presenterName ? `Presenting now...` : "Waiting for the presenter to be chosen..."}
      </div>
      <div className="ModeButtons">
        {presenterName && (
          <div>
            <button className="heartButton" onClick={toggleHeart} disabled={heart}>
              💕
            </button>
            <button className="confettiButton" onClick={toggleConfetti} disabled={confetti}>
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
