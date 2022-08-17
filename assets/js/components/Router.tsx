import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Form from "../pages/Form";
import Event from "../pages/Event";
import Auth from "../pages/Auth";
import GuardedRoute from "../services/GuardedRoute";

const Router = () => {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GuardedRoute />}>
            <Route path="/" element={<Form />} />
            <Route path="/event/*" element={<Event />} />
          </Route>
          <Route path="/auth/" element={<Auth />} />
        </Routes>
      </BrowserRouter>
  );
};

export default Router;
