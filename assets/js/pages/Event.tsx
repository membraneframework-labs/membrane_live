import React, { useEffect, useState, useMemo} from "react";
import { Button, Heading, Center, Flex, Box, Spacer } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { Socket } from "phoenix";
import Popup from "../components/Popup";
import ControlPanel from "../components/ControlPanel";
import PresenterPopup from "../components/PresenterPopup";
import ParticipantsList from "../components/ParticipantsList";
import { createEventChannel, createPrivateChannel, getEventInfo } from "../utils/eventApi";

export type EventInfo = {
  username: string;
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
    username: "",
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
  const socket = new Socket("/socket");
  socket.connect();

  useEffect(() => {
    getEventInfo(eventInfo, setEventInfo);
  }, []);

  useEffect(() => {
    if (eventChannel) {
      createEventChannel(eventChannel, popupState, setParticipants, setPopupState);
    }
  }, [eventChannel]);

  useEffect(() => {
    if (privateChannel) {
      createPrivateChannel(
        privateChannel,
        eventChannel,
        eventInfo.username,
        setPresenterPopupState
      );
    }
  }, [privateChannel]);

  const connectToChannels = (name: string): void => {
    if (eventChannel) eventChannel.leave();
    setEventChannel(socket.channel("event:" + eventInfo.link, { name: name }));
    if (privateChannel) privateChannel.leave();
    setPrivateChannel(socket.channel("private:" + eventInfo.link + ":" + name, {}));
  };

  const handleExitButton = (): void => {
    useNavigate()("/");
  };

  const isPresenter = useMemo( () => {
    const selfParticipant = participants.find(
      (participant) => participant.name == eventInfo.username
    );
    return selfParticipant?.isPresenter;
  }, [participants]);

  return (
    <>
      <Flex w="100vh">
        <Box w="50%">
          <Heading>{eventInfo.title}</Heading>
          <Center alignContent="center" bg="black" w="100%" height="50%" p={4} color="white">
            Please wait for the moderator to select a presenter
          </Center>
          {isPresenter ? <ControlPanel /> : null}
          <Button marginLeft="90%" colorScheme="red" size="lg" onClick={handleExitButton}>
            {" "}
            EXIT{" "}
          </Button>
        </Box>
        <Spacer />
        <ParticipantsList
          yourName={eventInfo.username}
          eventChannel={eventChannel}
          participants={participants}
          isModerator={eventInfo.isModerator}
        />
      </Flex>
      <Popup
        eventInfo={eventInfo}
        setEventInfo={setEventInfo}
        isOpen={popupState.isOpen}
        channelConnErr={popupState.channelConnErr}
        connectToChannels={connectToChannels}
      />
      {presenterPopupState.isOpen ? (
        <PresenterPopup
          moderator={presenterPopupState.moderator}
          name={eventInfo.username}
          setPopupState={setPresenterPopupState}
          eventChannel={eventChannel}
        />
      ) : null}
    </>
  );
};

export default Event;
