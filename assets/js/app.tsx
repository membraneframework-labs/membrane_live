import ReactDOM from "react-dom/client";
import {ChakraProvider} from "@chakra-ui/react";
import Router from "./components/Router";
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'


const queryClient = new QueryClient()

const main = document.getElementById("main");
if (main != null)
  ReactDOM.createRoot(main).render(
    <ChakraProvider>
      <QueryClientProvider client={queryClient}>
        <Router/>
        <ReactQueryDevtools initialIsOpen={false}/>
      </QueryClientProvider>
    </ChakraProvider>
  );
