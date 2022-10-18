import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isUserAuthenticated } from "./jwtApi";

const GuardedRoute = () => {
  const isAuthenticated = isUserAuthenticated();
  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/auth" state={{ pathToReturnTo: window.location.pathname }} replace={true} />
  );
};

export default GuardedRoute;
