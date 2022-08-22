import React, { useEffect, useState } from "react";
import type {Mode} from "./StreamArea";
import { Screen } from "react-swm-icon-pack";
import "../../css/ModePanel.css";
import { syncPresentersNumber } from "../utils/modePanelUtils";

type ModeButtonProps = {
    onClick: () => void;
    active: boolean;
    name: string;
};

const ModeButton = ({onClick, active, name}: ModeButtonProps) => {
    return (
        <button
            className={`ModeButton ${active && "Clicked"}`}
            onClick={onClick}
            name={name}
        >
            {name}
        </button>
    );
}

type ModePanelProps = {
    mode: Mode;
    setMode: React.Dispatch<React.SetStateAction<Mode>>;
    nowPresentingName: string;
    eventChannel: any;
};

const ModePanel = ({mode, setMode, nowPresentingName, eventChannel}: ModePanelProps) => {
    const [presentersNumber, setPresentersNumber] = useState(0);

    useEffect(() => syncPresentersNumber(eventChannel, setPresentersNumber), [eventChannel]);

    return (
        <div className="ModePanel">
            <Screen className="ScreenIcon"/>
            <div className="PresentingNow">
                {nowPresentingName} is now presenting...
            </div>
            <div className="ModeButtons">
                <ModeButton
                    name="Main Stream"
                    active={mode == "hls"}
                    onClick={() => setMode("hls")}
                />
                <ModeButton
                    name={`All presenters (${presentersNumber})`}
                    active={mode == "presenters"}
                    onClick={() => setMode("presenters")}
                />
            </div>
        </div>
    );
};

export default ModePanel;