import React from "react";
import {
  SimpleGrid,
  Box,
  Table,
  Flex,
  Heading,
  ButtonGroup,
  Button,
  Spacer,
  Avatar,
  Menu,
  IconButton,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";

const ParticipantMenu = (props) => {
  return (
    <Menu>
      <MenuButton as={IconButton} aroa-label="Options" icon={"Menu Icon"} variant="outline" />
      <MenuList>
        <MenuItem>Opcja 1</MenuItem>
        <MenuItem>Opcja 2</MenuItem>
        <MenuItem>Opcja 3</MenuItem>
        <MenuItem>Opcja 4</MenuItem>
        <MenuItem>Opcja 5</MenuItem>
      </MenuList>
    </Menu>
  );
};

const Participant = ({ name }) => {
  return (
    <Flex width="15vw" alignItems="center" gap="1">
      <Avatar name="Dan Abrahmov" src="https://bit.ly/dan-abramov" />
      <Box p="2">
        <Heading size="md">{name}</Heading>
      </Box>
      <Spacer />
      <ParticipantMenu />
    </Flex>
  );
};

const ParticipantsList = ({ participants }) => {
  let parts: JSX.Element[] = [];
  participants.map((name) => parts.push(<Participant name={name} />));

  return (
    <Box overflowY="auto" maxHeight="50vh">
      <SimpleGrid columns={1} spacing={5}>
        {parts}
      </SimpleGrid>
    </Box>
  );
};

export default ParticipantsList;
