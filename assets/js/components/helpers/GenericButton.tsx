import React from "react";

type GenericButtonProps = {
  icon: JSX.Element;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
};

const GenericButton = React.forwardRef<HTMLButtonElement, GenericButtonProps>(
  ({ icon, onClick, className, disabled }, ref) => {
    return (
      <button ref={ref} onClick={onClick} className={className} disabled={disabled}>
        {icon}
      </button>
    );
  }
);

GenericButton.displayName = "GenericButton";

export default GenericButton;
