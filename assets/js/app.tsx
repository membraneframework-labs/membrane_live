import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, Center } from "@chakra-ui/react";
import Form from "./Form";

ReactDOM.createRoot(document.getElementById('main')!).render(
  <React.StrictMode>
    <ChakraProvider>
      <Center>
        <Form/>
      </Center>
    </ChakraProvider>
  </React.StrictMode>
);