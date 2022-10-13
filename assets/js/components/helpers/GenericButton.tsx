import React from "react";

type GenericButtonProps = {
  icon: any;
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
