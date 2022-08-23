import React, { useEffect, useState } from "react";
import { Menu, MenuButton, MenuList, MenuItem, Tooltip } from "@chakra-ui/react";
import { syncEventChannel } from "../utils/channelUtils";
import "../../css/participants.css";
import { MenuVertical, User1, Crown1, Star1 } from "react-swm-icon-pack";

export type Participant = {
  name: string;
  isPresenter: boolean;
  isModerator: boolean;
};

type ModeratorMenuProps = {
  clientName: string;
  name: string;
  isPresenter: boolean;
  eventChannel: any;
};

type ParticipantProps = {
  clientName: string;
  name: string;
  isPresenter: boolean;
  isModerator: boolean;
  moderatorMode: boolean;
  eventChannel: any;
};

type ParticipantsListProps = {
  clientName: string;
  isModerator: boolean;
  eventChannel: any;
};

const ModeratorMenu = ({ clientName, name, isPresenter, eventChannel }: ModeratorMenuProps) => {
  const style = getComputedStyle(document.body);
  const fontColor = style.getPropertyValue("--font-dark-color");

  const handleClick = (e: any) => {
    console.log(e.target.value);
    if (e.target.value === "Set as a presenter") {
      const link = "private:" + window.location.pathname.split("/")[2] + ":";
      eventChannel.push("presenter_prop", { moderator: link + clientName, presenter: link + name });
    } else {
      const link = "private:" + window.location.pathname.split("/")[2] + ":";
      eventChannel.push("presenter_remove", { presenter_topic: link + name });
    }
  };

  return (
    <Menu>
      <MenuButton ml={"auto"} area-label="Options">
        <MenuVertical className="OptionButton" />
      </MenuButton>
      <MenuList>
        <MenuItem
          color={fontColor}
          onClick={handleClick}
          value={isPresenter ? "Set as a normal participant" : "Set as a presenter"}
        >
          {isPresenter ? "Set as a normal participant" : "Set as a presenter"}
        </MenuItem>
        <MenuItem color={fontColor} value="Mute">
          Mute
        </MenuItem>
        <MenuItem color={fontColor} value="Kick">
          Kick
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

const Participant = ({
  clientName,
  name,
  isModerator,
  isPresenter,
  moderatorMode,
  eventChannel,
}: ParticipantProps) => {
  const style = getComputedStyle(document.body);
  const fontColor = style.getPropertyValue("--font-dark-color");

  const icon = isModerator ? <Crown1 /> : isPresenter ? <Star1 /> : <User1 />;
  const role = isModerator ? "Moderator" : isPresenter ? "Presenter" : "Praticipant";

  return (
    <div className="Participant">
      <Tooltip
        label={`${role}${clientName == name ? " (You)" : ""}`}
        bg={fontColor}
        borderRadius="25px"
      >
        {icon}
      </Tooltip>
      <p className="ParticipantText">{name}</p>
      {moderatorMode && (
        <ModeratorMenu
          clientName={clientName}
          eventChannel={eventChannel}
          isPresenter={isPresenter}
          name={name}
        />
      )}
    </div>
  );
};

const ParticipantsList = ({ clientName, isModerator, eventChannel }: ParticipantsListProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [listMode, setListMode] = useState<boolean>(true);

  useEffect(() => {
    syncEventChannel(eventChannel, setParticipants);
  }, [eventChannel]);

  let parts: JSX.Element[] = [];
  participants.map((participant) =>
    parts.push(
      <Participant
        clientName={clientName}
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
