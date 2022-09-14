import React from "react";
import { useState } from "react";
import Modal from "react-modal";

import { Cross } from "react-swm-icon-pack";

import GenericButton from "../helpers/GenericButton";

import "../../../css/dashboard/modalform.css";

const ModalForm = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <div>
      <button className="ModalFormButton" onClick={openModal}>Create new event</button>
      <Modal
        className="ModalForm"
        isOpen={isOpen}
        ariaHideApp={false}
        contentLabel="Form Modal"
      >
        <div className="ModalFormHeader">
          <div className="ModalTitle">Create new event</div>
          <GenericButton icon={<Cross />} onClick={closeModal} />
        </div>
        <div className="ModalFormBody">
          <div>Here will be the form</div>
        </div>
        <div className="ModalFormFooter">
          <button className="ModalFormSubmitButton" onClick={() => {console.log("Formularz robi WZIUM")}}>Create event</button>
          <button className="ModalFormCancelButton" onClick={closeModal}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
};

export default ModalForm;
