import React, { useEffect, useRef, useState } from "react";
import { Plus, Minus, CalendarClock } from "react-swm-icon-pack";

import type { EventFormInput, EventInfo } from "../../types/types";

import GenericButton from "../helpers/GenericButton";

import "../../../css/dashboard/eventform.css";
import { DESCRIPTION_CHAR_LIMIT, MILLISECONDS_IN_MINUTE } from "../../utils/const";

export const initialEventFormInput: EventFormInput = {
  title: "",
  description: "",
  start_date: "",
  presenters: [],
  is_private: true,
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
        required
      />
    </div>
  );
};

const DescriptionField = ({ value, inputSetter }: FieldProps) => {
  const charLimit = DESCRIPTION_CHAR_LIMIT;
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
        <span className="EventFormCounter">
          {counter}/{charLimit}
        </span>
      </div>
      <div className="EventFormDescriptionWrapper">
        <div className="EventFormScrollAdjuster" />
        <textarea
          className="EventFormFieldInput"
          id="EventFormDescriptionField"
          maxLength={charLimit}
          placeholder="Type description here"
          value={value ? value : ""}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

const DateField = ({ value, inputSetter }: FieldProps) => {
  const ref = useRef<HTMLInputElement>() as React.MutableRefObject<HTMLInputElement>;
  return (
    <div className="EventFormFieldDiv">
      <label className="EventFormFieldLabel">Date & Time</label>
      <div className="EventFormFieldInput EventFormFieldWithButtonDiv">
        <input type="datetime-local" value={value} ref={ref} onChange={(e) => changeElement(e, inputSetter)} required />
        <GenericButton
          icon={<CalendarClock />}
          onClick={() => (ref && ref.current ? ref.current.showPicker() : undefined)}
        />
      </div>
    </div>
  );
};

type ListFieldProps = { inputList: string[]; inputSetter: (inputList: string[]) => void };

const PresenterField = ({ inputList, inputSetter }: ListFieldProps) => {
  const [inputPresenter, setInputPresenter] = useState<string>("");

  const handleAddButton = () => {
    inputPresenter.trim() && inputSetter([...inputList, inputPresenter.trim()]);
    setInputPresenter("");
  };

  const removePresenter = (idx: number) => {
    const newInputList = inputList.filter((_p, i) => i != idx);
    inputSetter(newInputList);
  };

  return (
    <div className="EventFormFieldDiv">
      <label className="EventFormFieldLabel">Choose presenters (optional)</label>
      <div className="EventFormFieldInput EventFormFieldWithButtonDiv">
        <input
          type="search"
          value={inputPresenter}
          placeholder="Type name of presenters to add"
          onChange={(e) => changeElement(e, setInputPresenter)}
        />
        <GenericButton icon={<Plus />} onClick={handleAddButton} />
      </div>
      <ul className="EventFormUnorderedList">
        {inputList.map((presenter, idx) => {
          return (
            <li key={idx}>
              <div className="FlexContainer">
                <span>{presenter}</span>
                <GenericButton icon={<Minus />} onClick={() => removePresenter(idx)} />
              </div>
            </li>
          );
        })}
      </ul>
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
            alert("Handling multiple operators is coming soon...");
          }}
        />
      </div>
    </div>
  );
};

type CheckboxProps = { value: boolean; inputSetter: (value: boolean) => void };

const PrivateCheckBox = ({ value, inputSetter }: CheckboxProps) => {
  return (
    <div className="EventFormFieldDiv">
      <label className="EventFormFieldLabel">Is private</label>
      <input
        className="EventFormFieldInput"
        type="checkbox"
        checked={value}
        onChange={(e) => inputSetter(e.target.checked)}
        required
      />
    </div>
  );
};

type EventFormProps = {
  setParentInput: (input: EventFormInput) => void;
  defaultInput?: EventInfo;
};

const EventForm = ({ setParentInput, defaultInput }: EventFormProps) => {
  const infoToEventForm = (defaultInput: EventInfo): EventFormInput => {
    const convertDateToString = (date: Date) => {
      const offset = date.getTimezoneOffset() * MILLISECONDS_IN_MINUTE;
      const dateWithOffset = new Date(date.getTime() - offset);
      const toISOStringWithMinutes = (date: Date): string => date.toISOString().slice(0, 16);

      return toISOStringWithMinutes(dateWithOffset);
    };

    const start_date = convertDateToString(defaultInput.startDate);
    const isPrivate = true;
    return { ...defaultInput, start_date, is_private: isPrivate };
  };

  const initialInput = defaultInput ? infoToEventForm(defaultInput) : initialEventFormInput;

  const [inputTitle, setInputTitle] = useState<string>(initialInput.title);
  const [inputDescription, setInputDescription] = useState<string>(initialInput.description);
  const [inputDate, setDate] = useState<string>(initialInput.start_date);
  const [inputPresenters, setInputParticipants] = useState<string[]>(initialInput.presenters);
  const [inputIsPrivate, setInputIsPrivate] = useState<boolean>(initialInput.is_private);

  useEffect(() => {
    setParentInput({
      title: inputTitle,
      description: inputDescription,
      start_date: inputDate,
      presenters: inputPresenters,
      is_private: inputIsPrivate,
    });
  }, [inputIsPrivate, inputTitle, inputDescription, inputDate, inputPresenters, setParentInput]);

  return (
    <div className="EventFormDiv">
      <TitleField value={inputTitle} inputSetter={setInputTitle} />
      <DescriptionField value={inputDescription} inputSetter={setInputDescription} />
      <DateField value={inputDate} inputSetter={setDate} />
      <PresenterField inputList={inputPresenters} inputSetter={setInputParticipants} />
      <PrivateCheckBox value={inputIsPrivate} inputSetter={setInputIsPrivate}></PrivateCheckBox>
      <ModeratorField />
    </div>
  );
};

export default EventForm;
