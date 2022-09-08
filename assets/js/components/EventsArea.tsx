import React, { useEffect, useState } from "react";
import EventField from "./EventField";
import { getWebinarInfo } from "../utils/dashboardUtils";
import type { WebinarInfo } from "../utils/dashboardUtils";
import "../../css/eventsarea.css";

const EventsArea = () => {
    const [webinars, setWebinars] = useState<WebinarInfo[]>([]);

    useEffect(() => {
        getWebinarInfo(setWebinars);
    }, []);

    return (
        <div className="EventsArea">
            <p className="HeaderText">Upcoming events</p>
            <div className="EventList">
                {
                    webinars.filter(elem => elem.start_date >= new Date()).sort().map(elem => (
                        <EventField key={elem.uuid} webinarInfo={elem}/>
                    ))
                }
            </div>
            <p className="HeaderText">Past events</p>
            <div className="EventList">
                {
                    webinars.filter(elem => elem.start_date < new Date()).sort().map(elem => (
                        <EventField key={elem.uuid} webinarInfo={elem}/>
                    ))
                }
            </div>
        </div>
    );
}

export default EventsArea;