import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import Router from "./components/Router";

const main = document.getElementById("main");
if (main != null)
  ReactDOM.createRoot(main).render(
    <ChakraProvider>
      <Router />
    </ChakraProvider>
  );
