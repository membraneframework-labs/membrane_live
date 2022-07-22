import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Form from "../pages/Form";
import Event from "../pages/Event";
import { Container } from "@chakra-ui/react";

const Router = () => {
  return (
    <Container width="100vw" height="100vh">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Form />} />
          <Route path="/event/*" element={<Event />} />
        </Routes>
      </BrowserRouter>
    </Container>
  );
};

export default Router;
