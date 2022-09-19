import React from "react";
import { CalendarClock } from "react-swm-icon-pack";
import { shortMonthNames } from "../../utils/const";
import type { EventInfo } from "../../types";
import ModalForm from "./ModalForm";
import { deleteEvent } from "../../utils/dashboardUtils";
import "../../../css/dashboard/eventsarea.css";
import { useToast } from "@chakra-ui/react";

type EventFieldProps = {
  webinarInfo: EventInfo;
};

const EventField = ({ webinarInfo }: EventFieldProps) => {
  const toast = useToast();

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
      <div className="EventModifyBox">
        <ModalForm type="update" activationButtonClass="EventUpdateButton" webinar={webinarInfo} />
        <button className="EventDeleteButton" onClick={() => deleteEvent(webinarInfo.uuid, toast)}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default EventField;
