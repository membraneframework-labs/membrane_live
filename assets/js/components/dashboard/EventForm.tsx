import React, { useEffect, useState } from "react";
import { Plus } from "react-swm-icon-pack";

import { EventFormType, EventInfo } from "../../types";

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
  value?: string;
  inputSetter: (fieldInput: string) => void;
};

const changeElement = (
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  inputSetter: (fieldInput: string) => void
) => {
  return inputSetter(event.target.value);
};

const TitleField = ({ value, inputSetter }: FieldProps) => {
  return (
    <div className="EventFormFieldDiv">
      <label className="EventFormFieldLabel">Event name</label>
      <input
        className="EventFormFieldInput"
        type="text"
        placeholder="Type title here"
        value={value}
        onChange={(e) => changeElement(e, inputSetter)}
      />
    </div>
  );
};

const DescriptionField = ({ value, inputSetter }: FieldProps) => {
  const charLimit = 255;
  const [counter, setCounter] = useState<number>(value ? value.length : 0);

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
        value={value ? value : ""}
        onChange={handleChange}
      ></textarea>
    </div>
  );
};

const DateField = ({ value, inputSetter }: FieldProps) => {
  return (
    <div className="EventFormFieldDiv">
      <label className="EventFormFieldLabel">Date & Time</label>
      <input
        className="EventFormFieldInput"
        type="datetime-local"
        value={value}
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
  defaultInput?: EventInfo;
};

const EventForm = ({ setParentInput, defaultInput }: EventFormProps) => {
  const infoToEventForm = (defaultInput: EventInfo): EventFormType => {
    const convertDateToString = (date: Date) => {
      const offset = date.getTimezoneOffset() * 60 * 1000;
      const dateWithOffset = new Date(date.getTime() - offset);
      return dateWithOffset.toISOString().slice(0, 16);
    };

    const start_date = convertDateToString(defaultInput.startDate);
    return { ...defaultInput, start_date };
  };

  const initialInput = defaultInput ? infoToEventForm(defaultInput) : initialEventFormInput;

  const [inputTitle, setInputTitle] = useState<string>(initialInput.title);
  const [inputDescription, setInputDescription] = useState<string>(initialInput.description);
  const [inputDate, setDate] = useState<string>(initialInput.start_date);
  const [inputPresenters, setInputParticipants] = useState<string[]>(initialInput.presenters);

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
      <TitleField value={inputTitle} inputSetter={setInputTitle} />
      <DescriptionField value={inputDescription} inputSetter={setInputDescription} />
      <DateField value={inputDate} inputSetter={setDate} />
      <PresenterField inputList={inputPresenters} inputSetter={setInputParticipants} />
      <ModeratorField />
    </div>
  );
};

export default EventForm;
