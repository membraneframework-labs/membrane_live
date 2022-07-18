import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from "@chakra-ui/react";
import Hello from "./hello";

ReactDOM.createRoot(document.getElementById('main')!).render(
  <React.StrictMode>
    <ChakraProvider>
      <Hello/>
    </ChakraProvider>
  </React.StrictMode>
);