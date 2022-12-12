import React, { useEffect, useState } from "react";
import ParticipantsList from "../components/event/ParticipantsList";
import { Channel, Socket } from "phoenix";
import { createPrivateChannel, createEventChannel, getChannelId } from "../utils/channelUtils";
import Header from "../components/event/Header";
import {
  storageGetName,
  storageGetAuthToken,
  storageGetReloaded,
  storageSetReloaded,
  storageGetEmail,
  sessionStorageGetName,
  getIsAuthenticated,
} from "../utils/storageUtils";
import StreamArea from "../components/event/StreamArea";
import { useToast } from "@chakra-ui/react";
import { lastPersonPopup, presenterPopup } from "../utils/toastUtils";
import { useNavigate } from "react-router-dom";
import type { Client, Toast, Mode } from "../types/types";
import NamePopup from "../components/event/NamePopup";
import useCheckScreenType from "../utils/useCheckScreenType";
import "../../css/event/event.css";
import axiosWithInterceptor from "../services";
import { redirectToHomePage } from "../utils/headerUtils";

const Event = () => {
  const toast: Toast = useToast();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client>({
    name: storageGetName() || sessionStorageGetName(),
    email: storageGetEmail(),
    isModerator: false,
    isAuthenticated: getIsAuthenticated(),
  });
  const [eventChannel, setEventChannel] = useState<Channel>();
  const [privateChannel, setPrivateChannel] = useState<Channel>();
  const screenType = useCheckScreenType();
  const [mode, setMode] = useState<Mode>("hls");

  const socket = new Socket("/socket");
  socket.connect();

  useEffect(() => {
    const alreadyJoined = eventChannel?.state === "joined";

    if (!alreadyJoined && client.name) {
      const promise = client.isAuthenticated
        ? axiosWithInterceptor.get("/me").then(() => {
            return {
              token: storageGetAuthToken(),
              reloaded: storageGetReloaded(),
            };
          })
        : Promise.resolve({ username: client.name });

      promise.then((msg) => {
        const channel = socket.channel(`event:${getChannelId()}`, msg);
        createEventChannel(toast, client, channel, setEventChannel, setClient, navigate, (toast) =>
          lastPersonPopup(toast, client, channel, () => redirectToHomePage(navigate))
      );
      });
    }
  }, [eventChannel, client.name]);

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
        (toast, moderatorTopic: string) => presenterPopup(toast, client, eventChannel, moderatorTopic, setMode),
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
      {(screenType.device == "desktop" || screenType.orientation == "portrait") && (
        <Header client={client} eventChannel={eventChannel} isRecording={false} />
      )}
      {(screenType.device == "desktop" || screenType.orientation == "landscape") && (
        <div className="MainGrid">
          <StreamArea
            client={client}
            eventChannel={eventChannel}
            privateChannel={privateChannel}
            mode={mode}
            setMode={setMode}
          />
          {screenType.device == "desktop" && <ParticipantsList client={client} eventChannel={eventChannel} />}
        </div>
      )}
    </div>
  );
};

export default Event;
