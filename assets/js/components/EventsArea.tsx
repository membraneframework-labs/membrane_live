import React, { useEffect, useState } from "react";
import EventField from "./EventField";
import { getWebinarInfo } from "../utils/dashboardUtils";
import type { WebinarInfo } from "../utils/dashboardUtils";
import "../../css/eventsarea.css";

type EventsAreaProps = {
    searchText: string;
    currentEvents: string;
}

const EventsArea = ({searchText, currentEvents}: EventsAreaProps) => {
    const [webinars, setWebinars] = useState<WebinarInfo[]>([]);

    const listEvents = (upcoming: boolean) => {
        const curDate = new Date();

        return webinars
            .filter(elem => upcoming ? 
                elem.start_date >= curDate 
                : elem.start_date < curDate)
            .filter(elem => elem.title.includes(searchText))
            .sort((a, b) => upcoming ? 
                a.start_date.getTime() - b.start_date.getTime() 
                : b.start_date.getTime() - a.start_date.getTime())
            .map(elem => (
                <EventField key={elem.uuid} webinarInfo={elem}/>
        ));
    }

    useEffect(() => {
        getWebinarInfo(setWebinars);
    }, []);

    return (
        <div className="EventsArea">
            { currentEvents == "All events" && <>
                <p className="HeaderText">Upcoming events</p>
                <div className="EventList">
                    {listEvents(true)}
                </div>
                <p className="HeaderText">Past events</p>
                <div className="EventList">
                    {listEvents(false)}
                </div>
            </>}
            { currentEvents == "Recorded events" && <>
                <p className="HeaderText">Recorded events</p>
                    {/* TODO */}
            </>}
        </div>
    );
}

export default EventsArea;