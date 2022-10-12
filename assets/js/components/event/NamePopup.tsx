import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Input,
  Center,
  FormLabel,
  FormControl,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { Client } from "../../types";
import "../../../css/event/namepopup.css";

type NamePopupProps = {
  client: Client;
  setClient: React.Dispatch<React.SetStateAction<Client>>;
};

const NamePopup = ({ client, setClient }: NamePopupProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  onOpen;
  const [name, setName] = useState<string>("");
  const saveNameAndClosePopup = () => {
    setClient({ ...client, name: name });
    onClose();
  };
  return (
    <Modal isCentered={true} size={"xl"} isOpen={true} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <p className="PopupHeader"> Pass your name </p>
        <ModalBody pb={6}>
          <FormControl>
            <input
              className="UsernameInput"
              placeholder="Username"
              value={name}
              onInput={(e) => setName((e.target as any).value)}
            ></input>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <button onClick={saveNameAndClosePopup} className="SaveButton">
            Save
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NamePopup;
