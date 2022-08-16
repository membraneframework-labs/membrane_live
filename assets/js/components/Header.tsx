import React, { useEffect, useState } from "react";
import { initEventInfo, getEventInfo, syncParticipantsNumber } from "../utils/headerUtils";
import "../../css/header.css";
import arrowIcon from "../../images/arrow.svg";
import copyIcon from "../../images/copy.svg";
import user from "../../images/userHeader.svg";
import { AiOutlineUser } from "react-icons/ai";

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
    <>
      <button>
        <img src={arrowIcon}></img>
      </button>
      <div className="InfoWrapper">
        <div className="Title"> {eventInfo.title} </div>
        <div className="WebinarInfo">
          <div> {eventInfo.start_date}</div>
          <div> | </div>
          <div className="ParticipantsNumber">
            <img src={user}></img>
            {participantsNumber + " participants"}
          </div>
        </div>
      </div>
      <div className="CopyLink">
        <p className="Link"> {window.location.pathname} </p>
        <button className="CopyButton" onClick={handleCopyButton}>
          <img src={copyIcon} />
        </button>
      </div>
      <div className="User">
        <AiOutlineUser className="UserIcon"></AiOutlineUser>
        <div className="UserName"> {name}</div>
      </div>
    </>
  );
};

export default Header;
