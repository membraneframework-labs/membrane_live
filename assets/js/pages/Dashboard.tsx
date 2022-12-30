import { useContext, useEffect, useState } from "react";
import WelcomePanel from "../components/dashboard/WelcomePanel";
import SearchAndCreatePanel from "../components/dashboard/SearchAndCreatePanel";
import SideDashboardPanel from "../components/dashboard/SideDashboardPanel";
import EventsArea from "../components/dashboard/EventsArea";
import { pageTitlePrefix } from "../utils/const";
import { ScreenTypeContext } from "../utils/ScreenTypeContext";
import type { CurrentEvents } from "../types/types";
import "../../css/dashboard/dashboard.css";

const Dashboard = () => {
  const [searchText, setSearchText] = useState("");
  const [currentEvents, setCurrentEvents] = useState<CurrentEvents>("All events");
  const screenType = useContext(ScreenTypeContext);

  useEffect(() => {
    document.title = pageTitlePrefix;
  }, []);

  return (
    <div className="Dashboard">
      {screenType.device == "desktop" && (
        <SideDashboardPanel currentEvents={currentEvents} setCurrentEvents={setCurrentEvents} />
      )}
      <div className="MainDashboardArea">
        <WelcomePanel currentEvents={currentEvents} setCurrentEvents={setCurrentEvents} />
        <SearchAndCreatePanel currentEvents={currentEvents} searchText={searchText} setSearchText={setSearchText} />
        <EventsArea searchText={searchText} currentEvents={currentEvents} />
      </div>
    </div>
  );
};

export default Dashboard;
