import React, {createRef} from "react";

const PresenterPlayer = ({name, stream}) => {
    // TODO: trzeba jakoś przekazać MediaStream
    // i ogarnąć, zeby uzytkownik widzial sam siebie
    console.log("W COMPONENCIE", stream)
    
    const videoRef = (e) => {
        console.log("REF", e)
        // if (e != null && stream != null)
        //     e.srcObject = stream
    }

    return (
        <div>
            <video  width={1000} height={700} autoPlay playsInline muted id={"videocomponent" + name} 
            ref={videoRef}/>
            {/* <audio/> */}
            <h5>{name}</h5>
        </div>
    );
};

export default PresenterPlayer;
