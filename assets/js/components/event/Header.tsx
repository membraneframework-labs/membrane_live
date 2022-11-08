import React, { useEffect, useState } from "react";
import {
  getEventInfo,
  initEventInfo,
  redirectToHomePage,
  syncParticipantsNumber,
} from "../../utils/headerUtils";
import { ArrowLeft, Users, Copy, Redo } from "react-swm-icon-pack";
import { storageGetPicture } from "../../utils/storageUtils";
import { ButtonGroup, Popover, PopoverArrow, PopoverBody, PopoverContent, PopoverFooter, PopoverHeader, PopoverTrigger, useDisclosure, useToast } from "@chakra-ui/react";
import { monthNames, pageTitlePrefix } from "../../utils/const";
import { useNavigate } from "react-router-dom";
import UserField from "../dashboard/UserField";
import type { Client, EventInfo } from "../../types";
import { Channel } from "phoenix";
import useCheckScreenType from "../../utils/hooks";
import "../../../css/event/header.css";


type ArrowLeftPopoverProps = {
  eventChannel: Channel | undefined;
  redirectHome: () => void;
};

const ArrowLeftPopover = ({ eventChannel, redirectHome }: ArrowLeftPopoverProps) => {
  const {onOpen, onClose, isOpen} = useDisclosure();
  
  return (
    <Popover
    placement="bottom-end"
    returnFocusOnClose={false}
    >
      <PopoverTrigger>
        <button onClick={onOpen}> 
        <ArrowLeft className="Arrow" />
        </button>   
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverHeader>
          <div>
            <p className="ModePopoverHeader">Leaving the event</p>
          </div>
        </PopoverHeader>
        <PopoverBody>
          <div className="ModePopoverDiv">
          <button
              className="ModePopoverButton"
              onClick={redirectHome}
            >
              Leave
            </button>
            <button
              className="ModePopoverButton"
              onClick={() => {
                eventChannel?.push("finish_event", {});
              }}
            >
              End
            </button>
            <button
              className="ModePopoverButton"
              onClick={onClose}
            >
              Cancel
            </button>
            {/* <p className="ModePopoverText"> Do you want to leave the event or finish it and save the recording?</p> */}
          </div>
        </PopoverBody>
        {/* <PopoverFooter>
          <ButtonGroup>

          </ButtonGroup>
        </PopoverFooter> */}
      </PopoverContent>
    </Popover>
  );
};

type HeaderProps = {
  eventChannel: Channel | undefined;
  client: Client;
  isRecording: boolean;
};

const Header = ({ client, eventChannel, isRecording }: HeaderProps) => {
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

      {client.isModerator ?
       <ArrowLeftPopover eventChannel={eventChannel} redirectHome={() => redirectToHomePage(navigate)}/> :
        <button onClick={() => redirectToHomePage(navigate)}>
          <ArrowLeft className="Arrow" />
        </button>
      }

      {screenType.device == "mobile" && (
        <div className="TurnDeviceContainer">
          <Redo className="TurnIcon" />
          <p className="TurnDeviceText">Turn your device sideways to see the livestream!</p>
        </div>
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
