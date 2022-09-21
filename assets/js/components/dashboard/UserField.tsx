import React from "react";
import { User1 } from "react-swm-icon-pack";
import "../../../css/dashboard/userfield.css";

type UserFieldProps = {
  picture: string;
  name: string;
};

const UserField = ({ picture, name }: UserFieldProps) => {
  return (
    <div className="UserField">
      {picture ? <img src={picture} className="UserIcon" /> : <User1 className="UserIcon" />}
      <div className="UserName">{name}</div>
    </div>
  );
};

export default UserField;
