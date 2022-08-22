import React, { useState } from "react";
import ModePanel from "./ModePanel";
import PresenterStreams from "./PresenterStreams";
import HlsPlayer from "./HlsPlayer";
import "../../css/streamarea.css"

export type Mode = "presenters" | "hls";

type StreamAreaProps = {
    clientName: string;
    eventChannel: any;
};

const StreamArea = ({clientName, eventChannel}: StreamAreaProps) => {
    const [mode, setMode] = useState<Mode>("presenters");

    return (
        <div className="StreamArea">
          <ModePanel mode={mode} setMode={setMode} nowPresentingName={"Mock Mockinsky"} eventChannel={eventChannel}/>
          <div className="Stream">
            <PresenterStreams clientName={clientName} eventChannel={eventChannel} />
            {/* <HlsPlayer eventChannel={eventChannel} /> */}
          </div>
        </div>
    );
};

export default StreamArea;