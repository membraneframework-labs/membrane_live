import React, {useEffect, useState} from "react";
import "../../../css/event/mobilebottompanel.css";
import {ProductsComponent} from "./ProductsComponent";
import useCheckScreenType from "../../utils/useCheckScreenType";


type Props = {
  card: string;
  onBarClick: () => void;
  webinarId: string;
}

const selectAnimation = (card: string) => {
  if (card === "HIDDEN") return "";
  if (card === "HIDE") return "SlideOutAnimation";
  return "SlideInAnimation"
}

export const MobileBottomPanel = ({onBarClick, card, webinarId}: Props) => {
  const {device} = useCheckScreenType();

  const animation = selectAnimation(card)

  if (device !== "mobile") return null;
  return (
    // <div className={`MobileBottomPanel ${card ? "SlideInAnimation" : "SlideOutAnimation"}`}>
    // <div className={`MobileBottomPanel`}>
    <div className={`MobileBottomPanel ${animation}`}>
      <div className="MobileBottomPanel--TopBar">
        <div className="MobileBottomPanel--TopBar--Bar" onClick={onBarClick}/>
      </div>

      <div className="MobileBottomPanel--Header">
      </div>


      <div className="MobileBottomPanel--Content">
        <ProductsComponent webinarId={webinarId}/>
      </div>
    </div>
  )
}
