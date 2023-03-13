import { Screen } from "react-swm-icon-pack";
import { Channel } from "phoenix";
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
  presenterName: string;
  eventChannel: Channel | undefined;
  amIPresenter: boolean;
};

const ModePanel = ({ presenterName, eventChannel, amIPresenter }: ModePanelProps) => {
  const heartReactionMessage = "reaction_heart";
  const confettiReactionMessage = "reaction_confetti";

  const [heart, toggleHeart] = useStateTimeout(
    () => {
      eventChannel?.push(heartReactionMessage, {});
    },
    false,
    5_000
  );

  const [confetti, toggleConfetti] = useStateTimeout(
    () => {
      eventChannel?.push(confettiReactionMessage, {});
    },
    false,
    2_500
  );

  return (
    <div className="ModePanel">
      <Screen className="ScreenIcon" />
      <div className="PresentingNow">
        {presenterName ? `Presenting now...` : "Waiting for the presenter to be chosen..."}
      </div>
      <div className="ModeButtons">
        {presenterName && !amIPresenter && (
          <div>
            <button className="heartButton" onClick={toggleHeart} disabled={heart}>
              💕
            </button>
            <button className="confettiButton" onClick={toggleConfetti} disabled={confetti}>
              🎉
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModePanel;
