import React, { useEffect, useState } from "react";
import { Menu, MenuButton, MenuList, MenuItem, Tooltip } from "@chakra-ui/react";
import { syncEventChannel } from "../utils/channelUtils";
import { MenuVertical, User1, Crown1, Star1 } from "react-swm-icon-pack";
import { getFontColor } from "../utils/styleUtils";
import "../../css/participants.css";
import { Client } from "../pages/Event";

export type Participant = {
  email: string;
  name: string;
  isPresenter: boolean;
  isModerator: boolean;
};

type ModeratorMenuProps = {
  client: Client;
  participant: Participant;
  eventChannel: any;
};

type ParticipantProps = {
  client: Client;
  participant: Participant;
  eventChannel: any;
};

type ParticipantsListProps = {
  client: Client;
  eventChannel: any;
};

const ModeratorMenu = ({ client, participant, eventChannel }: ModeratorMenuProps) => {
  const fontColor = getFontColor("--font-dark-color");
  const link = "private:" + window.location.pathname.split("/")[2] + ":";

  const handleClick = (e: any) => {
    if (e.target.value === "Set as a presenter") {
      eventChannel.push("presenter_prop", { moderatorTopic: link + client.email, presenterTopic: link + participant.email });
    } else {
      eventChannel.push("presenter_remove", { presenterTopic: link + participant.email });
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
          value={participant.isPresenter ? "Set as a normal participant" : "Set as a presenter"}
        >
          {participant.isPresenter ? "Set as a normal participant" : "Set as a presenter"}
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
  client,
  participant,
  eventChannel,
}: ParticipantProps) => {
  const fontColor = getFontColor("--font-dark-color");

  const icon = participant.isModerator ? <Crown1 /> : participant.isPresenter ? <Star1 /> : <User1 />;
  const role = participant.isModerator ? "Moderator" : participant.isPresenter ? "Presenter" : "Praticipant";

  return (
    <div className="Participant">
      <Tooltip
        label={`${role}${client.name == participant.name ? " (You)" : ""}`}
        bg={fontColor}
        borderRadius="25px"
      >
        {icon}
      </Tooltip>
      <p className="ParticipantText">{participant.name}</p>
      {client.isModerator && (
        <ModeratorMenu
          client={client}
          eventChannel={eventChannel}
          participant={participant}
        />
      )}
    </div>
  );
};

const ParticipantsList = ({ client, eventChannel }: ParticipantsListProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [listMode, setListMode] = useState<boolean>(true);

  useEffect(() => {
    syncEventChannel(eventChannel, setParticipants);
  }, [eventChannel]);

  let parts: JSX.Element[] = [];
  participants.map((participant) =>
    parts.push(
      <Participant
        client={client}
        key={participant.name}
        participant={participant}
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
