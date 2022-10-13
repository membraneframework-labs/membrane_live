import React from "react";
import { iconType } from "react-swm-icon-pack";

type GenericButtonProps = {
  icon: iconType;
  onClick: () => void;
};

const GenericButton = React.forwardRef(({ icon, onClick }: GenericButtonProps, ref: any) => {
  return (
    <button ref={ref} onClick={onClick}>
      {icon}
    </button>
  );
});

export default GenericButton;
