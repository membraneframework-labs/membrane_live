import Modal from "react-modal";
import React, { useState } from "react";
import GoogleButton from "../helpers/GoogleButton";
import { roundedGoogleButton } from "../../utils/const";
import { Client } from "../../types";
import "../../../css/event/namepopup.css";
import "../../../css/dashboard/modalform.css";

type NamePopupProps = {
  client: Client;
  setClient: React.Dispatch<React.SetStateAction<Client>>;
};

const NamePopup = ({ client, setClient }: NamePopupProps) => {
  const [name, setName] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const saveNameAndClosePopup = () => {
    if (name === "") return;
    setClient({ ...client, name: name });
    setIsOpen(false);
  };

  return (
    <Modal className="ModalForm" isOpen={isOpen} ariaHideApp={false} contentLabel="Form Modal">
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
              onChange={(e) => setName((e.target as any).value)}
              required
            />
          </div>
        </div>
        <div className="ModalFormFooter">
          <GoogleButton options={roundedGoogleButton} />
          <button onClick={saveNameAndClosePopup} className="SaveButton">
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default NamePopup;
