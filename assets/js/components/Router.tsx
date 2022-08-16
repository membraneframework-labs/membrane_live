import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Form from "../pages/Form";
import Event from "../pages/Event";
import Auth from "../pages/Auth";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Form />} />
        <Route path="/event/*" element={<Event />} />
        <Route path="/auth/" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
