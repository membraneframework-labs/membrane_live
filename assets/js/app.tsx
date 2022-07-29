import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import Router from "./components/Router";

import { setup } from "./pages/connect";

setup();
// ReactDOM.createRoot(document.getElementById("main")!).render(
//   <React.StrictMode>
//     <ChakraProvider>
//       <Router />
//     </ChakraProvider>
//   </React.StrictMode>
// );
