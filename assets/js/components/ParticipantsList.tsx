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

const ModeratorMenu = ({ isPresenter }) => {
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
        <MenuItem>{isPresenter ? "Set as a normal participant" : "Set as a presenter"}</MenuItem>
        <MenuItem>Mute</MenuItem>
        <MenuItem>Kick</MenuItem>
      </MenuList>
    </Menu>
  );
};

const Participant = ({ name, isModerator, isPresenter }) => {
  return (
    <Flex width="15vw" alignItems="center" gap="1">
      <Avatar name="Dan Abrahmov" src="https://bit.ly/dan-abramov" />
      <Box p="2">
        <Heading size="md">{name}</Heading>
      </Box>
      <Spacer />
      {isModerator ? <ModeratorMenu isPresenter={isPresenter} /> : null}
    </Flex>
  );
};

const ParticipantsList = ({ participants, isModerator }) => {
  let parts: JSX.Element[] = [];
  participants.map((name) =>
    parts.push(<Participant key={name} name={name} isModerator={isModerator} isPresenter={false} />)
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
