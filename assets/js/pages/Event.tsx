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
} from "../utils/storageUtils";
import StreamArea from "../components/event/StreamArea";
import { useToast } from "@chakra-ui/react";
import { presenterPopup } from "../utils/toastUtils";
import { useNavigate } from "react-router-dom";
import type { Client } from "../types";
import "../../css/event/event.css";

const Event = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client>({
    name: storageGetName(),
    email: storageGetEmail(),
    isModerator: false,
  });
  const [eventChannel, setEventChannel] = useState<any>();
  const [privateChannel, setPrivateChannel] = useState<any>();

  const socket = new Socket("/socket");
  socket.connect();

  useEffect(() => {
    const alreadyJoined = eventChannel?.state === "joined";
    if (!alreadyJoined) {
      const channel = socket.channel(`event:${getChannelId()}`, {
        token: storageGetAuthToken(),
        reloaded: storageGetReloaded(),
      });
      createEventChannel(toast, client, channel, setEventChannel, setClient, navigate);
    }
  }, [eventChannel]);

  useEffect(() => {
    const privateAlreadyJoined = privateChannel?.state === "joined";
    const eventAlreadyJoined = eventChannel?.state === "joined";
    if (!privateAlreadyJoined && eventAlreadyJoined) {
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
      <Header client={client} eventChannel={eventChannel} isRecording={false}></Header>
      <div className="MainGrid">
        <StreamArea client={client} eventChannel={eventChannel} privateChannel={privateChannel} />
        <ParticipantsList client={client} eventChannel={eventChannel} />
      </div>
    </div>
  );
};

export default Event;
