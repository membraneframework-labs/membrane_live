import { useState } from "react";
import {
  Button,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Textarea,
  UnorderedList,
  ListItem,
  Center,
} from "@chakra-ui/react";
import React from "react";

type EventInfo = {
  title: string;
  description: string;
  start_date: string;
  presenters: string[];
};

type Links = {
  viewer_link: string;
  moderator_link: string;
};

function Form() {
  const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content");
  const [links, setLinks] = useState<Links>();
  const [currParticipant, setCurrParticipant] = useState<string>("");
  const [eventInfo, setEventInfo] = useState<EventInfo>({
    title: "",
    description: "",
    start_date: "",
    presenters: [],
  });

  const handleInputTitle = (event: any) =>
    setEventInfo({ ...eventInfo, title: event.target.value });
  const handleInputDescription = (event: any) =>
    setEventInfo({ ...eventInfo, description: event.target.value });
  const handleInputDate = (event: any) =>
    setEventInfo({ ...eventInfo, start_date: event.target.value });
  const handleInputParticipant = (event: any) => setCurrParticipant(event.target.value);
  const handleAddButton = () => {
    setEventInfo({ ...eventInfo, presenters: [...eventInfo.presenters, currParticipant] });
    setCurrParticipant("");
  };

  const checkEventInfo = (): boolean => {
    return eventInfo.start_date != "" && eventInfo.title != "";
  };

  const sendEventInfo = (): void => {
    fetch("http://localhost:4000/webinars", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-TOKEN": csrfToken ? csrfToken : "",
      },
      body: JSON.stringify({ webinar: eventInfo }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject(response.status);
      })
      .then((data) => {
        setLinks(JSON.parse(data).webinar_links);
      })
      .catch((error) => {
        alert("Something went wrong. Please try again in a moment.");
        console.log(error);
      });
  };

  const handleSendButton = () => {
    if (checkEventInfo()) {
      sendEventInfo();
    } else {
      alert("Fields title and date are necessary to create an event.");
    }
  };

  return (
    <Center height="100vh">
      <Stack spacing={4} width="50rem">
        <Input type="text" placeholder="Title" size="lg" onChange={handleInputTitle} />
        <Textarea placeholder="Description" onChange={handleInputDescription} />
        <Input
          placeholder="Select Date and Time"
          size="md"
          backgroundColor="#ffffff"
          type="datetime-local"
          onChange={handleInputDate}
        />
        <InputGroup size="md">
          <Input
            pr="4.5rem"
            type="text"
            placeholder="Enter participant"
            value={currParticipant}
            onChange={handleInputParticipant}
          />
          <InputRightElement width="4.5rem">
            <Button h="1.75rem" size="sm" onClick={handleAddButton}>
              Add
            </Button>
          </InputRightElement>
        </InputGroup>
        <UnorderedList>
          {eventInfo.presenters &&
            eventInfo.presenters.map((presenter, idx) => (
              <ListItem key={idx}>{presenter}</ListItem>
            ))}
        </UnorderedList>
        <Button h="1.75rem" size="sm" onClick={handleSendButton}>
          Send
        </Button>
      </Stack>
    </Center>
  );
}

export default Form;
