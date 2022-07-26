import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  FormControl,
  Input,
  FormErrorMessage,
  ModalFooter,
  Button,
} from "@chakra-ui/react";
import type {EventInfo}  from "../pages/Event";
import React, { useState } from "react";

interface PopupProps {
  eventInfo: EventInfo;
  setEventInfo: Function;
  connectToChannels: (name: string) => void;
  isOpen: boolean;
  channelConnErr: string;
}

const Popup = ({ eventInfo, setEventInfo, connectToChannels, isOpen, channelConnErr }: PopupProps) => {
  const [input, setInput] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);
  const handleSubmit = () => {
    setEventInfo({...eventInfo, username: input})
    connectToChannels(input);
  }
  
  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Pass your name</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isInvalid={channelConnErr != ""}>
            <Input
              type="text"
              placeholder="Name"
              size="lg"
              value={input}
              onChange={handleInputChange}
            />
            {channelConnErr != "" ? <FormErrorMessage>{channelConnErr}</FormErrorMessage> : null}
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
            Submit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default Popup;
