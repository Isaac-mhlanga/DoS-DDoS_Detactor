import { useState, useEffect } from "react";
import StatusBar from "./StatusBar";
import Sidebar from "./Sidebar";
import DashboardView from "./MainContent/DashboardView";
import MLModelView from "./MainContent/MLModelView";
import FirewallView from "./MainContent/FirewallView";
import ThreatsView from "./MainContent/ThreatsView";
import LogsView from "./MainContent/LogsView";
import Settings from "./Settings";

const Dashboard = ({ setIsLoggedIn }) => {
  const [mlModelStatus, setMlModelStatus] = useState({
    accuracy: 98.7,
    latency: 42,
    active: true,
    trainingDataSize: "2.4TB",
    lastTraining: "2023-11-15",
    detectionRate: "99.2%",
    falsePositives: "0.8%",
    modelVersion: "v4.2.1",
    features: [
      "Network Patterns",
      "Behavior Analysis",
      "Anomaly Detection",
      "Signature Matching",
    ],
  });

  const [firewallRules, setFirewallRules] = useState([
    { id: 1, rule: "Block SSH on port 22", active: true },
    { id: 2, rule: "Block HTTP on port 80", active: false },
    { id: 3, rule: "Allow HTTPS on port 443", active: true },
  ]);

  const [showSettings, setShowSettings] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  useEffect(() => {
    const statusInterval = setInterval(() => {
      setMlModelStatus((prev) => ({
        ...prev,
        accuracy: Math.min(99.9, prev.accuracy + (Math.random() - 0.5)),
        latency: Math.max(20, prev.latency + (Math.random() - 0.5)),
        detectionRate: `${(98.5 + Math.random() * 1.5).toFixed(1)}%`,
        falsePositives: `${(0.5 + Math.random() * 0.6).toFixed(1)}%`,
      }));
    }, 5000);

    return () => clearInterval(statusInterval);
  }, []);

  const renderActiveSection = () => {
    switch (activeSection) {
      case "firewall":
        return (
          <FirewallView
            firewallRules={firewallRules}
            setFirewallRules={setFirewallRules}
          />
        );
      case "threats":
        return <ThreatsView />;
      case "logs":
        return <LogsView />;
      case "mlmodel":
        return <MLModelView mlModelStatus={mlModelStatus} />;
      case "settings":
        return <Settings />;
      case "dashboard":
      default:
        return (
          <DashboardView
            mlModelStatus={mlModelStatus}
            firewallRules={firewallRules}
            setFirewallRules={setFirewallRules}
          />
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <StatusBar
        setIsLoggedIn={setIsLoggedIn}
        setShowSettings={setShowSettings}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />

        <main className="flex-1 overflow-auto">{renderActiveSection()}</main>
      </div>
    </div>
  );
};

export default Dashboard;
