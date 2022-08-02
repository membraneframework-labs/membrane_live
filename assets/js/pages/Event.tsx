import React, { useEffect, useState } from "react";
import { Button, Heading, Center, Flex, Box, Spacer } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { Socket } from "phoenix";
import Popup from "../components/Popup";
import ControlPanel from "../components/ControlPanel";
import PresenterPopup from "../components/PresenterPopup";
import ParticipantsList from "../components/ParticipantsList";
import { createEventChannel, createPrivateChannel, getEventInfo } from "../utils/eventApi";
import PresenterPlayer from "../components/PresenterPlayer";

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

export const presenterStreams = {};  // TODO: type

const Event = () => {
  const [eventInfo, setEventInfo] = useState<EventInfo>(initEventInfo());
  const [presenterPopupState, setPresenterPopupState] = useState<PresenterPopupState>({
    isOpen: false,
    moderator: "",
  });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [streamsAvailable, setStreamsAvailable] = useState({});  // TODO: typing
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
    console.log("SADASDSADSA", streamsAvailable)
  }, [streamsAvailable])

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

  // TEMPORARY
  useEffect(() => {
    participants.forEach(participant => {
      if (participant.isPresenter && participant.name != eventInfo.username) {
        let video = document.getElementById("videocomponent" + participant.name)
        if (video != undefined) {
          video.srcObject = presenterStreams[participant.name];
          console.log(participant.name + "STREAM CONNECTED")
        }
      }
    })
  })

  const connectToChannels = (name: string): void => {
    if (eventChannel) eventChannel.leave();
    setEventChannel(socket.channel("event:" + eventInfo.link, { name: name }));
    if (privateChannel) privateChannel.leave();
    setPrivateChannel(socket.channel("private:" + eventInfo.link + ":" + name, {}));
  };

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
          {participants.map(participant => {
            console.log("NAME:", participant.name, "IS PRESENTER:", participant.isPresenter, "\nIS IN STREAMS AVAILABLE:", Object.hasOwn(streamsAvailable, participant.name), "\nSTREAM VALUE:", presenterStreams[participant.name])
            if (participant.isPresenter) {
              return <PresenterPlayer name={participant.name} key={participant.name} stream={presenterStreams[participant.name]}/>
            }
            return <h1 key={participant.name}>BRAK</h1>
          })}
          <ControlPanel />
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
          streamsAvailable={streamsAvailable}
          setStreamsAvailable={setStreamsAvailable}
        />
      ) : null}
    </>
  );
};

export default Event;
