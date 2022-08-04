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
import type { EventInfo } from "../pages/Event";
import React, { useState } from "react";

type NamePopupProps = {
  eventInfo: EventInfo;
  setEventInfo: Function;
  isNamePopupOpen: boolean;
  channelConnErr: string;
  connectToChannels: (name: string) => void;
};

const NamePopup = ({
  eventInfo,
  setEventInfo,
  isNamePopupOpen,
  channelConnErr,
  connectToChannels,
}: NamePopupProps) => {
  const [input, setInput] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);

  const handleSubmit = () => {
    setEventInfo({ ...eventInfo, username: input });
    connectToChannels(input);
  };

  return (
    <Modal isOpen={isNamePopupOpen} onClose={() => {}}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Pass your name</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isInvalid={channelConnErr != ""}>
            <Input type="text" placeholder="Name" value={input} onChange={handleInputChange} />
            {channelConnErr != "" ? <FormErrorMessage>{channelConnErr}</FormErrorMessage> : null}
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button onClick={handleSubmit}>Submit</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NamePopup;
