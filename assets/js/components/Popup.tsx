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
  useDisclosure,
} from "@chakra-ui/react";
import React, { useState } from "react";

interface connectToChannel {
  connectToChannel: (
    name: string,
    onClose: () => void,
    setChannelConnErr: (value: any) => void
  ) => void;
}

const Popup = ({ connectToChannel }: connectToChannel) => {
  const [input, setInput] = useState<string>("");
  const [channelConnErr, setChannelConnErr] = useState<string>("");
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: true });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);
  const handleSubmit = () => {
    connectToChannel(input, onClose, setChannelConnErr);
  };

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
