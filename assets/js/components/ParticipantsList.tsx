import React, { useEffect, useState } from "react";
import { Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { syncEventChannel } from "../utils/channelUtils";
import "../../css/participants.css";
import {MenuVertical, User1, Crown1, Star1} from "react-swm-icon-pack";

export type Participant = {
  name: string;
  isPresenter: boolean;
  isModerator: boolean;
};

type ModeratorMenuProps = {
  username: string;
  name: string;
  isPresenter: boolean;
  eventChannel: any;
};

type ParticipantProps = {
  username: string;
  name: string;
  isPresenter: boolean;
  isModerator: boolean;
  moderatorMode: boolean;
  eventChannel: any;
};

type ParticipantsListProps = {
  username: string;
  isModerator: boolean;
  eventChannel: any;
};

const ModeratorMenu = ({ username, name, isPresenter, eventChannel }: ModeratorMenuProps) => {
  const handleClick = (e: any) => {
    if (e.target.value === "Set as a presenter") {
      const link = "private:" + window.location.pathname.split("/")[2] + ":";
      eventChannel.push("presenter_prop", { moderator: link + username, presenter: link + name });
    } else {
      const link = "private:" + window.location.pathname.split("/")[2] + ":";
      eventChannel.push("presenter_remove", { presenter_topic: link + name });
    }
  };

  return (
    <Menu>
      <MenuButton ml={"auto"} area-label="Options">
        <MenuVertical className="OptionButton"/>
      </MenuButton>
      <MenuList>
        <MenuItem
          onClick={handleClick}
          value={isPresenter ? "Set as a normal participant" : "Set as a presenter"}
        >
          {isPresenter ? "Set as a normal participant" : "Set as a presenter"}
        </MenuItem>
        <MenuItem value="Mute">Mute</MenuItem>
        <MenuItem value="Kick">Kick</MenuItem>
      </MenuList>
    </Menu>
  );
};

const Participant = ({
  username,
  name,
  isModerator,
  isPresenter,
  moderatorMode,
  eventChannel,
}: ParticipantProps) => {
  const icon = isModerator ? <Crown1/> : isPresenter ? <Star1/> : <User1/>;
  return (
    <div className="Participant">
      {icon}
      <p className="ParticipantText">
        {" "}
        {name} {isPresenter && " (Presenter)"}
      </p>
      {moderatorMode && (
        <ModeratorMenu
          username={username}
          eventChannel={eventChannel}
          isPresenter={isPresenter}
          name={name}
        />
      )}
    </div>
  );
};

const ParticipantsList = ({ username, isModerator, eventChannel }: ParticipantsListProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [listMode, setListMode] = useState<boolean>(true);

  useEffect(() => {
    syncEventChannel(eventChannel, setParticipants);
  }, [eventChannel]);

  let parts: JSX.Element[] = [];
  participants.map((participant) =>
    parts.push(
      <Participant
        username={username}
        key={participant.name}
        name={participant.name}
        isModerator={participant.isModerator}
        isPresenter={participant.isPresenter}
        moderatorMode={isModerator}
        eventChannel={eventChannel}
      />
    )
  );

  return (
    <div className="Participants">
      <div className="ParticipantsButtons">
        <button
          className={`ParticipantsButton ${!listMode && "Clicked"}`}
          onClick={() => setListMode(false)}
          name="chat"
        >
          Group Chat
        </button>
        <button
          className={`ParticipantsButton ${listMode && "Clicked"}`}
          name="list"
          onClick={() => setListMode(true)}
        >
          Participants
        </button>
      </div>
      {listMode && <div className="ParticipantsList">{parts}</div>}
    </div>
  );
};

export default ParticipantsList;
