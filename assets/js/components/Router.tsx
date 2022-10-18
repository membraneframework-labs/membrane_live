import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Event from "../pages/Event";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/event/*" element={<Event />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
