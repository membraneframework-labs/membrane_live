import React, { useEffect, useState } from "react";
import { getEventInfo, initEventInfo, syncParticipantsNumber } from "../utils/headerUtils";
import { useNavigate } from "react-router-dom";
import "../../css/header.css";
import { ArrowLeft, Users, User1, Copy } from "react-swm-icon-pack";

const monthNames = ["January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December"
];

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

  const navigate = useNavigate();
  const redirectToHomePage = () => navigate("/");

  useEffect(() => getEventInfo(setEventInfo), []);
  useEffect(() => syncParticipantsNumber(eventChannel, setParticipantsNumber), [eventChannel]);

  const handleCopyButton = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const formatDate = (dateString: string) => {
    const date = new Date();
    date.setTime(Date.parse(dateString));

    return `${monthNames[date.getMonth()]}, ${date.getDay()} ${date.getFullYear()}`
  }

  return (
    <div className="Header">
      <button
        onClick={redirectToHomePage}
      >
        <ArrowLeft className="Arrow"/>
      </button>
      <div className="InfoWrapper">
        <div className="Title"> {eventInfo.title} </div>
        <div className="WebinarInfo">
          <div> {formatDate(eventInfo.start_date)}</div>
          <div> | </div>
          <div className="ParticipantsNumber">
            <Users className="UsersIcon"/>
            {participantsNumber + ` participant${participantsNumber > 1 ? "s" : ""}`}
          </div>
        </div>
      </div>
      <div className="CopyLink">
        <p className="Link"> {window.location.href} </p>
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
