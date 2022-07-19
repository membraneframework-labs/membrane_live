import React, { useEffect, useState } from "react";
import {Button, Heading } from "@chakra-ui/react";


type EventInfo = {
    link: string;
    title: string;
    description: string;
    start_date: string;
    presenters: string[];
    is_moderator: boolean;
}

const initEventInfo = () => {
    return {
        link: window.location.pathname.split("/")[2],
        title: "Mock title",
        description: "",
        start_date: "",
        presenters: [],
        is_moderator: false,
    }
}

const Event = () => {
    const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content");
    const [eventInfo, setEventInfo] = useState<EventInfo>(initEventInfo());
    
    useEffect(() => {
        fetch("http://localhost:4000/webinars/" + eventInfo.link, {
          method: "get",
          headers: { 'X-CSRF-TOKEN': csrfToken? csrfToken : "" },
        }).then((response) => {
          if (response.ok) {
            return response.json();
          }
          return Promise.reject(response.status);
        }).then((data) => {
          setEventInfo({...eventInfo, ...JSON.parse(data).webinar});
        }).catch(() => {
          alert("Couldn't get event information. Please reload this page.");
        });
    }, []);

    return (
        <>
        <Heading>{eventInfo.title}</Heading>
        <Button marginTop="100%" marginLeft="90%" colorScheme='red' size="lg"> EXIT </Button> 
        </>
    );
}

export default Event;