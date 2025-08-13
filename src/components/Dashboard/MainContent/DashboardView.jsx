import { useEffect, useState } from "react";
import {
  FiActivity,
  FiServer,
  FiCpu,
  FiHardDrive,
  FiShield,
  FiBarChart2,
} from "react-icons/fi";

const DashboardView = () => {
  // State management
  const [systemStats, setSystemStats] = useState({
    cpu: 0,
    memory_percent: 0,
    memory_used_mb: 0,
    memory_total_mb: 0,
    uptime: 0,
    platform: "Unknown",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [suricataStatus, setSuricataStatus] = useState(null);
  const [firewallStats, setFirewallStats] = useState(null);
  const [mlStatus, setMlStatus] = useState(null);
  const [isSecurityLoading, setIsSecurityLoading] = useState(true);

  // Fetch system stats with polling
  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        const res = await fetch("http://localhost:5050/api/system/stats");
        const data = await res.json();
        setSystemStats(data);
        setIsLoading(false);
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
        const [suricataRes, firewallRes, mlRes] = await Promise.all([
          fetch("http://localhost:5050/suricata/status"),
          fetch("http://localhost:5050/firewall/stats"),
          fetch("http://localhost:5050/ml/status"),
        ]);

        setSuricataStatus(await suricataRes.json());
        setFirewallStats(await firewallRes.json());
        setMlStatus(await mlRes.json());

        setIsSecurityLoading(false);
      } catch (error) {
        console.error("Failed to fetch security status:", error);
        setIsSecurityLoading(false);
      }
    };

    fetchSecurityStatus();
    const interval = setInterval(fetchSecurityStatus, 30000);
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

  const formatMemory = (value) =>
    typeof value === "number" ? value.toFixed(1) : "0.0";

  // Parse Suricata status
  const parseSuricataStatus = (status) => {
    if (!status) return {};

    const activeMatch = status.match(/Active: (.+?) since/);
    const uptimeMatch = status.match(/since (.+?)\n/);
    const memoryMatch = status.match(/Memory: (.+?) \(peak/);
    const cpuMatch = status.match(/CPU: (.+?)\n/);

    return {
      active: activeMatch?.[1] || "unknown",
      uptime: uptimeMatch?.[1] || "N/A",
      memory: memoryMatch?.[1] || "N/A",
      cpu: cpuMatch?.[1] || "N/A",
      raw: status,
    };
  };

  const suricata = parseSuricataStatus(suricataStatus?.status);

  // Firewall status indicator
  const getFirewallStatus = () => {
    if (!firewallStats) return "loading";

    const hasRestrictivePolicy = ["DROP", "REJECT"].includes(
      firewallStats.chains?.INPUT?.policy
    );

    const hasRules = firewallStats.chains?.INPUT?.rules?.length > 0;

    return hasRestrictivePolicy && hasRules ? "active" : "inactive";
  };

  // Component rendering
  return (
    <div className="p-6 bg-gray-900 rounded-xl shadow-lg">
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-300 mb-5 pb-2 border-b border-gray-700">
          System Monitoring
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* CPU Usage Card */}
            <DashboardCard
              icon={<FiCpu className="text-blue-400" />}
              title="CPU Usage"
              value={`${cpu}%`}
              status={cpu > 85 ? "critical" : cpu > 70 ? "warning" : "healthy"}
              progressValue={cpu}
              additionalInfo={null}
              borderColor="border-blue-500"
            />

            {/* Memory Usage Card */}
            <DashboardCard
              icon={<FiHardDrive className="text-purple-400" />}
              title="Memory Usage"
              value={`${memory_percent}%`}
              status={
                memory_percent > 85
                  ? "critical"
                  : memory_percent > 70
                  ? "warning"
                  : "healthy"
              }
              progressValue={memory_percent}
              additionalInfo={
                <div className="text-sm text-gray-400">
                  {formatMemory(usedMem)}/{formatMemory(totalMem)} MB
                </div>
              }
              borderColor="border-purple-500"
            />

            {/* System Health Card */}
            <DashboardCard
              icon={
                <div
                  className={`w-3 h-3 rounded-full ${
                    systemStatus === "Stressed"
                      ? "bg-red-500"
                      : systemStatus === "Moderate"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                />
              }
              title="System Health"
              value={systemStatus}
              status={systemStatus.toLowerCase()}
              progressValue={0}
              additionalInfo={
                <div className="text-sm text-gray-400">{platform}</div>
              }
              borderColor="border-green-500"
            />

            {/* Uptime Card */}
            <DashboardCard
              icon={<FiActivity className="text-cyan-400" />}
              title="System Uptime"
              value={formatUptime(uptime)}
              status="healthy"
              progressValue={0}
              additionalInfo={
                <div className="text-sm text-gray-400">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              }
              borderColor="border-cyan-500"
            />
          </div>
        )}
      </section>

      {/* Security Services Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-300 mb-5 pb-2 border-b border-gray-700">
          Security Services
        </h2>

        {isSecurityLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Suricata Status Card */}
            <SecurityServiceCard
              icon={<FiShield className="text-yellow-400" />}
              title="Suricata IDS"
              status={
                suricata.active.includes("active") ? "active" : "inactive"
              }
              borderColor="border-yellow-500"
            >
              {suricataStatus ? (
                <>
                  <InfoRow label="Status" value={suricata.active} />
                  <InfoRow label="Uptime" value={suricata.uptime} />
                  <InfoRow label="Memory" value={suricata.memory} />
                  <InfoRow label="CPU" value={suricata.cpu} />

                  <details className="mt-3 text-sm text-gray-400 cursor-pointer">
                    <summary className="font-medium">View details</summary>
                    <pre className="mt-2 p-2 bg-gray-700 rounded text-xs overflow-x-auto">
                      {suricata.raw}
                    </pre>
                  </details>
                </>
              ) : (
                <div className="text-red-400">Failed to load status</div>
              )}
            </SecurityServiceCard>

            {/* Firewall Status Card */}
            <SecurityServiceCard
              icon={<FiShield className="text-red-400" />}
              title="Firewall (IPTables)"
              status={getFirewallStatus()}
              borderColor="border-red-500"
            >
              {firewallStats ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <InfoItem
                      label="INPUT Rules"
                      value={firewallStats.chains?.INPUT?.rules?.length || 0}
                    />
                    <InfoItem
                      label="OUTPUT Rules"
                      value={firewallStats.chains?.OUTPUT?.rules?.length || 0}
                    />
                    <InfoItem
                      label="FORWARD Rules"
                      value={firewallStats.chains?.FORWARD?.rules?.length || 0}
                    />
                    <InfoItem
                      label="Blocked IPs"
                      value={firewallStats.blockedIPs || 0}
                    />
                  </div>

                  <InfoRow
                    label="Default Policy"
                    value={firewallStats.chains?.INPUT?.policy || "Unknown"}
                  />
                </>
              ) : (
                <div className="text-red-400">Failed to load stats</div>
              )}
            </SecurityServiceCard>

            {/* Machine Learning Status Card */}
            <SecurityServiceCard
              icon={<FiBarChart2 className="text-purple-400" />}
              title="DDoS Detection AI"
              status={mlStatus?.status}
              borderColor="border-purple-500"
            >
              {mlStatus ? (
                <>
                  <div className="text-xs text-gray-400 mb-3 italic">
                    Under development - detects 12 types of DDoS attacks
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <MetricCard
                      label="Accuracy"
                      value={`${mlStatus.accuracy}%`}
                    />
                    <MetricCard
                      label="Precision"
                      value={`${mlStatus.precision}%`}
                    />
                    <MetricCard label="Recall" value={`${mlStatus.recall}%`} />
                    <MetricCard label="F1 Score" value={`${mlStatus.f1}%`} />
                  </div>

                  <InfoRow
                    label="Training Data"
                    value={mlStatus.trainingData}
                  />
                  <InfoRow
                    label="DDoS Types Detected"
                    value={`${mlStatus.dosTypesDetected} of 12`}
                  />
                </>
              ) : (
                <div className="text-red-400">Failed to load status</div>
              )}
            </SecurityServiceCard>
          </div>
        )}
      </section>
    </div>
  );
};

// Reusable Dashboard Card Component
const DashboardCard = ({
  icon,
  title,
  value,
  status,
  progressValue,
  additionalInfo,
  borderColor,
}) => (
  <div className={`bg-gray-800 p-5 rounded-lg border-l-4 ${borderColor}`}>
    <div className="flex items-center mb-3">
      {icon}
      <h3 className="font-semibold text-gray-300 ml-2">{title}</h3>
    </div>

    <div
      className={`text-3xl font-bold ${
        status === "critical"
          ? "text-red-400"
          : status === "warning"
          ? "text-yellow-400"
          : "text-green-400"
      }`}
    >
      {value}
    </div>

    {additionalInfo}

    {progressValue > 0 && (
      <div className="mt-3 w-full bg-gray-700 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${
            status === "critical"
              ? "bg-red-500"
              : status === "warning"
              ? "bg-yellow-500"
              : "bg-green-500"
          }`}
          style={{ width: `${progressValue}%` }}
        ></div>
      </div>
    )}
  </div>
);

