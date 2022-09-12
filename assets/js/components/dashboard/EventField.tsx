import React from "react";
import { Image } from "@chakra-ui/react";
import { WebinarInfo } from "../../utils/dashboardUtils";
import { CalendarClock } from "react-swm-icon-pack";
import "../../../css/dashboard/eventsarea.css";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "June",
  "July",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type EventFieldProps = {
  webinarInfo: WebinarInfo;
};

const EventField = ({ webinarInfo }: EventFieldProps) => {
  const formatDate = (date: Date) => {
    const time = date.toLocaleTimeString().replace(/^(\d+:\d\d)(:\d\d)(.*$)/, "$1$3");

    return `${monthNames[date.getMonth()]} ${date.getDay()}, ${date.getFullYear()} ${time}`;
  };

  return (
    <div className="EventField">
      <div className="EventImageContainer">
        <Image
          src="https://drscdn.500px.org/photo/224226723/m%3D2048/v2?sig=98f73dda3c8af34384e01d46702feb68c615f7279b58f0d03cee7e7b4acd82fc"
          alt="Event Photo"
          className="EventImage"
        />
      </div>
      <div className="InfoBox">
        <p className="EventPresenters">{webinarInfo.presenters.join(", ")}</p>
        <a href={`event/${webinarInfo.uuid}`} className="EventTitle">
          {webinarInfo.title}
        </a>
        <p className="EventDescription">{webinarInfo.description}</p>
        <div className="EventDate">
          <CalendarClock />
          {formatDate(webinarInfo.start_date)}
        </div>
      </div>
    </div>
  );
};

export default EventField;
