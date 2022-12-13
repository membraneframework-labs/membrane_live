import { forwardRef } from "react";

type GenericButtonProps = {
  icon: JSX.Element;
  onClick: () => void;
};

const GenericButton = forwardRef<HTMLButtonElement, GenericButtonProps>(({ icon, onClick }, ref) => {
  return (
    <button ref={ref} onClick={onClick}>
      {icon}
    </button>
  );
});
GenericButton.displayName = "GenericButton";

export default GenericButton;
