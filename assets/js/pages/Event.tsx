import React, { useEffect, useState } from "react";
import { Button, Heading, Center, Flex, Box, Spacer } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { Socket } from "phoenix";
import Popup from "../components/Popup";
import ControlPanel from "../components/ControlPanel";
import PresenterPopup from "../components/PresenterPopup";
import ParticipantsList from "../components/ParticipantsList";
import { createEventChannel, createPrivateChannel, getEventInfo } from "../utils/eventApi";
import HLSPlayer from "../components/Player";

export type EventInfo = {
  link: string;
  title: string;
  description: string;
  start_date: string;
  presenters: string[];
  isModerator: boolean;
};

export type PopupState = {
  isOpen: boolean;
  channelConnErr: string;
};

export type PresenterPopupState = {
  isOpen: boolean;
  moderator: string;
};

export type Participant = {
  name: string;
  isPresenter: boolean;
};

const initEventInfo = () => {
  return {
    link: window.location.pathname.split("/")[2],
    title: "",
    description: "",
    start_date: "",
    presenters: [],
    isModerator: window.location.pathname.split("/")[3] != undefined,
  };
};

const Event = () => {
  const [eventInfo, setEventInfo] = useState<EventInfo>(initEventInfo());
  const [presenterPopupState, setPresenterPopupState] = useState<PresenterPopupState>({
    isOpen: false,
    moderator: "",
  }); // will be triggered with call from server
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [eventChannel, setEventChannel] = useState<any>();
  const [privateChannel, setPrivateChannel] = useState<any>();
  const [popupState, setPopupState] = useState<PopupState>({ isOpen: true, channelConnErr: "" });
  const [name, setName] = useState<string>("");
  const socket = new Socket("/socket");
  socket.connect();

  useEffect(() => {
    getEventInfo(eventInfo, setEventInfo);
  }, []);

  useEffect(() => {
    const alreadyJoined = eventChannel?.state === "joined";
    if (name && !alreadyJoined){
        const channel = socket.channel("event:" + eventInfo.link, { name: name });
        createEventChannel(channel, popupState, setParticipants, setPopupState, setEventChannel);
    }
  }, [name, eventChannel]);

  useEffect(() => {
    const alreadyJoined = privateChannel?.state === "joined";
    if (name && !alreadyJoined){
        const channel = socket.channel("private:" + eventInfo.link + ":" + name, {});
        createPrivateChannel(
          channel,
          eventChannel,
          name,
          setPresenterPopupState,
          setPrivateChannel,
        );
    }
  }, [name, eventChannel, privateChannel]);

  const handleExitButton = (): void => {
    useNavigate()("/");
  };

  return (
    <>
      <Flex w="100vh">
        <Box w="50%">
          <Heading>{eventInfo.title}</Heading>
          <Center alignContent="center" bg="black" w="100%" height="50%" p={4} color="white">
            Please wait for the moderator to select a presenter
          </Center>
          <ControlPanel />
          <Button marginLeft="90%" colorScheme="red" size="lg" onClick={handleExitButton}>
            {" "}
            EXIT{" "}
          </Button>
        </Box>
        <Spacer />
        <ParticipantsList
          yourName={name}
          eventChannel={eventChannel}
          participants={participants}
          isModerator={eventInfo.isModerator}
        />
      </Flex>
      <Popup
        setName={setName}
        isOpen={popupState.isOpen}
        channelConnErr={popupState.channelConnErr}
      />
      {presenterPopupState.isOpen &&
        <PresenterPopup
          moderator={presenterPopupState.moderator}
          name={name}
          setPopupState={setPresenterPopupState}
          eventChannel={eventChannel}
        />
      }
      <HLSPlayer eventChannel={eventChannel} />
    </>
  );
};

export default Event;
