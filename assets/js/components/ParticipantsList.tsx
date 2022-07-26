import React from "react";
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
import type { Participant } from "../pages/Event";

type ModeratorMenuProps = {
  yourName: string;
  name: string;
  isPresenter: boolean;
  eventChannel: any;
};

type ParticipantProps = {
  yourName: string;
  name: string;
  isPresenter: boolean;
  isModerator: boolean;
  eventChannel: any;
};

type ParticipantsListProps = {
  yourName: string;
  participants: Participant[];
  isModerator: boolean;
  eventChannel: any;
};

const ModeratorMenu = ({ yourName, name, isPresenter, eventChannel }: ModeratorMenuProps) => {
  const handleClick = (e: any) => {
    if (e.target.value === "Set as a presenter") {
      const link = "private:" + window.location.pathname.split("/")[2] + ":";
      eventChannel.push("presenter_prop", { moderator: link + yourName, presenter: link + name });
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
  yourName,
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
      <Spacer />
      {isModerator ? (
        <ModeratorMenu
          yourName={yourName}
          eventChannel={eventChannel}
          isPresenter={isPresenter}
          name={name}
        />
      ) : null}
    </Flex>
  );
};

const ParticipantsList = ({
  yourName,
  participants,
  isModerator,
  eventChannel,
}: ParticipantsListProps) => {
  let parts: JSX.Element[] = [];
  participants.map((participant) =>
    parts.push(
      <Participant
        yourName={yourName}
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
