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
  const toast = useToast();

  const listEvents = (upcoming: boolean) => {
    const curDate = new Date();

    return webinars
      .filter((elem) => (upcoming ? elem.startDate >= curDate : elem.startDate < curDate))
      .filter((elem) => elem.title.toLowerCase().includes(searchText.toLowerCase()))
      .sort((a, b) =>
        upcoming
          ? a.startDate.getTime() - b.startDate.getTime()
          : b.startDate.getTime() - a.startDate.getTime()
      )
      .map((elem) => <EventField key={elem.uuid} webinarInfo={elem} />);
  };

  useEffect(() => {
    getWebinarsInfo(toast, setWebinars);
  }, []);

  return (
    <div className="FogWrapper">
      <div className="EventsArea">
        {currentEvents == "All events" && (
          <>
            <p className="HeaderText">Upcoming events</p>
            <div className="EventList">{listEvents(true)}</div>
            <p className="HeaderText">Past events</p>
            <div className="EventList">{listEvents(false)}</div>
          </>
        )}
        {currentEvents == "Recorded events" && (
          <>
            <p className="HeaderText">Recorded events</p>
            <i style={{ color: "#001a72" }}>Coming soon...</i>
          </>
        )}
      </div>
    </div>
  );
};

export default EventsArea;
