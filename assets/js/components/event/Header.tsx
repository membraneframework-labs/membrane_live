import React, { useEffect, useState } from "react";
import { redirectToHomePage, syncParticipantsNumber } from "../../utils/headerUtils";
import { ArrowLeft, Users, Copy } from "react-swm-icon-pack";
import {
  storageGetPicture,
  storageGetIsPresenter,
  storageGetPresentingRequest,
  storageSetPresentingRequest,
  storageUnsetIsPresenter,
} from "../../utils/storageUtils";
import GenericButton from "../helpers/GenericButton";
import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Tooltip,
} from "@chakra-ui/react";
import { monthNames } from "../../utils/const";
import { useNavigate } from "react-router-dom";
import UserField from "../dashboard/UserField";
import type { Client, EventInfo } from "../../types/types";
import { Channel } from "phoenix";
import useCheckScreenType from "../../utils/useCheckScreenType";
import "../../../css/event/header.css";
import { cancelPresentingRequest, getPrivateChannelLink } from "../../utils/channelUtils";

type ArrowLeftPopoverProps = {
  eventChannel: Channel | undefined;
  redirectHomeAndRemovePresenter: () => void;
  arrowButton: JSX.Element;
};

const ArrowLeftPopover = ({ eventChannel, redirectHomeAndRemovePresenter, arrowButton }: ArrowLeftPopoverProps) => {
  return (
    <Popover placement="bottom-end" returnFocusOnClose={false}>
      <PopoverTrigger>{arrowButton}</PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverHeader>
          <div>
            <p className="ArrowLeftPopoverHeader">Leaving the event</p>
          </div>
        </PopoverHeader>
        <PopoverBody>
          <div className="ArrowLeftPopoverDiv">
            <Tooltip
              label={`Leave the event without closing it.`}
              placement="bottom-start"
              className="BackArrowInfoTooltip"
            >
              <button className="ArrowLeftPopoverButton" onClick={redirectHomeAndRemovePresenter}>
                Leave
              </button>
            </Tooltip>
            <Tooltip
              label={"End the event and save its recording."}
              placement="bottom"
              className="BackArrowInfoTooltip"
            >
              <button
                className="ArrowLeftPopoverButton"
                onClick={() => {
                  storageUnsetIsPresenter();
                  eventChannel?.push("finish_event", {});
                }}
              >
                End
              </button>
            </Tooltip>
          </div>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

type HeaderProps = {
  eventChannel: Channel | undefined;
  client: Client;
  isRecording: boolean;
  eventInfo: EventInfo;
};

const Header = ({ client, eventChannel, isRecording, eventInfo }: HeaderProps) => {
  const picture: string = storageGetPicture();

  const [participantsNumber, setParticipantsNumber] = useState<number>(0);
  const navigate = useNavigate();
  const screenType = useCheckScreenType();

  if (!isRecording) {
    useEffect(() => syncParticipantsNumber(eventChannel, setParticipantsNumber), [eventChannel]);
  }

  const handleCopyButton = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const formatDate = (date: Date) => {
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const unsetPresenter = () => {
    if (storageGetIsPresenter()) {
      const link = getPrivateChannelLink();
      eventChannel?.push("presenter_remove", { presenterTopic: link + client.email });
      storageUnsetIsPresenter();
    }
  };

  const unsetIsRequestPresenter = () => {
    if (storageGetPresentingRequest()) {
      storageSetPresentingRequest(false);
      cancelPresentingRequest(eventChannel, client.email);
    }
  };

  const redirectHomeAndClearStorage = () => {
    unsetPresenter();
    unsetIsRequestPresenter();
    redirectToHomePage(navigate);
  };

  return (
    <div className="Header">
      {client.isModerator ? (
        <ArrowLeftPopover
          eventChannel={eventChannel}
          redirectHomeAndRemovePresenter={redirectHomeAndClearStorage}
          arrowButton={<GenericButton className="ArrowButton" icon={<ArrowLeft className={"Arrow"} />} />}
        />
      ) : (
        <GenericButton
          className={"ArrowButton"}
          icon={<ArrowLeft className={"Arrow"} />}
          onClick={redirectHomeAndClearStorage}
        />
      )}
      <div className="InfoWrapper">
        <div className="Title"> {eventInfo.title} </div>
        <div className="WebinarInfo">
          <div> {formatDate(eventInfo.startDate)}</div>
          {!isRecording && (
            <>
              <div> | </div>
              <div className="ParticipantsNumber">
                <Users className="UsersIcon" />
                {`${participantsNumber} participant${participantsNumber > 1 ? "s" : ""}`}
              </div>
            </>
          )}
        </div>
      </div>
      {screenType.device == "desktop" && (
        <div className="CopyLink">
          <p className="Link"> {window.location.href} </p>
          <button className="CopyButton" onClick={handleCopyButton}>
            <Copy className="CopyIcon" />
          </button>
        </div>
      )}
      {screenType.device == "desktop" && (
        <UserField
          eventChannel={eventChannel}
          isAuthenticated={client.isAuthenticated}
          name={client.name}
          picture={picture}
        />
      )}
    </div>
  );
};

export default Header;
