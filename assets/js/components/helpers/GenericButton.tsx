import React from "react";

type GenericButtonProps = {
  icon: JSX.Element;
  onClick: () => void;
  disabled?: boolean;
};

const GenericButton = React.forwardRef<HTMLButtonElement, GenericButtonProps>(
  ({ icon, onClick, disabled = false }, ref) => {
    return (
      <button ref={ref} onClick={onClick} disabled={disabled}>
        {icon}
      </button>
    );
  }
);
GenericButton.displayName = "GenericButton";

export default GenericButton;
