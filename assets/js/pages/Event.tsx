import React, { useEffect, useState } from "react";
import ParticipantsList from "../components/ParticipantsList";
import NamePopup from "../components/NamePopup";
import { Socket } from "phoenix";
import { createPrivateChannel, createEventChannel, getChannelId } from "../utils/channelUtils";
import PresenterPopup from "../components/PresenterPopup";
import Header from "../components/Header";
import "../../css/event.css";
import StreamArea from "../components/StreamArea";

export type NamePopupState = {
  isOpen: boolean;
  channelConnErr: string;
};

export type PresenterPopupState = {
  isOpen: boolean;
  moderator: string;
};

const Event = () => {
  const [namePopupState, setNamePopupState] = useState<NamePopupState>({
    isOpen: true,
    channelConnErr: "",
  });
  const [presenterPopupState, setPresenterPopupState] = useState<PresenterPopupState>({
    isOpen: false,
    moderator: "",
  });
  const [name, setName] = useState<string>("");

  const [eventChannel, setEventChannel] = useState<any>();
  const [privateChannel, setPrivateChannel] = useState<any>();

  const socket = new Socket("/socket");
  socket.connect();

  useEffect(() => {
    const alreadyJoined = eventChannel?.state === "joined";
    if (name && !alreadyJoined) {
      const channel = socket.channel(`event:${getChannelId()}`, {
        name: name,
        isModerator: true,
      });
      createEventChannel(channel, namePopupState, setNamePopupState, setEventChannel);
    }
  }, [name, eventChannel]);

  useEffect(() => {
    const privateAlreadyJoined = privateChannel?.state === "joined";
    const eventAlreadyJoined = eventChannel?.state === "joined";
    if (name && !privateAlreadyJoined && eventAlreadyJoined) {
      const channel = socket.channel(`private:${getChannelId()}:${name}`, {});
      createPrivateChannel(channel, eventChannel, name, setPresenterPopupState, setPrivateChannel);
    }
  }, [name, eventChannel, privateChannel]);

  return (
    <div className="EventPage">
      <Header name={name} eventChannel={eventChannel}></Header>
      <div className="MainGrid">
        <StreamArea clientName={name} eventChannel={eventChannel} />
        <ParticipantsList clientName={name} isModerator={true} eventChannel={eventChannel} />
      </div>
      <NamePopup
        setName={setName}
        isOpen={namePopupState.isOpen}
        channelConnErr={namePopupState.channelConnErr}
      />
      {presenterPopupState.isOpen && (
        <PresenterPopup
          username={name}
          moderator={presenterPopupState.moderator}
          eventChannel={eventChannel}
          setPopupState={setPresenterPopupState}
        />
      )}
    </div>
  );
};

export default Event;
