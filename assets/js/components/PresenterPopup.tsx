import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import React from "react";

type PopupProp = {
  onAccept: Function;
  onReject: Function;
};

const PresenterPopup = ({ onAccept, onReject }: PopupProp) => {
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: true });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>You've been assigned a presenter role by the moderator</ModalHeader>
        <Button
          colorScheme="blue"
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
