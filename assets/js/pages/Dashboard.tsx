import React, { useState } from "react";
import WelcomePanel from "../components/WelcomePanel";
import SearchAndCreatePanel from "../components/SearchAndCreatePanel";
import SideDashboardPanel from "../components/SideDashboardPanel";
import EventsArea from "../components/EventsArea";
import "../../css/dashboard.css";

const Dashboard = () => {
  const [searchText, setSearchText] = useState("");
  const [currentEvents, setCurrentEvents] = useState("All events");

  return (
    <div className="Dashboard">
      <SideDashboardPanel currentEvents={currentEvents} setCurrentEvents={setCurrentEvents}/>
      <div className="MainDashboardArea">
        <WelcomePanel />
        <SearchAndCreatePanel searchText={searchText} setSearchText={setSearchText}/>
        <EventsArea searchText={searchText} currentEvents={currentEvents}/>
      </div>
    </div>
  );
}

export default Dashboard;