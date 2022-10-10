import React, { useEffect, useState } from "react";
import { Menu, MenuButton, MenuList, MenuItem, Tooltip } from "@chakra-ui/react";
import { syncEventChannel } from "../../utils/channelUtils";
import { MenuVertical, User1, Crown1, Star1 } from "react-swm-icon-pack";
import type { Participant, Client } from "../../types";
import "../../../css/event/participants.css";

type ModeratorMenuProps = {
  moderatorClient: Client;
  participant: Participant;
  eventChannel: any;
};

const ModeratorMenu = ({ moderatorClient, participant, eventChannel }: ModeratorMenuProps) => {
  const link = "private:" + window.location.pathname.split("/")[2] + ":";

  const handleSetAsPresenterClick = (e: any) => {
    if (e.target.value === "Set as a presenter") {
      eventChannel.push("presenter_prop", {
        moderatorTopic: link + moderatorClient.email,
        presenterTopic: link + participant.email,
      });
    } else {
      eventChannel.push("presenter_remove", { presenterTopic: link + participant.email });
    }
  };

  const handleSetAsCurrentClick = (e: any) => {
    const setTo = e.target.value === "Set as a currently streaming";
    eventChannel.push("currently_streaming", {
      email: participant.email,
      setTo: setTo,
    });
  };

  return (
    <Menu>
      <MenuButton ml={"auto"} area-label="Options">
        <MenuVertical className="OptionButton" />
      </MenuButton>
      <MenuList>
        <MenuItem
          onClick={handleSetAsPresenterClick}
          value={participant.isPresenter ? "Set as a normal participant" : "Set as a presenter"}
          className="MenuOptionText"
        >
          {participant.isPresenter ? "Set as a normal participant" : "Set as a presenter"}
        </MenuItem>
        {participant.isPresenter && (
          <MenuItem
            onClick={handleSetAsCurrentClick}
            value={
              participant.isCurrentlyStreaming
                ? "Remove as a currently streaming"
                : "Set as a currently streaming"
            }
            className="MenuOptionText"
          >
            {participant.isCurrentlyStreaming
              ? "Remove as a currently streaming"
              : "Set as a currently streaming"}
          </MenuItem>
        )}
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
    : "Praticipant";

  return (
    <div className="Participant">
      <Tooltip
        label={`${role}${client.name == participant.name ? " (You)" : ""}`}
        borderRadius="25px"
        fontSize={"1.3rem"}
        className="InfoTooltip"
      >
        {icon}
      </Tooltip>
      <p className="ParticipantText">{participant.name}</p>
      {client.isModerator && (
        <ModeratorMenu
          moderatorClient={client}
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
    syncEventChannel(eventChannel, setParticipants);
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
