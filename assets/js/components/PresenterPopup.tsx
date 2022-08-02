import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import React from "react";
import type { PresenterPopupState } from "../pages/Event";
import { connectWebrtc } from "../utils/webrtcUtils";

type PresenterPopupProps = {
  name: string;
  moderator: string;
  eventChannel: any;
  setPopupState: React.Dispatch<React.SetStateAction<PresenterPopupState>>;
  streamsAvailable: object;
  setStreamsAvailable: Function;  // TODO
};

const PresenterPopup = ({ name, moderator, eventChannel, setPopupState, streamsAvailable, setStreamsAvailable }: PresenterPopupProps) => {
  const { isOpen, onClose } = useDisclosure({ defaultIsOpen: true });

  const sendAnswer = (answer: string) => {
    eventChannel.push("presenter_answer", { name: name, moderator: moderator, answer: answer });
    if (answer == "accept")
      connectWebrtc(eventChannel, name, streamsAvailable, setStreamsAvailable);
    setPopupState({ isOpen: false, moderator: "" });
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>You've been assigned a presenter role by the moderator</ModalHeader>
        <Button
          variant="ghost"
          onClick={() => {
            onClose();
            sendAnswer("reject");
          }}
        >
          Reject
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            onClose();
            sendAnswer("accept");
          }}
        >
          Accept
        </Button>
      </ModalContent>
    </Modal>
  );
};

export default PresenterPopup;
