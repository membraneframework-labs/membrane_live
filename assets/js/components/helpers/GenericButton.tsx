import { forwardRef } from "react";

type GenericButtonProps = {
  icon: JSX.Element;
  onClick: () => void;
  disabled?: boolean;
};

const GenericButton = forwardRef<HTMLButtonElement, GenericButtonProps>(({ icon, onClick, disabled = false }, ref) => {
  return (
    <button ref={ref} onClick={onClick} disabled={disabled}>
      {icon}
    </button>
  );
});

GenericButton.displayName = "GenericButton";

export default GenericButton;
