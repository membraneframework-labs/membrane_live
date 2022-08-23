import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import React from "react";
import { PresenterPopupState } from "../pages/Event";
import "../../css/presenterpopup.css";

type PresenterPopupProps = {
  username: string;
  moderator: string;
  eventChannel: any;
  setPopupState: React.Dispatch<React.SetStateAction<PresenterPopupState>>;
};

const PresenterPopup = ({
  username,
  moderator,
  eventChannel,
  setPopupState,
}: PresenterPopupProps) => {
  const { isOpen, onClose } = useDisclosure({ defaultIsOpen: true });

  const sendAnswer = (answer: string) => {
    eventChannel.push("presenter_answer", { name: username, moderator: moderator, answer: answer });
    setPopupState({ isOpen: false, moderator: "" });
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader className="PresenterPopupText">You've been assigned a presenter role by the moderator</ModalHeader>
        <Button
          color="#001a72"
          variant="ghost"
          onClick={() => {
            onClose();
            sendAnswer("reject");
          }}
        >
          Reject
        </Button>
        <Button
          color="#001a72"
          className="PresenterPopupText"
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
