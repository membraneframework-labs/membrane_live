import React from "react";
import { Search } from "react-swm-icon-pack";
import ModalForm from "./ModalForm";
import { storageGetAuthToken } from "../../utils/storageUtils";
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
  const isAuthenticated = storageGetAuthToken() ? true : false;

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
      {currentEvents == "All events" && isAuthenticated && (
        <ModalForm type="create" activationButtonClass="ModalFormCreateButton" />
      )}
    </div>
  );
};

export default SearchAndCreatePanel;
