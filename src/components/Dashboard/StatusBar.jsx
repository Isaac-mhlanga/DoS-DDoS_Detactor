import { FiUser, FiShield, FiSettings } from "react-icons/fi";
import { useAuth } from "../../context/authContext";

const StatusBar = ({ setIsLoggedIn, setShowSettings }) => {
  const { currentUser } = useAuth();

  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 to-gray-850 border border-gray-700 shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-gray-900"></div>
          <div className="p-2 bg-green-500/10 rounded-lg">
            <FiShield className="text-green-400 text-lg" />
          </div>
        </div>
        <div>
          <span className="text-gray-400 text-sm">Security Status</span>
          <div className="flex items-center">
            <span className="font-medium text-white">Active Protection</span>
            <span className="ml-2 text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
              Secure
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
    
        <div className="flex items-center space-x-2 group cursor-pointer">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <FiUser className="text-blue-400" />
          </div>
          <div>
            <span className="text-gray-400 text-sm">Welcome back</span>
            <div className="font-medium text-white group-hover:text-cyan-300 transition-colors">
              {currentUser?.displayName || "Administrator"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;