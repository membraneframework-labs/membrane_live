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
import React, { useState } from "react";

interface PopupProps {
  setName: (name: string) => void;
  isOpen: boolean;
  channelConnErr: string;
}

const NamePopup = ({
  setName,
  isOpen,
  channelConnErr,
}: PopupProps) => {
  const [input, setInput] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);

  return (
    <Modal isOpen={isOpen} onClose={() => { }}>
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
            {channelConnErr && <FormErrorMessage>{channelConnErr}</FormErrorMessage>}
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={() => setName(input)}>
            Submit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NamePopup;