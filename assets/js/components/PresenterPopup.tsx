import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import { PresenterPopupState } from "../pages/Event";

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

  const style = getComputedStyle(document.body);
  const fontColor = style.getPropertyValue("--font-dark-color");

  const sendAnswer = (answer: string) => {
    eventChannel.push("presenter_answer", { name: username, moderator: moderator, answer: answer });
    setPopupState({ isOpen: false, moderator: "" });
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
