import React from "react";
import { Image } from '@chakra-ui/react'
import { WebinarInfo } from "../utils/dashboardUtils";
import { CalendarClock } from "react-swm-icon-pack";
import "../../css/eventsarea.css";

const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
];

type EventFieldProps = {
    webinarInfo: WebinarInfo;
}

const EventField = ({webinarInfo}: EventFieldProps) => {
    const formatDate = (date: Date) => {
        const time = 
            date
            .toLocaleTimeString()
            .replace(/^(\d+:\d\d)(:\d\d)(.*$)/, "$1$3");

        return `${monthNames[date.getMonth()]} ${date.getDay()}, ${date.getFullYear()} ${time}`;
    };

    return (
        <div className="EventField">
            <div className="EventImage">
                <Image src="https://source.unsplash.com/user/c_v_r/500x500" alt='Event Photo' />
            </div>
            <div className="InfoBox">
                <p className="EventPresenters">{webinarInfo.presenters.join(", ")}</p>
                <p className="EventTitle">{webinarInfo.title}</p>
                <p className="EventDescription">{webinarInfo.description}</p>
                <div className="EventDate">
                    <CalendarClock />
                    {formatDate(webinarInfo.start_date)}
                </div>
            </div>
        </div>
    );
}

export default EventField;