import React from "react";
import WelcomePanel from "../components/WelcomePanel";
import SearchAndCreatePanel from "../components/SearchAndCreatePanel";
import SideDashboardPanel from "../components/SideDashboardPanel";
import EventsList from "../components/EventsList";
import "../../css/dashboard.css";

const Dashboard = () => {



  return (
    <div className="Dashboard">
      <SideDashboardPanel />
      <div className="MainDashboardArea">
        <WelcomePanel />
        <SearchAndCreatePanel />
        <EventsList />
      </div>
    </div>
  );
}

export default Dashboard;