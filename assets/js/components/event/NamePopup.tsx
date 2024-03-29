import Modal from "react-modal";
import React, { useState } from "react";
import GoogleButton from "../helpers/GoogleButton";
import { roundedGoogleButton } from "../../utils/const";
import { sessionStorageSetName } from "../../utils/storageUtils";
import { useNavigate } from "react-router-dom";
import { getErrorToast } from "../../utils/toastUtils";
import { useToast } from "@chakra-ui/react";
import type { Client } from "../../types/types";
import "../../../css/event/namepopup.css";
import "../../../css/dashboard/modalform.css";

type NamePopupProps = {
  client: Client;
  setClient: React.Dispatch<React.SetStateAction<Client>>;
};

const NamePopup = ({ client, setClient }: NamePopupProps) => {
  const [name, setName] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const toast = useToast();
  const navigate = useNavigate();

  const saveNameAndClosePopup = () => {
    if (name.trim() === "") {
      getErrorToast(toast, "Username cannot be empty or contain only whitespaces");
      return;
    }

    sessionStorageSetName(name);
    setClient({ ...client, name: name });
    setIsOpen(false);
  };

  const goBackToDashboard = () => {
    setIsOpen(false);
    navigate("/");
  };

  return (
    <Modal
      shouldFocusAfterRender={false}
      className="ModalForm"
      isOpen={isOpen}
      ariaHideApp={false}
      onRequestClose={goBackToDashboard}
      contentLabel="Form Modal"
    >
      <div className="ModalWrapper">
        <div className="ModalFormHeader">
          <div className="ModalTitle"> Pass your name </div>
        </div>
        <div className="ModalFormBody">
          <div className="EventFormFieldDiv">
            <input
              className="EventFormFieldInput"
              type="text"
              placeholder="Username"
              value={name}
              onInput={(e) => setName((e.target as HTMLTextAreaElement).value)}
              required
            />
          </div>
        </div>
        <div className="ModalFormFooter">
          <GoogleButton buttonId="NamePopupButton" options={roundedGoogleButton} />
          <button onClick={saveNameAndClosePopup} className="SaveButton">
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default NamePopup;
