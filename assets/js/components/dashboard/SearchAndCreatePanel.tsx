import React from "react";
import { Search } from "react-swm-icon-pack";
import ModalForm from "./ModalForm";
import "../../../css/dashboard/searchandcreatepanel.css";

type SearchAndCreatePanelProps = {
  currentEvents: string;
  searchText: string;
  setSearchText: React.Dispatch<React.SetStateAction<string>>;
};

const SearchAndCreatePanel = ({
  currentEvents,
  searchText,
  setSearchText,
}: SearchAndCreatePanelProps) => {
  return (
    <div className="SearchAndCreatePanel">
      <div className="SearchBar">
        <Search className="SearchIcon" />
        <input
          value={searchText}
          onInput={(e) => setSearchText((e.target as any).value)}
          placeholder="Search events"
          className="SearchInput"
        />
      </div>
      {currentEvents == "All events" && (
        <ModalForm/>
        // <button
        //   className="FormButton"
        //   onClick={() => {
        //     // TODO
        //   }}
        // >
        //   <p>Create new event</p>
        // </button>
      )}
    </div>
  );
};

export default SearchAndCreatePanel;
