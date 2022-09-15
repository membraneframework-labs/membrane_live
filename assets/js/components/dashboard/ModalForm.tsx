import React from "react";
import { useState } from "react";
import Modal from "react-modal";

import { Cross } from "react-swm-icon-pack";

import { EventFormType } from "../../types";
import EventForm, { initialEventFormInput } from "./EventForm";
import GenericButton from "../helpers/GenericButton";

import { useToast } from "@chakra-ui/react";
import { getInfoToast } from "../../utils/toastUtils";
import { checkEventForm, sendEventForm } from "../../utils/formApi";

import "../../../css/dashboard/modalform.css";

const ModalForm = () => {
  const toast = useToast();
  const [eventFormInput, setEventFormInput] = useState<EventFormType>(initialEventFormInput);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleSendButton = () => {
    if (checkEventForm(eventFormInput)) {
      sendEventForm(eventFormInput);
      closeModal();
    } else {
      getInfoToast(toast, 'Fields "title" and "date" are necessary to create an event.');
    }
  };

  return (
    <div>
      <button className="ModalFormButton" onClick={openModal}>
        Create new event
      </button>
      <Modal className="ModalForm" isOpen={isOpen} ariaHideApp={false} contentLabel="Form Modal">
        <div className="ModalFormHeader">
          <div className="ModalTitle">Create new event</div>
          <GenericButton icon={<Cross />} onClick={closeModal} />
        </div>
        <div className="ModalFormBody">
          <EventForm setParentInput={setEventFormInput} />
        </div>
        <div className="ModalFormFooter">
          <button className="ModalFormSubmitButton" onClick={handleSendButton}>
            Create event
          </button>
          <button className="ModalFormCancelButton" onClick={closeModal}>
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ModalForm;
