import React from "react";
import "../../../css/event/mobilebottompanel.css";
import {ProductsComponent} from "./ProductsComponent";
import useCheckScreenType from "../../utils/useCheckScreenType";


type Props = {
  card: string | undefined;
  onBarClick: () => void
}

export const MobileBottomPanel = ({onBarClick, card}: Props) => {
  const {device} = useCheckScreenType();

  if (device !== "mobile") return null;
  return (<div className={`MobileBottomPanel ${card ? "SlideInAnimation" : "SlideOutAnimation"}`}>
      <div className="MobileBottomPanel--TopBar">
        <div className="MobileBottomPanel--TopBar--Bar" onClick={onBarClick}/>
      </div>

      <div className="MobileBottomPanel--Header">
      </div>


      <div className="MobileBottomPanel--Content">
        <ProductsComponent/>
      </div>
    </div>
  )
}
