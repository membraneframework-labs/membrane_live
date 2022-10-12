import React, { useEffect, useState } from "react";
import { Menu, MenuButton, MenuList, MenuItem, Tooltip } from "@chakra-ui/react";
import { syncEventChannel } from "../../utils/channelUtils";
import { MenuVertical, User1, Crown1, Star1, QuestionCircle } from "react-swm-icon-pack";
import type { Participant, Client } from "../../types";
import "../../../css/event/participants.css";

type ModeratorMenuProps = {
  moderatorClient: Client;
  participant: Participant;
  eventChannel: any;
};

type ClientParticipantMenuProps = {
  participant: Participant;
  eventChannel: any;
};


const ModeratorMenu = ({ moderatorClient, participant, eventChannel }: ModeratorMenuProps) => {
  const link = "private:" + window.location.pathname.split("/")[2] + ":";

  const handleClick = (e: any) => {
    if (e.target.value === "Set as a presenter") {
      eventChannel.push("presenter_prop", {
        moderatorTopic: link + moderatorClient.email,
        presenterTopic: link + participant.email,
      });
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
          onClick={handleClick}
          value={participant.isPresenter ? "Set as a normal participant" : "Set as a presenter"}
          className="MenuOptionText"
        >
          {participant.isPresenter ? "Set as a normal participant" : "Set as a presenter"}
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

const ClientParticipantMenu = ({ participant, eventChannel }: ClientParticipantMenuProps) => {
  const handleClick = (e: any) => {
    if (e.target.value === "Ask to become presenter") {
      eventChannel.push("presenting_request", {
        email: participant.email,
      });
    } else {
      eventChannel.push("cancel_presenting_request", { email: participant.email });
    }
  };

  const text = participant.requestPresenting ? "Stop asking to become presenter" : "Ask to become presenter"

  return (
    <Menu>
      <MenuButton ml={"auto"} area-label="Options">
        <MenuVertical className="OptionButton" />
      </MenuButton>
      <MenuList>
        <MenuItem
          onClick={handleClick}
          value={text}
          className="MenuOptionText"
        >
          {text}
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

type ParticipantProps = {
  client: Client;
  participant: Participant;
  eventChannel: any;
};

const Participant = ({ client, participant, eventChannel }: ParticipantProps) => {
  const icon = participant.isModerator ? (
    <Crown1 className="ParticipantIcon" />
  ) : participant.isPresenter ? (
    <Star1 className="ParticipantIcon" />
  ) : (
    <User1 className="ParticipantIcon" />
  );
  const role = participant.isModerator
    ? "Moderator"
    : participant.isPresenter
      ? "Presenter"
      : "Participant";

  const isClientPariticipant: Boolean = client.name == participant.name;


  return (
    <div className="Participant">
      <Tooltip
        label={`${role}${isClientPariticipant ? " (You)" : ""}`}
        borderRadius="25px"
        fontSize={"1.3rem"}
        className="InfoTooltip"
      >
        {icon}
      </Tooltip>
      <p className="ParticipantText">{participant.name}</p>
      {participant.requestPresenting && <Tooltip
        label={`${role}${isClientPariticipant ? " (You)" : ""}`}
        borderRadius="25px"
        fontSize={"1.3rem"}
        className="InfoTooltip"
      >
        <QuestionCircle className="ParticipantIcon" />
      </Tooltip>
      }
      {client.isModerator && (
        <ModeratorMenu
          moderatorClient={client}
          eventChannel={eventChannel}
          participant={participant}
        />
      )}
      {!client.isModerator && role == "Participant" && isClientPariticipant && (
        <ClientParticipantMenu
          eventChannel={eventChannel}
          participant={participant}
        />
      )}
    </div>
  );
};

type ParticipantsListProps = {
  client: Client;
  eventChannel: any;
};

const ParticipantsList = ({ client, eventChannel }: ParticipantsListProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [listMode, setListMode] = useState<boolean>(true);


  useEffect(() => {
    syncEventChannel(eventChannel, setParticipants, client.email);
  }, [eventChannel]);

  let parts: JSX.Element[] = [];
  participants.map((participant) =>
    parts.push(
      <Participant
        client={client}
        key={participant.email}
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
