import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Form from "../pages/Form";
import Event from "../pages/Event";
import Auth from "../pages/Auth";
import { Container } from "@chakra-ui/react";
import GuardedRoute from "../services/GuardedRoute";

const Router = () => {
  return (
    <Container width="100vw" height="100vh">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GuardedRoute />}>
            <Route path="/" element={<Form />} />
            <Route path="/event/*" element={<Event />} />
          </Route>
          <Route path="/auth/" element={<Auth />} />
        </Routes>
      </BrowserRouter>
    </Container>
  );
};

export default Router;
