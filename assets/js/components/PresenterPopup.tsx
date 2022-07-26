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

type PresenterPopupProps = {
  name: string;
  moderator: string;
  eventChannel: any;
  setPopupState: React.Dispatch<React.SetStateAction<PresenterPopupState>>;
};

const PresenterPopup = ({ name, moderator, eventChannel, setPopupState }: PresenterPopupProps) => {
  const { isOpen, onClose } = useDisclosure({ defaultIsOpen: true });

  const sendAnswer = (answer: string) => {
    eventChannel.push("presenter_answer", { name: name, moderator: moderator, answer: answer });
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
