import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import GenericButton from "../helpers/GenericButton";
import { Share1 } from "react-swm-icon-pack";

import "../../../css/event/shareButton.css";
import { ShareListElements, ShareTitle } from "./ShareList";

type ShareButtonProps = {
  eventTitle: string;
};

const ShareButton = ({ eventTitle }: ShareButtonProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <GenericButton icon={<Share1 />} onClick={onOpen} />

      <Modal isOpen={isOpen} onClose={onClose} size={"xl"} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <ShareTitle eventTitle={eventTitle} />
          </ModalHeader>
          <ModalBody>
            <ShareListElements />
          </ModalBody>
          <ModalFooter>
            <button className="CloseShareModal" onClick={onClose}>
              Close
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ShareButton;
