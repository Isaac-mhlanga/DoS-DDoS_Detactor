import React, { useEffect, useState } from "react";
import {
  FiActivity,
  FiServer,
  FiCpu,
  FiHardDrive,
  FiShield,
  FiBarChart2,
  FiRefreshCw,
  FiClock,
  FiAlertCircle,
  FiTrendingUp,
  FiZap,
  FiShieldOff,
  FiDatabase,
  FiGlobe,
  FiPieChart,
} from "react-icons/fi";

const DashboardView = () => {
  // State management
  const [systemStats, setSystemStats] = useState({
    cpu: 0,
    memory_percent: 0,
    memory_used_mb: 0,
    memory_total_mb: 0,
    uptime: 0,
    platform: "Loading...",
    network_in: 0,
    network_out: 0,
    processes: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [suricataStatus, setSuricataStatus] = useState(null);
  const [firewallStats, setFirewallStats] = useState(null);
  const [trafficStats, setTrafficStats] = useState(null);
  const [threatLog, setThreatLog] = useState("");
  const [isSecurityLoading, setIsSecurityLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch system stats with polling
  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        const res = await fetch("http://localhost:5050/api/system/stats");
        const data = await res.json();
        setSystemStats(data);
        setIsLoading(false);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to fetch system stats:", error);
        setIsLoading(false);
      }
    };

    fetchSystemStats();
    const interval = setInterval(fetchSystemStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch security services status
  useEffect(() => {
    const fetchSecurityStatus = async () => {
      try {
        const [suricataRes, firewallRes, trafficRes, threatLogRes] =
          await Promise.all([
            fetch("http://localhost:5050/suricata/status"),
            fetch("http://localhost:5050/firewall/stats"),
            fetch("http://localhost:5050/network/traffic"),
            fetch("http://localhost:5050/suricata/threat-log"),
          ]);

        setSuricataStatus(await suricataRes.json());
        setFirewallStats(await firewallRes.json());
        setTrafficStats(await trafficRes.json());
        setThreatLog((await threatLogRes.json()).log);
        setIsSecurityLoading(false);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to fetch security status:", error);
        setIsSecurityLoading(false);
      }
    };

    fetchSecurityStatus();
    const interval = setInterval(fetchSecurityStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Destructure system metrics
  const {
    cpu = 0,
    memory_percent = 0,
    memory_used_mb: usedMem = 0,
    memory_total_mb: totalMem = 0,
    uptime = 0,
    platform = "Unknown",
    processes = 0,
  } = systemStats;

  // Calculate system health status
  const systemStatus =
    cpu > 85 || memory_percent > 85
      ? "Stressed"
      : cpu > 70 || memory_percent > 70
      ? "Moderate"
      : "Healthy";

  // Formatting utilities
  const formatUptime = (seconds) => {
    if (typeof seconds !== "number") return "N/A";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i]);
  };

  // Parse Suricata status
  const parseSuricataStatus = (status) => {
    if (!status || !status.status) return {};

    const statusText = status.status;
    const activeMatch = statusText.match(/Active: (.+?) \(/);
    const uptimeMatch = statusText.match(/since (.+?)\n/);
    const memoryMatch = statusText.match(/Memory: (.+?)\n/);
    const cpuMatch = statusText.match(/CPU: (.+?)\n/);
    const versionMatch = statusText.match(/Version: (.+?)\n/);
    const threadsMatch = statusText.match(/Threads: (.+?)\n/);
    const alertsMatch = statusText.match(/Alerts: (.+?)\n/);

    return {
      active: activeMatch?.[1] || "unknown",
      uptime: uptimeMatch?.[1] || "N/A",
      memory: memoryMatch?.[1] || "N/A",
      cpu: cpuMatch?.[1] || "N/A",
      version: versionMatch?.[1] || "Unknown",
      threads: threadsMatch?.[1] || "0",
      alerts: alertsMatch?.[1] || "0",
      raw: statusText,
    };
  };

  const suricata = parseSuricataStatus(suricataStatus);

  // Firewall status indicator
  const getFirewallStatus = () => {
    if (!firewallStats) return "loading";

    const hasRestrictivePolicy = ["DROP", "REJECT"].includes(
      firewallStats.chains?.INPUT?.policy
    );

    const hasRules = firewallStats.chains?.INPUT?.rules?.length > 0;

    return hasRestrictivePolicy && hasRules ? "active" : "inactive";
  };

  // Radial progress component
  const RadialProgress = ({ value, size = 120, strokeWidth = 10 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const dash = (value * circumference) / 100;

    const getColor = (val) => {
      if (val > 85) return "#EF4444";
      if (val > 70) return "#F59E0B";
      return "#10B981";
    };

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#2D3748"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor(value)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - dash}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{value}%</span>
        </div>
      </div>
    );
  };

  // Refresh all data
  const refreshAllData = async () => {
    setIsLoading(true);
    setIsSecurityLoading(true);
    try {
      const [systemRes, suricataRes, firewallRes, trafficRes, threatLogRes] =
        await Promise.all([
          fetch("http://localhost:5050/api/system/stats"),
          fetch("http://localhost:5050/suricata/status"),
          fetch("http://localhost:5050/firewall/stats"),
          fetch("http://localhost:5050/network/traffic"),
          fetch("http://localhost:5050/suricata/threat-log"),
        ]);

      setSystemStats(await systemRes.json());
      setSuricataStatus(await suricataRes.json());
      setFirewallStats(await firewallRes.json());
      setTrafficStats(await trafficRes.json());
      setThreatLog((await threatLogRes.json()).log);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
    setIsLoading(false);
    setIsSecurityLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-850 p-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <FiShield className="mr-3 text-blue-400" />
            Network Security Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Real-time monitoring of system resources and security services
          </p>
        </div>

        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <div className="flex items-center bg-gray-800 px-4 py-2 rounded-lg">
            <FiClock className="text-gray-400 mr-2" />
            <span className="text-gray-300">
              {lastUpdated.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <button
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center transition-colors"
            onClick={refreshAllData}
          >
            <FiRefreshCw className="mr-2" />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-850 p-5 rounded-xl border border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500/10 rounded-lg mr-4">
              <FiServer className="text-blue-400 text-xl" />
            </div>
            <div>
              <h3 className="text-gray-400 text-sm">System Health</h3>
              <div className="flex items-center mt-1">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    systemStatus === "Stressed"
                      ? "bg-red-500 animate-pulse"
                      : systemStatus === "Moderate"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                />
                <span className="text-white text-lg font-medium">
                  {systemStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-850 p-5 rounded-xl border border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500/10 rounded-lg mr-4">
              <FiShield className="text-purple-400 text-xl" />
            </div>
            <div>
              <h3 className="text-gray-400 text-sm">Threats Detected</h3>
              <div className="text-white text-lg font-medium mt-1">
                {suricata?.alerts || "0"}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-850 p-5 rounded-xl border border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-green-500/10 rounded-lg mr-4">
              <FiZap className="text-green-400 text-xl" />
            </div>
            <div>
              <h3 className="text-gray-400 text-sm">System Uptime</h3>
              <div className="text-white text-lg font-medium mt-1">
                {formatUptime(uptime)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-850 p-5 rounded-xl border border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-red-500/10 rounded-lg mr-4">
              <FiAlertCircle className="text-red-400 text-xl" />
            </div>
            <div>
              <h3 className="text-gray-400 text-sm">Blocked IPs</h3>
              <div className="text-white text-lg font-medium mt-1">
                {firewallStats?.blockedIPs || "0"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2">
          {/* CPU/Memory Section */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl border border-gray-700 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <FiCpu className="mr-2 text-blue-400" />
                System Resources
              </h2>
              <div className="text-sm text-gray-400">
                Updated every 5 seconds
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gray-400">CPU Utilization</h3>
                    <span className="text-white font-medium">{cpu}%</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <RadialProgress value={cpu} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gray-400">Memory Usage</h3>
                    <span className="text-white font-medium">
                      {memory_percent}%
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <RadialProgress value={memory_percent} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security Services Status */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <FiShield className="mr-2 text-yellow-400" />
                Security Services Status
              </h2>
              <div className="text-sm text-gray-400">
                Updated every 10 seconds
              </div>
            </div>

            {isSecurityLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Suricata Card */}
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg mr-3">
                      <FiShield className="text-yellow-400" />
                    </div>
                    <h3 className="text-white font-medium">Suricata IDS</h3>
                    <span className="ml-auto text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                      {suricata.active && suricata.active.includes("active")
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    <div className="flex justify-between py-1">
                      <span>Version:</span>
                      <span className="text-white">{suricata.version}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>CPU Usage:</span>
                      <span className="text-white">{suricata.cpu}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Memory:</span>
                      <span className="text-white">{suricata.memory}</span>
                    </div>
                  </div>
                </div>

                {/* Firewall Card */}
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-red-500/10 rounded-lg mr-3">
                      <FiShieldOff className="text-red-400" />
                    </div>
                    <h3 className="text-white font-medium">Firewall</h3>
                    <span className="ml-auto text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                      {getFirewallStatus() === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    <div className="flex justify-between py-1">
                      <span>Blocked IPs:</span>
                      <span className="text-white">
                        {firewallStats?.blockedIPs || 0}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>INPUT Policy:</span>
                      <span className="text-white">
                        {firewallStats?.chains?.INPUT?.policy || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Rules:</span>
                      <span className="text-white">
                        {firewallStats?.chains?.INPUT?.rules?.length || 0}{" "}
                        active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          {/* System Info */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl border border-gray-700 p-6 mb-8">
            <h2 className="text-xl font-bold text-white flex items-center mb-6">
              <FiServer className="mr-2 text-cyan-400" />
              System Information
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Platform</span>
                  <span className="text-white font-medium">{platform}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Uptime</span>
                  <span className="text-white font-medium">
                    {formatUptime(uptime)}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-gray-700">
                  <span className="text-gray-400">Processes</span>
                  <span className="text-white font-medium">{processes}</span>
                </div>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white flex items-center mb-6">
              <FiTrendingUp className="mr-2 text-green-400" />
              Performance Metrics
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>CPU Load</span>
                  <span>{cpu}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-full rounded-full ${
                      cpu > 85
                        ? "bg-red-500"
                        : cpu > 70
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${cpu}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Memory Usage</span>
                  <span>{memory_percent}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-full rounded-full ${
                      memory_percent > 85
                        ? "bg-red-500"
                        : memory_percent > 70
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${memory_percent}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>System Health</span>
                  <span>{systemStatus}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-full rounded-full ${
                      systemStatus === "Stressed"
                        ? "bg-red-500"
                        : systemStatus === "Moderate"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width:
                        systemStatus === "Stressed"
                          ? "100%"
                          : systemStatus === "Moderate"
                          ? "70%"
                          : "40%",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Threat Log Section */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl border border-gray-700 p-6 mt-6">
        <h2 className="text-xl font-bold text-white flex items-center mb-6">
          <FiAlertCircle className="mr-2 text-red-400" />
          Threat Log
        </h2>

        <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
            {threatLog || "No threats logged yet..."}
          </pre>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        Network Security Dashboard • Last updated:{" "}
        {lastUpdated.toLocaleString()}
      </div>
    </div>
  );
};

export default DashboardView;
