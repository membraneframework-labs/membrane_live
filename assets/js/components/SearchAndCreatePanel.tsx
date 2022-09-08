import React, { useState } from "react";
import { Search } from "react-swm-icon-pack";
import "../../css/searchandcreatepanel.css";

const SearchAndCreatePanel = () => {
    const [input, setInput] = useState("");  // TODO

    return (
        <div className="SearchAndCreatePanel">
            <div className="SearchBar">
                <Search />
                <input value={input} onInput={e => setInput((e.target as any).value)} placeholder="Search events"/>
            </div>
            <button className="FormButton" onClick={() => {
                    // TODO
                }}>
                    <p>Create new event</p>
            </button>
        </div>
    );
}

export default SearchAndCreatePanel;