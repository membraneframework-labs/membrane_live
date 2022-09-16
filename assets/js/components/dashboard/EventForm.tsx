import React, { useEffect, useState } from "react";
import { Plus } from "react-swm-icon-pack";

import { EventFormType } from "../../types";

import { UnorderedList, ListItem } from "@chakra-ui/react";
import GenericButton from "../helpers/GenericButton";

import "../../../css/dashboard/eventform.css";

export const initialEventFormInput: EventFormType = {
  title: "",
  description: "",
  start_date: "",
  presenters: [],
};

type FieldProps = {
  inputSetter: (fieldInput: string) => void;
};

const changeElement = (
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  inputSetter: (fieldInput: string) => void
) => {
  return inputSetter(event.target.value);
};

const TitleField = ({ inputSetter }: FieldProps) => {
  return (
    <div className="EventFormFieldDiv">
      <label className="EventFormFieldLabel">Event name</label>
      <input
        className="EventFormFieldInput"
        type="text"
        placeholder="Type title here"
        onChange={(e) => changeElement(e, inputSetter)}
      />
    </div>
  );
};

const DescriptionField = ({ inputSetter }: FieldProps) => {
  const charLimit = 255;
  const [counter, setCounter] = useState<number>(0);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const numberOfChars: number = event.target.value.length;
    setCounter(numberOfChars);

    changeElement(event, inputSetter);
  };

  return (
    <div className="EventFormFieldDiv">
      <div className="FlexContainer">
        <label className="EventFormFieldLabel">Event description</label>
        <span>
          {counter}/{charLimit}
        </span>
      </div>
      <textarea
        className="EventFormFieldInput"
        id="EventFormDescriptionField"
        placeholder="Type description here"
        onChange={handleChange}
      ></textarea>
    </div>
  );
};

const DateField = ({ inputSetter }: FieldProps) => {
  return (
    <div className="EventFormFieldDiv">
      <label className="EventFormFieldLabel">Date & Time</label>
      <input
        className="EventFormFieldInput"
        type="datetime-local"
        onChange={(e) => changeElement(e, inputSetter)}
      />
    </div>
  );
};

type ListFieldProps = { inputList: string[]; inputSetter: (inputList: string[]) => void };

const PresenterField = ({ inputList, inputSetter }: ListFieldProps) => {
  const [inputPresenter, setInputPresenter] = useState<string>("");

  const handleAddButton = () => {
    inputSetter([...inputList, inputPresenter]);
    setInputPresenter("");
  };

  return (
    <div className="EventFormFieldDiv">
      <label className="EventFormFieldLabel">Choose presenters (optional)</label>
      <div className="EventFormFieldInput EventFormFieldWithButtonDiv">
        <input
          type="search"
          placeholder="Type name of presenters to add"
          onChange={(e) => changeElement(e, setInputPresenter)}
        />
        <GenericButton icon={<Plus />} onClick={handleAddButton} />
      </div>
      <UnorderedList>
        {inputList.map((presenter, idx) => {
          return <ListItem key={idx}>{presenter}</ListItem>;
        })}
      </UnorderedList>
    </div>
  );
};

const ModeratorField = () => {
  return (
    <div className="EventFormFieldDiv">
      <label className="EventFormFieldLabel">Choose moderators (optional)</label>
      <div className="EventFormFieldInput EventFormFieldWithButtonDiv">
        <input type="search" placeholder="Type name of moderators to add" />
        <GenericButton
          icon={<Plus />}
          onClick={() => {
            alert("This functionality should be implemented in task LIVE-97");
          }}
        />
      </div>
    </div>
  );
};

type EventFormProps = {
  setParentInput: (input: EventFormType) => void;
};

const EventForm = ({ setParentInput }: EventFormProps) => {
  const [inputTitle, setInputTitle] = useState<string>("");
  const [inputDescription, setInputDescription] = useState<string>("");
  const [inputDate, setDate] = useState<string>("");
  const [inputPresenters, setInputParticipants] = useState<string[]>([]);

  useEffect(() => {
    setParentInput({
      title: inputTitle,
      description: inputDescription,
      start_date: inputDate,
      presenters: inputPresenters,
    });
  }, [inputTitle, inputDescription, inputDate, inputPresenters]);

  return (
    <div className="EventFormDiv">
      <TitleField inputSetter={setInputTitle} />
      <DescriptionField inputSetter={setInputDescription} />
      <DateField inputSetter={setDate} />
      <PresenterField inputList={inputPresenters} inputSetter={setInputParticipants} />
      <ModeratorField />
    </div>
  );
};

export default EventForm;
