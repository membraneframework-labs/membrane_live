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
} from "../utils/storageUtils";
import "../../css/event.css";
import StreamArea from "../components/StreamArea";

export type PresenterPopupState = {
  isOpen: boolean;
  moderator: string;
};

const Event = () => {
  const name: string = storageGetName();
  const [isModerator, setIsModerator] = useState<boolean>(false);
  const [eventChannel, setEventChannel] = useState<any>();
  const [privateChannel, setPrivateChannel] = useState<any>();
  const [presenterPopupState, setPresenterPopupState] = useState<PresenterPopupState>({
    isOpen: false,
    moderator: "",
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
      createEventChannel(channel, setEventChannel, setIsModerator);
    }
  }, [eventChannel]);

  useEffect(() => {
    const privateAlreadyJoined = privateChannel?.state === "joined";
    const eventAlreadyJoined = eventChannel?.state === "joined";
    if (!privateAlreadyJoined && eventAlreadyJoined) {
      const channel = socket.channel(`private:${getChannelId()}:${name}`, {});
      createPrivateChannel(channel, eventChannel, name, setPresenterPopupState, setPrivateChannel);
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
      <Header name={name} eventChannel={eventChannel}></Header>
      <div className="MainGrid">
        <StreamArea clientName={name} eventChannel={eventChannel} />
        <ParticipantsList clientName={name} isModerator={isModerator} eventChannel={eventChannel} />
      </div>
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
