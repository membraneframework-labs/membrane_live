import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Event from "../pages/Event";
import Recording from "../pages/Recording";
import { useDynamicResizing } from "../utils/reactUtils";
import { ScreenTypeContext } from "../utils/ScreenTypeContext";
import useCheckScreenType from "../utils/useCheckScreenType";
import { StreamStartProvider } from "../utils/StreamStartContext";

const Router = () => {
  useDynamicResizing();
  const screenType = useCheckScreenType();

  return (
    <ScreenTypeContext.Provider value={screenType}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/event/*"
            element={
              <StreamStartProvider>
                <Event />
              </StreamStartProvider>
            }
          />
          <Route path="/recordings/*" element={<Recording />} />
        </Routes>
      </BrowserRouter>
    </ScreenTypeContext.Provider>
  );
};

export default Router;
