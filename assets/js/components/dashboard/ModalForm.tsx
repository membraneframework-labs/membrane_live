import React from "react";
import { useState } from "react";
import Modal from "react-modal";

import { Cross } from "react-swm-icon-pack";

import { EventFormType, ModalFormType } from "../../types";
import EventForm, { initialEventFormInput } from "./EventForm";
import GenericButton from "../helpers/GenericButton";

import { useToast } from "@chakra-ui/react";
import { getInfoToast, getErrorToast } from "../../utils/toastUtils";
import { checkEventForm, sendEventForm } from "../../utils/formApi";

import "../../../css/dashboard/modalform.css";

const modalTitle = { create: "Create new webinar", update: "Update webinar" };
const modalSubmitLabel = { create: "Create event", update: "Update event" };

type ModalFormProps = {
  type: ModalFormType;
  uuid?: string;
};

const ModalForm = ({ type, uuid }: ModalFormProps) => {
  const toast = useToast();

  const [eventFormInput, setEventFormInput] = useState<EventFormType>(initialEventFormInput);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const refresh = () => window.location.reload();

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleSendButton = () => {
    if (checkEventForm(eventFormInput)) {
      sendEventForm(type, eventFormInput, uuid)
        .then((_response) => {
          refresh();
          closeModal();
        })
        .catch((e) => {
          console.log(e);
          getErrorToast(toast, "There was an error when creating the webinar");
        });
    } else {
      getInfoToast(toast, 'Fields "title" and "date" are necessary to create an event.');
    }
  };

  return (
    <div>
      <button className="ModalFormButton" onClick={openModal}>
        {modalTitle[type]}
      </button>
      <Modal className="ModalForm" isOpen={isOpen} ariaHideApp={false} contentLabel="Form Modal">
        <div className="ModalFormHeader">
          <div className="ModalTitle">{modalTitle[type]}</div>
          <GenericButton icon={<Cross />} onClick={closeModal} />
        </div>
        <div className="ModalFormBody">
          <EventForm setParentInput={setEventFormInput} />
        </div>
        <div className="ModalFormFooter">
          <button className="ModalFormSubmitButton" onClick={handleSendButton}>
            {modalSubmitLabel[type]}
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
