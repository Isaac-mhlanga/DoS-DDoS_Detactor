import { FiUser } from "react-icons/fi";
import { useAuth } from "../../context/authContext";

const StatusBar = ({ setIsLoggedIn, setShowSettings }) => {
  const { currentUser } = useAuth();

  return (
    <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <span className="font-mono text-sm">Security System: Active</span>
      </div>
      <button
        onClick={() => setShowSettings(true)}
        className="p-2 text-gray-400 hover:text-cyan-400 flex items-center space-x-2 transition-colors"
      >
        <FiUser className="w-5 h-5" />
        <span>Welcome, {currentUser?.displayName || "User"}</span>
      </button>
    </div>
  );
};

export default StatusBar;