// Reusable Security Service Card
const SecurityServiceCard = ({
  icon,
  title,
  status,
  borderColor,
  children,
}) => (
  <div className={`bg-gray-800 p-5 rounded-lg border-l-4 ${borderColor}`}>
    <div className="flex items-center mb-4">
      {icon}
      <h3 className="font-semibold text-gray-300 ml-2">{title}</h3>
      <span
        className={`ml-auto px-2 py-1 rounded text-xs ${
          status === "active"
            ? "bg-green-900 text-green-300"
            : status === "training"
            ? "bg-yellow-900 text-yellow-300"
            : "bg-red-900 text-red-300"
        }`}
      >
        {status === "active"
          ? "Active"
          : status === "training"
          ? "Training"
          : status === "inactive"
          ? "Inactive"
          : status}
      </span>
    </div>

    <div className="space-y-2">{children}</div>
  </div>
);

// Reusable Info Row Component
const InfoRow = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="font-medium text-gray-400">{label}:</span>
    <span className="text-white">{value}</span>
  </div>
);

// Reusable Info Item Component
const InfoItem = ({ label, value }) => (
  <div>
    <div className="font-medium text-gray-400 text-sm">{label}</div>
    <div className="text-white text-lg">{value}</div>
  </div>
);

// Reusable Metric Card Component
const MetricCard = ({ label, value }) => (
  <div className="bg-gray-700 p-2 rounded">
    <div className="text-gray-400 text-xs">{label}</div>
    <div className="text-white font-medium">{value}</div>
  </div>
);

export default DashboardView;
