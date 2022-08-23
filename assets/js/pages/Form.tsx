import { useEffect, useState } from "react";
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
  Link,
} from "@chakra-ui/react";
import React from "react";
import { checkEventForm, sendEventForm } from "../utils/formApi";

export type EventForm = {
  title: string;
  description: string;
  start_date: string;
  presenters: string[];
};

export type Links = {
  viewer_link: string;
  moderator_link: string;
};

function Form() {
  const [links, setLinks] = useState<Links>();
  const [currParticipant, setCurrParticipant] = useState<string>("");
  const [eventForm, setEventForm] = useState<EventForm>({
    title: "",
    description: "",
    start_date: "",
    presenters: [],
  });

  const handleInputTitle = (event: any) =>
    setEventForm({ ...eventForm, title: event.target.value });
  const handleInputDescription = (event: any) =>
    setEventForm({ ...eventForm, description: event.target.value });
  const handleInputDate = (event: any) =>
    setEventForm({ ...eventForm, start_date: event.target.value });
  const handleInputParticipant = (event: any) => setCurrParticipant(event.target.value);
  const handleAddButton = () => {
    setEventForm({ ...eventForm, presenters: [...eventForm.presenters, currParticipant] });
    setCurrParticipant("");
  };
  const handleSendButton = () => {
    if (checkEventForm(eventForm)) {
      sendEventForm(eventForm, setLinks);
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
          {eventForm.presenters &&
            eventForm.presenters.map((presenter, idx) => (
              <ListItem key={idx}>{presenter}</ListItem>
            ))}
        </UnorderedList>
        <Button h="1.75rem" size="sm" onClick={handleSendButton}>
          Send
        </Button>
        {links ? (
          <>
            <Link href={links?.moderator_link}>Moderator link</Link>
            <Link href={links?.viewer_link}>Viewer link</Link>
          </>
        ) : null}
      </Stack>
    </Center>
  );
}

export default Form;
