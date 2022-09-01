import React, { useEffect, useState } from "react";
import ParticipantsList from "../components/ParticipantsList";
import { Socket } from "phoenix";
import { createPrivateChannel, createEventChannel, getChannelId } from "../utils/channelUtils";
import PresenterPopup from "../components/PresenterPopup";
import Header from "../components/Header";
import {
  storageGetName,
  storageGetAuthToken,
  storageGetReloaded,
  storageSetReloaded,
  storageGetEmail,
} from "../utils/storageUtils";
import "../../css/event.css";
import StreamArea from "../components/StreamArea";

export type PresenterPopupState = {
  isOpen: boolean;
  moderatorTopic: string;
};

export type Client = {
  name: string;
  email: string;
  isModerator: boolean;
};

const Event = () => {
  const [client, setClient] = useState<Client>({
    name: storageGetName(),
    email: storageGetEmail(),
    isModerator: false,
  });
  const [eventChannel, setEventChannel] = useState<any>();
  const [privateChannel, setPrivateChannel] = useState<any>();
  const [presenterPopupState, setPresenterPopupState] = useState<PresenterPopupState>({
    isOpen: false,
    moderatorTopic: "",
  });

  const socket = new Socket("/socket");
  socket.connect();

  useEffect(() => {
    const alreadyJoined = eventChannel?.state === "joined";
    if (!alreadyJoined) {
      const channel = socket.channel(`event:${getChannelId()}`, {
        token: storageGetAuthToken(),
        reloaded: storageGetReloaded(),
      });
      createEventChannel(client, channel, setEventChannel, setClient);
    }
  }, [eventChannel]);

  useEffect(() => {
    const privateAlreadyJoined = privateChannel?.state === "joined";
    const eventAlreadyJoined = eventChannel?.state === "joined";
    if (!privateAlreadyJoined && eventAlreadyJoined) {
      const channel = socket.channel(`private:${getChannelId()}:${client.email}`, {});
      createPrivateChannel(
        channel,
        eventChannel,
        client,
        setPresenterPopupState,
        setPrivateChannel
      );
    }
  }, [eventChannel, privateChannel]);

  useEffect(() => {
    window.addEventListener("beforeunload", storageSetReloaded);
    return () => {
      window.removeEventListener("beforeunload", storageSetReloaded);
    };
  }, []);

  return (
    <div className="EventPage">
      <Header client={client} eventChannel={eventChannel}></Header>
      <div className="MainGrid">
        <StreamArea client={client} eventChannel={eventChannel} privateChannel={privateChannel} />
        <ParticipantsList client={client} eventChannel={eventChannel} />
      </div>
      {presenterPopupState.isOpen && (
        <PresenterPopup
          client={client}
          moderatorTopic={presenterPopupState.moderatorTopic}
          eventChannel={eventChannel}
          setPopupState={setPresenterPopupState}
        />
      )}
    </div>
  );
};

export default Event;
