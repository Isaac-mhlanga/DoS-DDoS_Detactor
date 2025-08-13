import { useState } from "react";
import {
  FiGrid,
  FiCpu,
  FiShield,
  FiAlertTriangle,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiUser,
  FiLoader,
} from "react-icons/fi";
import { useAuth } from "../../context/authContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ activeSection, setActiveSection }) => {
  const { currentUser, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { icon: FiGrid, label: "Dashboard", section: "dashboard" },
    // { icon: FiCpu, label: "AI Model", section: "mlmodel" },
    { icon: FiShield, label: "Firewall", section: "firewall" },
    { icon: FiAlertTriangle, label: "Alerts", section: "threats" },
    { icon: FiSettings, label: "Settings", section: "settings" },
  ];

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="w-20 md:w-64 h-screen bg-gray-800 flex flex-col justify-between p-2 md:p-4 border-r border-gray-700">
      <div className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.section}
              onClick={() => setActiveSection(item.section)}
              className={`flex items-center justify-center md:justify-start w-full p-3 rounded-lg transition-colors ${
                activeSection === item.section
                  ? "bg-cyan-700 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <Icon className="w-6 h-6 md:mr-3" />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User Section */}
      <div className="space-y-2">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`flex items-center justify-center md:justify-start w-full p-3 rounded-lg transition-colors ${
            isLoggingOut
              ? "text-gray-500 cursor-not-allowed"
              : "text-red-400 hover:bg-gray-700"
          }`}
        >
          {isLoggingOut ? (
            <FiLoader className="w-6 h-6 md:mr-3 animate-spin" />
          ) : (
            <FiLogOut className="w-6 h-6 md:mr-3" />
          )}
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
