import React, { useEffect, useState } from "react";
import PresenterStreamArea from "../components/PresenterStreamArea";
import ParticipantsList from "../components/ParticipantsList";
import NamePopup from "../components/NamePopup";
import { Socket } from "phoenix";
import { createPrivateChannel, createEventChannel, getChannelId } from "../utils/channelUtils";
import PresenterPopup from "../components/PresenterPopup";
import HLSPlayer from "../components/HlsPlayer";
import Header from "../components/Header";
import "../../css/event.css";

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
    <>
      <div className="Header">
        <Header name={name} eventChannel={eventChannel}></Header>
      </div>
      <div className="MainGrid">
        <div className="DisplayDiv">
          <div className="Mode"></div>
          <div className="Stream">
            <PresenterStreamArea clientName={name} eventChannel={eventChannel} />
            <HLSPlayer eventChannel={eventChannel} />
          </div>
        </div>
        <div className="Participants">
          <ParticipantsList username={name} isModerator={true} eventChannel={eventChannel} />
        </div>
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
    </>
  );
};

export default Event;
