import React, { useEffect, useState } from "react";
import { Menu, MenuButton, MenuList, MenuItem, Tooltip } from "@chakra-ui/react";
import { syncEventChannel } from "../../utils/channelUtils";
import { MenuVertical, User1, Crown1, Star1, QuestionCircle } from "react-swm-icon-pack";
import type { Participant, Client } from "../../types/types";
import { Channel } from "phoenix";
import ChatBox from "./ChatBox";
import { useChatMessages } from "../../utils/useChatMessages";
import "../../../css/event/participants.css";

type ModeratorMenuProps = {
  moderatorClient: Client;
  participant: Participant;
  eventChannel: Channel | undefined;
};

const ModeratorMenu = ({ moderatorClient, participant, eventChannel }: ModeratorMenuProps) => {
  const link = "private:" + window.location.pathname.split("/")[2] + ":";
  const presenterText = {
    set: "Set as a presenter",
    unset: "Set as a normal participant",
  };
  const banFromChatText = {
    ban: "Ban from the chat",
    unban: "Unban from the chat",
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    switch ((e.target as HTMLTextAreaElement).value) {
      case presenterText.set:
        eventChannel?.push("presenter_prop", {
          moderatorTopic: link + moderatorClient.email,
          presenterTopic: link + participant.email,
        });
        break;
      case presenterText.unset:
        eventChannel?.push("presenter_remove", { presenterTopic: link + participant.email });
        break;
      case banFromChatText.ban:
        eventChannel?.push("ban_from_chat", { email: participant.email });
        break;
      case banFromChatText.unban:
        eventChannel?.push("unban_from_chat", { email: participant.email });
        break;
    }
  };

  return (
    <Menu>
      <MenuButton ml={"auto"} area-label="Options">
        <MenuVertical className="OptionButton" />
      </MenuButton>
      <MenuList>
        {participant.isAuth && (
          <MenuItem
            onClick={handleClick}
            value={participant.isPresenter ? presenterText.unset : presenterText.set}
            className="MenuOptionText"
          >
            {participant.isPresenter ? presenterText.unset : presenterText.set}
          </MenuItem>
        )}
        {!participant.isModerator && (
          <MenuItem
            onClick={handleClick}
            value={participant.isBannedFromChat ? banFromChatText.unban : banFromChatText.ban}
            className="MenuOptionText"
          >
            {participant.isBannedFromChat ? banFromChatText.unban : banFromChatText.ban}
          </MenuItem>
        )}
      </MenuList>
    </Menu>
  );
};

type ClientParticipantMenuProps = {
  participant: Participant;
  eventChannel: Channel | undefined;
};

const ClientParticipantMenu = ({ participant, eventChannel }: ClientParticipantMenuProps) => {
  const askText = "Ask to become a presenter";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if ((e.target as HTMLTextAreaElement).value === askText) {
      eventChannel?.push("presenting_request", {
        email: participant.email,
      });
    } else {
      eventChannel?.push("cancel_presenting_request", { email: participant.email });
    }
  };

  const text = participant.isRequestPresenting ? "Stop asking to become a presenter" : askText;

  return (
    <Menu>
      <MenuButton ml={"auto"} area-label="Options">
        <MenuVertical className="OptionButton" />
      </MenuButton>
      <MenuList>
        <MenuItem onClick={handleClick} value={text} className="MenuOptionText">
          {text}
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

type ParticipantProps = {
  client: Client;
  participant: Participant;
  eventChannel: Channel | undefined;
};

const Participant = ({ client, participant, eventChannel }: ParticipantProps) => {
  const icon = participant.isModerator ? (
    <Crown1 className="ParticipantIcon" />
  ) : participant.isPresenter ? (
    <Star1 className="ParticipantIcon" />
  ) : (
    <User1 className="ParticipantIcon" />
  );
  const role = participant.isModerator ? "Moderator" : participant.isPresenter ? "Presenter" : "Participant";

  const isMyself: boolean = client.email == participant.email;
  const isMyselfParticipant = client.isAuthenticated && role == "Participant" && isMyself;

  return (
    <div className="Participant">
      <Tooltip label={`${role}${isMyself ? " (You)" : ""}`} className="InfoTooltip">
        {icon}
      </Tooltip>
      <p className="ParticipantText">{participant.name}</p>
      {participant.isRequestPresenting && (client.isModerator || isMyself) && (
        <Tooltip label={"This user is asking to become a presenter"} className="InfoTooltip">
          <QuestionCircle className="ParticipantIcon" />
        </Tooltip>
      )}
      {client.isModerator && (
        <ModeratorMenu moderatorClient={client} eventChannel={eventChannel} participant={participant} />
      )}
      {isMyselfParticipant && <ClientParticipantMenu eventChannel={eventChannel} participant={participant} />}
    </div>
  );
};

type ParticipantsListProps = {
  client: Client;
  eventChannel: Channel | undefined;
};

const ParticipantsList = ({ client, eventChannel }: ParticipantsListProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [listMode, setListMode] = useState<boolean>(false);
  const chatMessages = useChatMessages(eventChannel);
  const [isBannedFromChat, setIsBannedFromChat] = useState(false);

  useEffect(() => {
    if (eventChannel) {
      syncEventChannel(eventChannel, setParticipants, setIsBannedFromChat, client.email);
    }
  }, [eventChannel]);

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
        <button className={`ParticipantsButton ${listMode && "Clicked"}`} name="list" onClick={() => setListMode(true)}>
          Participants
        </button>
      </div>
      {listMode ? (
        <div className="ParticipantsList">
          {participants.map((participant) => (
            <Participant
              client={client}
              key={participant.email}
              participant={participant}
              eventChannel={eventChannel}
            />
          ))}
        </div>
      ) : (
        <ChatBox
          client={client}
          eventChannel={eventChannel}
          messages={chatMessages}
          isBannedFromChat={isBannedFromChat}
        />
      )}
    </div>
  );
};

export default ParticipantsList;
