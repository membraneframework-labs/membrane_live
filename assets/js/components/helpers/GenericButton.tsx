import React from "react";

type GenericButtonProps = {
  icon: any;
  onClick: () => void;
};

const GenericButton = ({ icon, onClick }: GenericButtonProps) => {
  return <button onClick={onClick}>{icon}</button>;
};

export default GenericButton;
