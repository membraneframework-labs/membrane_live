import React from "react";
import { iconType } from "react-swm-icon-pack";

type GenericButtonProps = {
  icon: iconType;
  onClick: () => void;
};

const GenericButton = ({ icon, onClick }: GenericButtonProps) => {
  return <button onClick={onClick}>{icon}</button>;
};

export default GenericButton;
