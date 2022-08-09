import React, { useEffect, useState } from "react";
import {
  SimpleGrid,
  Box,
  Flex,
  Heading,
  Spacer,
  Avatar,
  Menu,
  IconButton,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { syncEventChannel } from "../utils/channelUtils";

export type Participant = {
  name: string;
  isPresenter: boolean;
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
  eventChannel: any;
};

type ParticipantsListProps = {
  username: string;
  isModerator: boolean;
  eventChannel: any;
  setPresenters: React.Dispatch<React.SetStateAction<string[]>>;
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
      <MenuButton
        as={IconButton}
        aroa-label="Options"
        icon={"Menu Icon"}
        variant="outline"
        backgroundColor="red"
      />
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
  eventChannel,
}: ParticipantProps) => {
  return (
    <Flex width="15vw" alignItems="center" gap="1">
      <Avatar name="Dan Abrahmov" src="https://bit.ly/dan-abramov" />
      <Box p="2">
        <Heading size="md">{name}</Heading>
      </Box>
      {isPresenter && <b>Pres</b>}
      <Spacer />
      {isModerator ? (
        <ModeratorMenu
          username={username}
          eventChannel={eventChannel}
          isPresenter={isPresenter}
          name={name}
        />
      ) : null}
    </Flex>
  );
};

const ParticipantsList = ({
  username,
  isModerator,
  eventChannel,
  setPresenters,
}: ParticipantsListProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    syncEventChannel(eventChannel, setParticipants, setPresenters);
  }, [eventChannel]);

  let parts: JSX.Element[] = [];
  participants.map((participant) =>
    parts.push(
      <Participant
        username={username}
        key={participant.name}
        name={participant.name}
        isModerator={isModerator}
        isPresenter={participant.isPresenter}
        eventChannel={eventChannel}
      />
    )
  );

  return (
    <Box overflowY="auto" maxHeight="50vh">
      <SimpleGrid columns={1} spacing={5}>
        {parts}
      </SimpleGrid>
    </Box>
  );
};

export default ParticipantsList;
