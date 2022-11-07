import React, { useEffect, useState } from "react";
import { Screen } from "react-swm-icon-pack";
import { syncPresentersNumber } from "../../utils/modePanelUtils";
import type { Client, Mode } from "../../types";
import "../../../css/event/modepanel.css";
import "../../../css/event/animation.css";
import { Channel } from "phoenix";
import {
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Popover,
  PopoverArrow,
  PopoverHeader,
} from "@chakra-ui/react";

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

type MenuPopoverProps = {
  eventChannel: Channel | undefined;
};

const MenuPopover = ({ eventChannel }: MenuPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger>
        <button className="ModePopoverButton" onClick={() => undefined}>
          END STREAM
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverHeader>
          <div>
            <p className="ModePopoverHeader">Are you sure?</p>
          </div>
        </PopoverHeader>
        <PopoverBody>
          <div>
            <button
              className="ModePopoverButton"
              onClick={() => {
                eventChannel?.push("finish_event", {});
              }}
            >
              YES
            </button>
          </div>
        </PopoverBody>
      </PopoverContent>
    </Popover>
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
    [eventChannel]
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
          <div
            className={`heartButton ${isClicked ? "isActive" : ""}`}
            onClick={() => sendReaction()}
          />
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
        {client.isModerator && <MenuPopover eventChannel={eventChannel} />}
      </div>
    </div>
  );
};

export default ModePanel;
