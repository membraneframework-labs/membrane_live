import React from "react";
import { CalendarClock } from "react-swm-icon-pack";
import { shortMonthNames } from "../../utils/const";
import type { EventInfo } from "../../types";
import "../../../css/dashboard/eventsarea.css";

type EventFieldProps = {
  webinarInfo: EventInfo;
};

const EventField = ({ webinarInfo }: EventFieldProps) => {
  const formatDate = (date: Date) => {
    const time = date.toLocaleTimeString().replace(/^(\d+:\d\d)(:\d\d)(.*$)/, "$1$3");

    return `${shortMonthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${time}`;
  };

  return (
    <div className="EventField">
      <div className="InfoBox">
        <p className="EventPresenters">{webinarInfo.presenters.join(", ")}</p>
        <a href={`event/${webinarInfo.uuid}`} className="EventTitle">
          {webinarInfo.title}
        </a>
        <p className="EventDescription">{webinarInfo.description}</p>
        <div className="EventDate">
          <CalendarClock className="CalendarIcon" />
          {formatDate(webinarInfo.startDate)}
        </div>
      </div>
    </div>
  );
};

export default EventField;