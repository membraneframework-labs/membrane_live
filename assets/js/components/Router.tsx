import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Event from "../pages/Event";
import Recording from "../pages/Recording";
import { changeSizeDynamically } from "../utils/reactUtils";

const Router = () => {
  changeSizeDynamically();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/event/*" element={<Event />} />
        <Route path="/recordings/*" element={<Recording />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
