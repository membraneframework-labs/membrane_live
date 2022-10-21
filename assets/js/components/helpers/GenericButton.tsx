import React from "react";
import { iconType } from "react-swm-icon-pack";

type GenericButtonProps = {
  icon: iconType;
  onClick: () => void;
};

const GenericButton = React.forwardRef<HTMLButtonElement, GenericButtonProps>(
  ({ icon, onClick }, ref) => {
    return (
      <button ref={ref} onClick={onClick}>
        {icon}
      </button>
    );
  }
);
GenericButton.displayName = "GenericButton";

export default GenericButton;
