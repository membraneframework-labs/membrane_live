import React from "react";
import { CalendarClock } from "react-swm-icon-pack";
import { shortMonthNames } from "../../utils/const";
import ModalForm from "./ModalForm";
import { useToast } from "@chakra-ui/react";
import { getEventType } from "../../utils/dashboardUtils";
import { deleteEventPopup } from "../../utils/toastUtils";
import type { EventInfo } from "../../types";
import "../../../css/dashboard/eventsarea.css";

type EventFieldProps = {
  isRecording: boolean;
  webinarInfo: EventInfo;
};

const EventField = ({ isRecording, webinarInfo }: EventFieldProps) => {
  const toast = useToast();
  const eventType = getEventType(isRecording);

  const formatDate = (date: Date) => {
    const time = date.toLocaleTimeString().replace(/^(\d+:\d\d)(:\d\d)(.*$)/, "$1$3");

    return `${shortMonthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${time}`;
  };

  return (
    <div className="EventField">
      <div className="InfoBox">
        <p className="EventPresenters">{webinarInfo.presenters.join(", ")}</p>
        <a href={`${eventType}/${webinarInfo.uuid}`} className="EventTitle">
          {webinarInfo.title}
        </a>
        <p className="EventDescription">{webinarInfo.description}</p>
        <div className="FlexContainer">
          <div className="EventDate">
            <CalendarClock />
            {formatDate(webinarInfo.startDate)}
          </div>
          <div className="EventModifyBox">
            {!isRecording && (
              <ModalForm
                type="update"
                activationButtonClass="EventUpdateButton"
                webinar={webinarInfo}
              />
            )}
            <button
              className="EventDeleteButton"
              onClick={() => deleteEventPopup(toast, webinarInfo.uuid)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventField;
