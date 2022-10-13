import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import GuardedRoute from "../services/GuardedRoute";
import Dashboard from "../pages/Dashboard";
import Event from "../pages/Event";
import Auth from "../pages/Auth";
import Recording from "../pages/Recording";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GuardedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/event/*" element={<Event />} />
          <Route path="/recording/*" element={<Recording />} />
        </Route>
        <Route path="/auth/" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
