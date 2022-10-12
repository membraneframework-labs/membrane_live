import React, { useEffect, useState } from "react";
import { getEventInfo, initEventInfo, syncParticipantsNumber } from "../../utils/headerUtils";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Copy } from "react-swm-icon-pack";
import { storageGetPicture } from "../../utils/storageUtils";
import { useToast } from "@chakra-ui/react";
import { monthNames, pageTitlePrefix } from "../../utils/const";
import UserField from "../dashboard/UserField";
import type { Client, EventInfo } from "../../types";
import "../../../css/event/header.css";

type HeaderProps = {
  eventChannel: any;
  client: Client;
};

const Header = ({ client, eventChannel }: HeaderProps) => {
  const picture: string = storageGetPicture();
  const [eventInfo, setEventInfo] = useState<EventInfo>(initEventInfo());
  const [participantsNumber, setParticipantsNumber] = useState<number>(0);
  const toast = useToast();

  const navigate = useNavigate();
  const redirectToHomePage = () => {
    navigate("/");
    // the line above does not break the socket connection
    // which is desired in this case, so the page is reloaded manually
    window.location.reload();
  };

  useEffect(() => getEventInfo(toast, setEventInfo), []);
  useEffect(() => {
    if (eventInfo.title != "") document.title = `${pageTitlePrefix} | ${eventInfo.title}`;
  }, [eventInfo]);
  useEffect(() => syncParticipantsNumber(eventChannel, setParticipantsNumber), [eventChannel]);

  const handleCopyButton = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const formatDate = (date: Date) => {
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <div className="Header">
      <button onClick={redirectToHomePage}>
        <ArrowLeft className="Arrow" />
      </button>
      <div className="InfoWrapper">
        <div className="Title"> {eventInfo.title} </div>
        <div className="WebinarInfo">
          <div> {formatDate(eventInfo.startDate)}</div>
          <div> | </div>
          <div className="ParticipantsNumber">
            <Users className="UsersIcon" />
            {participantsNumber + ` participant${participantsNumber > 1 ? "s" : ""}`}
          </div>
        </div>
      </div>
      <div className="CopyLink">
        <p className="Link"> {window.location.href} </p>
        <button className="CopyButton" onClick={handleCopyButton}>
          <Copy className="CopyIcon" />
        </button>
      </div>
      <UserField isAuthenticated={client.isAuthenticated} name={client.name} picture={picture} />
    </div>
  );
};

export default Header;
