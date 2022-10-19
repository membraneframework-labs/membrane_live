import React, { useEffect, useState } from "react";
import ParticipantsList from "../components/event/ParticipantsList";
import { Socket } from "phoenix";
import { createPrivateChannel, createEventChannel, getChannelId } from "../utils/channelUtils";
import Header from "../components/event/Header";
import {
  storageGetName,
  storageGetAuthToken,
  storageGetReloaded,
  storageSetReloaded,
  storageGetEmail,
  sessionStorageGetName,
} from "../utils/storageUtils";
import StreamArea from "../components/event/StreamArea";
import { useToast } from "@chakra-ui/react";
import { presenterPopup } from "../utils/toastUtils";
import type { Client } from "../types";
import NamePopup from "../components/event/NamePopup";
import "../../css/event/event.css";

const Event = () => {
  const toast = useToast();
  const [client, setClient] = useState<Client>({
    name: storageGetName() || sessionStorageGetName(),
    email: storageGetEmail(),
    isModerator: false,
    isAuthenticated: storageGetAuthToken() ? true : false,
  });
  const [eventChannel, setEventChannel] = useState<any>();
  const [privateChannel, setPrivateChannel] = useState<any>();
  const isAuthenticated = storageGetAuthToken() ? true : false;
  const socket = new Socket("/socket");
  socket.connect();

  useEffect(() => {
    const alreadyJoined = eventChannel?.state === "joined";
    if (!alreadyJoined && client.name) {
      const channelMsg = isAuthenticated
        ? {
            token: storageGetAuthToken(),
            reloaded: storageGetReloaded(),
          }
        : { username: client.name };
      const channel = socket.channel(`event:${getChannelId()}`, channelMsg);
      createEventChannel(toast, client, channel, setEventChannel, setClient);
    }
  }, [eventChannel, client.name]);

  useEffect(() => {
    const privateAlreadyJoined = privateChannel?.state === "joined";
    const eventAlreadyJoined = eventChannel?.state === "joined";
    if (!privateAlreadyJoined && eventAlreadyJoined && isAuthenticated) {
      const channel = socket.channel(`private:${getChannelId()}:${client.email}`, {});
      createPrivateChannel(
        toast,
        channel,
        eventChannel,
        client,
        (toast, moderatorTopic: string) =>
          presenterPopup(toast, client, eventChannel, moderatorTopic),
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
      {!client.name && <NamePopup client={client} setClient={setClient}></NamePopup>}
      <Header client={client} eventChannel={eventChannel}></Header>
      <div className="MainGrid">
        <StreamArea client={client} eventChannel={eventChannel} privateChannel={privateChannel} />
        <ParticipantsList client={client} eventChannel={eventChannel} />
      </div>
    </div>
  );
};

export default Event;
