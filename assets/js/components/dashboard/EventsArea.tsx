import React, { useEffect, useState } from "react";
import EventField from "./EventField";
import { getWebinarsInfo } from "../../utils/dashboardUtils";
import { useToast } from "@chakra-ui/react";
import type { EventInfo } from "../../types";
import "../../../css/dashboard/eventsarea.css";

type EventsAreaProps = {
  searchText: string;
  currentEvents: string;
};

const EventsArea = ({ searchText, currentEvents }: EventsAreaProps) => {
  const [webinars, setWebinars] = useState<EventInfo[]>([]);
  const [recordings, setRecordings] = useState<EventInfo[]>([]);
  const toast = useToast();

  const listEvents = (isRecording: boolean, upcoming: boolean) => {
    const curDate = new Date();
    const events = isRecording ? recordings : webinars;

    return events
      .filter((elem) => (isRecording ? true : upcoming ? elem.startDate >= curDate : elem.startDate < curDate))
      .filter((elem) => elem.title.toLowerCase().includes(searchText.toLowerCase()))
      .sort((a, b) =>
        upcoming
          ? a.startDate.getTime() - b.startDate.getTime()
          : b.startDate.getTime() - a.startDate.getTime()
      )
      .map((elem) => <EventField key={elem.uuid} isRecording={isRecording} webinarInfo={elem} />);
  };

  useEffect(() => {
    getWebinarsInfo(toast, setWebinars, false);
    getWebinarsInfo(toast, setRecordings, true);
  }, []);

  return (
    <div className="FogWrapper">
      <div className="EventsArea">
        {currentEvents == "All events" && (
          <>
            <p className="HeaderText">Upcoming events</p>
            <div className="EventList">{listEvents(false, true)}</div>
            <p className="HeaderText">Past events</p>
            <div className="EventList">{listEvents(false, false)}</div>
          </>
        )}
        {currentEvents == "Recorded events" && (
          <>
            <p className="HeaderText">Recorded events</p>
            <div className="EventList">{listEvents(true, false)}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default EventsArea;
