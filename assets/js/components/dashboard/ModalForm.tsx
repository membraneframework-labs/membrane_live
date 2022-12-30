import { useState } from "react";
import Modal from "react-modal";
import { Cross } from "react-swm-icon-pack";
import EventForm, { initialEventFormInput } from "./EventForm";
import GenericButton from "../helpers/GenericButton";
import { useToast } from "@chakra-ui/react";
import { getInfoToast, getErrorToast } from "../../utils/toastUtils";
import { checkEventForm, sendEventForm } from "../../utils/dashboardUtils";
import type { EventFormInput, EventInfo, ModalForm } from "../../types/types";
import "../../../css/dashboard/modalform.css";

const modalButtonTitle = { create: "Create new webinar", update: "Update" };
const modalTitle = { create: "Create new webinar", update: "Update webinar" };
const modalSubmitLabel = { create: "Create event", update: "Update event" };
const modalErrorMessage = {
  create: "There was an error when creating the webinar",
  update: "There was an error when updating the webinar",
};

type ModalFormProps = {
  type: ModalForm;
  activationButtonClass: string;
  webinar?: EventInfo;
};

const ModalForm = ({ type, activationButtonClass, webinar }: ModalFormProps) => {
  const toast = useToast();

  const [eventFormInput, setEventFormInput] = useState<EventFormInput>(initialEventFormInput);
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
      sendEventForm(type, eventFormInput, webinar?.uuid)
        .then(() => {
          refresh();
          closeModal();
        })
        .catch((e) => {
          console.log(e);
          if (e.response.status === 403) {
            getErrorToast(toast, "You are not permitted to change this webinar.");
          } else {
            getErrorToast(toast, modalErrorMessage[type]);
          }
        });
    } else {
      getInfoToast(toast, 'Fields "title" and "date" are necessary to create an event.');
    }
  };

  return (
    <div>
      <button className={activationButtonClass} onClick={openModal}>
        {modalButtonTitle[type]}
      </button>
      <Modal
        className="ModalForm"
        isOpen={isOpen}
        ariaHideApp={false}
        onRequestClose={closeModal}
        contentLabel="Form Modal"
      >
        <div className="ModalWrapper">
          <div className="ModalFormHeader">
            <div className="ModalTitle">{modalTitle[type]}</div>
            <GenericButton icon={<Cross />} onClick={closeModal} />
          </div>
          <div className="ModalFormBody">
            <EventForm setParentInput={setEventFormInput} defaultInput={webinar} />
          </div>
          <div className="ModalFormFooter">
            <button className="ModalFormSubmitButton" onClick={handleSendButton}>
              {modalSubmitLabel[type]}
            </button>
            <button className="ModalFormCancelButton" onClick={closeModal}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ModalForm;
