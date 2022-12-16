import React, {useEffect, useState} from "react";
import {
  getEventInfo,
  initEventInfo,
  redirectToHomePage,
  syncParticipantsNumber
} from "../../utils/headerUtils";
import {ArrowLeft, Users, Copy, Redo} from "react-swm-icon-pack";
import {storageGetPicture} from "../../utils/storageUtils";
import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import {monthNames, pageTitlePrefix} from "../../utils/const";
import {useNavigate} from "react-router-dom";
import UserField from "../dashboard/UserField";
import type {Client, EventInfo} from "../../types/types";
import {Channel} from "phoenix";
import useCheckScreenType from "../../utils/useCheckScreenType";
import "../../../css/event/header.css";

type ArrowLeftPopoverProps = {
  eventChannel: Channel | undefined;
  redirectHome: () => void;
};

const ArrowLeftPopover = ({eventChannel, redirectHome}: ArrowLeftPopoverProps) => {
  return (
    <Popover placement="bottom-end" returnFocusOnClose={false}>
      <PopoverTrigger>
        <button>
          <ArrowLeft className="Arrow"/>
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow/>
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
              <button className="ArrowLeftPopoverButton" onClick={redirectHome}>
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
};

const Header = ({client, eventChannel, isRecording}: HeaderProps) => {
  const picture: string = storageGetPicture();
  const [eventInfo, setEventInfo] = useState<EventInfo>(initEventInfo());
  const [participantsNumber, setParticipantsNumber] = useState<number>(0);
  const toast = useToast();
  const navigate = useNavigate();
  const screenType = useCheckScreenType();

  useEffect(() => getEventInfo(toast, setEventInfo, isRecording), []);
  useEffect(() => {
    if (eventInfo.title != "") document.title = `${pageTitlePrefix} | ${eventInfo.title}`;
  }, [eventInfo]);

  if (!isRecording) {
    useEffect(() => syncParticipantsNumber(eventChannel, setParticipantsNumber), [eventChannel]);
  }

  const handleCopyButton = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const formatDate = (date: Date) => {
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <div className="Header">
      {client.isModerator ? (
        <ArrowLeftPopover eventChannel={eventChannel}
                          redirectHome={() => redirectToHomePage(navigate)}/>
      ) : (
        <button onClick={() => redirectToHomePage(navigate)}>
          <ArrowLeft className="Arrow"/>
        </button>
      )}

      {/*{screenType.device == "mobile" && (*/}
      {/*  <div className="TurnDeviceContainer">*/}
      {/*    <Redo className="TurnIcon" />*/}
      {/*    <p className="TurnDeviceText">Turn your device sideways to see the livestream!</p>*/}
      {/*  </div>*/}
      {/*)}*/}
      <div className="InfoWrapper">
        <div className="Title"> {eventInfo.title} </div>
        <div className="WebinarInfo">
          <div> {formatDate(eventInfo.startDate)}</div>
          {!isRecording && (
            <>
              <div> |</div>
              <div className="ParticipantsNumber">
                <Users className="UsersIcon"/>
                {`${participantsNumber} participant${participantsNumber > 1 ? "s" : ""}`}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="CopyLink">
        <p className="Link"> {window.location.href} </p>
        <button className="CopyButton" onClick={handleCopyButton}>
          <Copy className="CopyIcon"/>
        </button>
      </div>

      <UserField
        eventChannel={eventChannel}
        isAuthenticated={client.isAuthenticated}
        name={client.name}
        picture={picture}
      />
    </div>
  );
};

export default Header;
