import React, { useEffect, useState } from "react";
import WelcomePanel from "../components/dashboard/WelcomePanel";
import SearchAndCreatePanel from "../components/dashboard/SearchAndCreatePanel";
import SideDashboardPanel from "../components/dashboard/SideDashboardPanel";
import EventsArea from "../components/dashboard/EventsArea";
import { pageTitlePrefix } from "../utils/const";
import useCheckScreenType from "../utils/hooks";
import "../../css/dashboard/dashboard.css";

const Dashboard = () => {
  const [searchText, setSearchText] = useState("");
  const [currentEvents, setCurrentEvents] = useState("All events");
  const screenType = useCheckScreenType();

  useEffect(() => {
    document.title = pageTitlePrefix;
  }, []);

  return (
    <div className="Dashboard">
      {screenType.device == "normal" && (
        <SideDashboardPanel currentEvents={currentEvents} setCurrentEvents={setCurrentEvents} />
      )}
      <div className="MainDashboardArea">
        <WelcomePanel currentEvents={currentEvents} setCurrentEvents={setCurrentEvents} />
        <SearchAndCreatePanel
          currentEvents={currentEvents}
          searchText={searchText}
          setSearchText={setSearchText}
        />
        <EventsArea searchText={searchText} currentEvents={currentEvents} />
      </div>
    </div>
  );
};

export default Dashboard;
