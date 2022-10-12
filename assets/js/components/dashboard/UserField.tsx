import React from "react";
import { User1 } from "react-swm-icon-pack";
import "../../../css/dashboard/userfield.css";

type UserFieldProps = {
  picture: string;
  name: string;
};

const redirect = (suffix: string) => {
  window.location.href = `${window.location.origin}${suffix}`;
};

const UserField = ({ picture, name }: UserFieldProps) => {
  return name ? (
    <div className="UserField">
      {picture ? <img src={picture} className="UserIcon" /> : <User1 className="UserIcon" />}
      <div className="UserName">{name}</div>
    </div>
  ) : (
    <button className="LogInButton" onClick={() => redirect("/auth")}>
      {" "}
      Log in{" "}
    </button>
  );
};

export default UserField;
