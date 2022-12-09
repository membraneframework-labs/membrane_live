import React, { useEffect, useState } from "react";
import EventField from "./EventField";
import { getWebinarsInfo } from "../../utils/dashboardUtils";
import { useToast } from "@chakra-ui/react";
import type { EventInfo } from "../../types/types";
import "../../../css/dashboard/eventsarea.css";

type EventsAreaProps = {
  searchText: string;
  currentEvents: string;
};

const EventsArea = ({ searchText, currentEvents }: EventsAreaProps) => {
  const [webinars, setWebinars] = useState<EventInfo[]>([]);
  const [recordings, setRecordings] = useState<EventInfo[]>([]);
  const toast = useToast();

  const listEvents = (isRecording: boolean, events: EventInfo[], upcoming: boolean) => {
    const curDate = new Date();

    const filtered_events = events
      .filter((elem) => {
        const upcomingEventCondition = upcoming ? elem.startDate >= curDate : elem.startDate < curDate;
        return isRecording || upcomingEventCondition;
      })
      .filter((elem) => elem.title.toLowerCase().includes(searchText.toLowerCase()))
      .sort((a, b) =>
        upcoming ? a.startDate.getTime() - b.startDate.getTime() : b.startDate.getTime() - a.startDate.getTime()
      )
      .map((elem) => <EventField key={elem.uuid} isRecording={isRecording} webinarInfo={elem} />);

    return filtered_events.length ? filtered_events : null;
  };

  const listRecordings = (upcoming: boolean) => listEvents(true, recordings, upcoming);
  const listWebinars = (upcoming: boolean) => listEvents(false, webinars, upcoming);

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
            <div className="EventList">
              {listWebinars(true) || <p className="EmptyText">No upcoming events! Create one with the button above!</p>}
            </div>
            <p className="HeaderText">Past events</p>
            <div className="EventList">{listWebinars(false) || <p className="EmptyText">No past events!</p>}</div>
          </>
        )}
        {currentEvents == "Recorded events" && (
          <>
            <p className="HeaderText">Recorded events</p>
            <div className="EventList">
              {listRecordings(false) || <p className="EmptyText">No available recorded events</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EventsArea;
