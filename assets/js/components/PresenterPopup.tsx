import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import { Client, PresenterPopupState } from "../pages/Event";
import { getFontColor } from "../utils/styleUtils";

type PresenterPopupProps = {
  client: Client;
  moderatorTopic: string;
  eventChannel: any;
  setPopupState: React.Dispatch<React.SetStateAction<PresenterPopupState>>;
};

const PresenterPopup = ({
  client,
  moderatorTopic,
  eventChannel,
  setPopupState,
}: PresenterPopupProps) => {
  const { isOpen, onClose } = useDisclosure({ defaultIsOpen: true });
  const fontColor = getFontColor("--font-dark-color");

  const sendAnswer = (answer: string) => {
    eventChannel.push("presenter_answer", {
      email: client.email,
      moderatorTopic: moderatorTopic,
      answer: answer,
    });
    setPopupState({ isOpen: false, moderatorTopic: "" });
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color={fontColor}>
          You've been assigned a presenter role by the moderator
        </ModalHeader>
        <Button
          color={fontColor}
          variant="ghost"
          onClick={() => {
            onClose();
            sendAnswer("reject");
          }}
        >
          Reject
        </Button>
        <Button
          color={fontColor}
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
