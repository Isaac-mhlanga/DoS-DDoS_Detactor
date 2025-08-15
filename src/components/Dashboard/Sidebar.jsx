import { useState } from "react";
import {
  FiGrid,
  FiShield,
  FiAlertTriangle,
  FiSettings,
  FiLogOut,
  FiUser,
  FiLoader,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";
import { useAuth } from "../../context/authContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ activeSection, setActiveSection }) => {
  const { currentUser, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { icon: FiGrid, label: "Dashboard", section: "dashboard" },
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
    <div className={`relative h-full ${isCollapsed ? "w-20" : "w-64"}`}>
      <nav 
        className={`h-full bg-gradient-to-b from-gray-900 to-gray-850 flex flex-col justify-between p-4 border-r border-gray-700 transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Collapse Button with Horizontal Spacing */}
        <div className="absolute ml-5 top-8 -right-4 z-10">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="bg-gray-800/50 p-1.5 rounded-full border border-gray-600 hover:bg-gray-700 transition-colors shadow-lg"
          >
            {isCollapsed ? (
              <FiChevronRight className="text-gray-300 w-4 h-4" />
            ) : (
              <FiChevronLeft className="text-gray-300 w-4 h-4" />
            )}
          </button>
        </div>

      
        <div className="ml-1"> {/* Added horizontal spacing here */}
          {/* User Profile */}
          {currentUser && (
            <div className={`flex items-center mb-6 p-3 rounded-lg bg-gray-800/50 ${isCollapsed ? "justify-center" : ""}`}>
              <div className="bg-cyan-500/10 p-2 rounded-full">
                <FiUser className="text-cyan-400 text-xl" />
              </div>
              {!isCollapsed && (
                <div className="ml-3 overflow-hidden">
                  <p className="font-medium text-white truncate">{currentUser.email}</p>
                  <p className="text-xs text-cyan-400 truncate">Administrator</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Items */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.section}
                  onClick={() => setActiveSection(item.section)}
                  className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 ${
                    activeSection === item.section
                      ? "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-700/50"
                  } ${isCollapsed ? "justify-center" : ""}`}
                >
                  <div className={`${activeSection === item.section ? "text-white" : "text-cyan-400"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {!isCollapsed && (
                    <span className="ml-3 font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Logout Button with Horizontal Spacing */}
        <div className="mt-auto ml-1"> 
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              isLoggingOut
                ? "text-gray-500 cursor-not-allowed"
                : "text-red-400 hover:bg-red-900/20"
            } ${isCollapsed ? "justify-center" : ""}`}
          >
            {isLoggingOut ? (
              <FiLoader className="w-5 h-5 animate-spin" />
            ) : (
              <FiLogOut className="w-5 h-5" />
            )}
            {!isCollapsed && <span className="ml-3 font-medium">Logout</span>}
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;