import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import React from "react";

const PresenterPopup = ({ setPopupState, moderator, eventChannel, name}) => {
  const { isOpen, onClose } = useDisclosure({ defaultIsOpen: true });

  const onReject = () => {
    eventChannel.push("presenter_answer", {name: name, moderator: moderator, answer: "reject"});
    setPopupState({isOpen: false, moderator: ""});
  }

  const onAccept = () => {
    eventChannel.push("presenter_answer", {name: name, moderator: moderator, answer: "accept"});
    setPopupState({isOpen: false, moderator: ""});
  }

  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>You've been assigned a presenter role by the moderator</ModalHeader>
        <Button
          variant="ghost"
          onClick={() => {
            onClose();
            onReject();
          }}
        >
          Reject
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            onClose();
            onAccept();
          }}
        >
          Accept
        </Button>
      </ModalContent>
    </Modal>
  );
};

export default PresenterPopup;
