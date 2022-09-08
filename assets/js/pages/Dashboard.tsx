import React from "react";
import WelcomePanel from "../components/WelcomePanel";
import SearchAndCreatePanel from "../components/SearchAndCreatePanel";
import SideDashboardPanel from "../components/SideDashboardPanel";
import EventsArea from "../components/EventsArea";
import "../../css/dashboard.css";

const Dashboard = () => {
  return (
    <div className="Dashboard">
      <SideDashboardPanel />
      <div className="MainDashboardArea">
        <WelcomePanel />
        <SearchAndCreatePanel />
        <EventsArea />
      </div>
    </div>
  );
}

export default Dashboard;