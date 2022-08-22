import React, { useEffect, useState } from "react";
import { getEventInfo, initEventInfo, syncParticipantsNumber } from "../utils/headerUtils";
import "../../css/header.css";
import { ArrowLeft, Users, User1, Copy } from "react-swm-icon-pack";

type HeaderProps = {
  eventChannel: any;
  name: string;
};

export type EventInfo = {
  link: string;
  title: string;
  description: string;
  start_date: string;
  presenters: string[];
};

const Header = ({ name, eventChannel }: HeaderProps) => {
  const [eventInfo, setEventInfo] = useState<EventInfo>(initEventInfo());
  const [participantsNumber, setParticipantsNumber] = useState<number>(0);

  useEffect(() => getEventInfo(setEventInfo), []);
  useEffect(() => syncParticipantsNumber(eventChannel, setParticipantsNumber), [eventChannel]);

  const handleCopyButton = () => {
    navigator.clipboard.writeText(window.location.pathname);
  };

  return (
    <div className="Header">
      <button>
        <ArrowLeft className="Arrow"/>
      </button>
      <div className="InfoWrapper">
        <div className="Title"> {eventInfo.title} </div>
        <div className="WebinarInfo">
          <div> {eventInfo.start_date}</div>
          <div> | </div>
          <div className="ParticipantsNumber">
            <Users className="UsersIcon"/>
            {participantsNumber + " participants"}
          </div>
        </div>
      </div>
      <div className="CopyLink">
        <p className="Link"> {window.location.pathname} </p>
        <button className="CopyButton" onClick={handleCopyButton}>
          <Copy/>
        </button>
      </div>
      <div className="User">
        <User1 className="UserIcon"/>
        <div className="UserName"> {name}</div>
      </div>
    </div>
  );
};

export default Header;
