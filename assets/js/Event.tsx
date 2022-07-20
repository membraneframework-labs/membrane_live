import React, { useEffect, useState } from "react";
import { Button, Heading, Center } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

type EventInfo = {
  link: string;
  title: string;
  description: string;
  start_date: string;
  presenters: string[];
  is_moderator: boolean;
};

const initEventInfo = () => {
  return {
    link: window.location.pathname.split("/")[2],
    title: "",
    description: "",
    start_date: "",
    presenters: [],
    is_moderator: false,
  };
};

const Event = () => {
  const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content");
  const navigate = useNavigate();
  const [eventInfo, setEventInfo] = useState<EventInfo>(initEventInfo());

  useEffect(() => {
    fetch("http://localhost:4000/webinars/" + eventInfo.link, {
      method: "get",
      headers: { "X-CSRF-TOKEN": csrfToken ? csrfToken : "" },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject(response.status);
      })
      .then((data) => {
        setEventInfo({ ...eventInfo, ...JSON.parse(data).webinar });
      })
      .catch(() => {
        alert("Couldn't get event information. Please reload this page.");
      });
  }, []);

  const handleExitButton = () => {
    navigate("/");
  };

  return (
    <>
      <Heading>{eventInfo.title}</Heading>
      <Center alignContent="center" bg="black" w="100%" height="50%" p={4} color="white">
        Please wait for the moderator to select a presenter
      </Center>
      <Button marginLeft="90%" colorScheme="red" size="lg" onClick={handleExitButton}>
        {" "}
        EXIT{" "}
      </Button>
    </>
  );
};

export default Event;
