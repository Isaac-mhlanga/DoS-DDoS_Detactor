import React, { useState, useEffect } from "react";
import {
  FiShield,
  FiPlus,
  FiRefreshCw,
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
  FiWifi,
  FiWifiOff,
} from "react-icons/fi";

// Reusable components (unchanged)
const StatusBadge = ({ isConnected }) => (
  <div
    className={`ml-4 flex items-center px-3 py-1 rounded-md ${
      isConnected ? "bg-green-900/30" : "bg-red-900/30"
    }`}
  >
    <div
      className={`w-3 h-3 rounded-full mr-2 ${
        isConnected ? "bg-green-500" : "bg-red-500"
      }`}
    ></div>
    <span className="text-sm font-medium flex items-center">
      {isConnected ? (
        <>
          <FiWifi className="mr-1" /> Connected
        </>
      ) : (
        <>
          <FiWifiOff className="mr-1" /> Disconnected
        </>
      )}
    </span>
  </div>
);

const SeverityBadge = ({ severity }) => (
  <span
    className={`px-2 py-1 text-xs rounded-full ${
      severity === "high"
        ? "bg-red-900 text-red-300"
        : severity === "medium"
        ? "bg-yellow-800 text-yellow-300"
        : "bg-green-900 text-green-300"
    }`}
  >
    {severity}
  </span>
);

const RuleTypeBadge = ({ type }) => (
  <span className="px-2 py-1 bg-gray-600 rounded-full text-xs capitalize">
    {type}
  </span>
);

const PaginationButton = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-1 rounded ${
      disabled
        ? "text-gray-600 cursor-not-allowed"
        : "text-gray-300 hover:bg-gray-700"
    }`}
  >
    {children}
  </button>
);

const StatCard = ({ title, value, description, icon }) => (
  <div className="bg-gray-700 p-4 rounded-lg h-full">
    <h3 className="text-lg font-semibold mb-2 flex items-center">
      {icon}
      {title}
    </h3>
    <p className="text-3xl font-mono">{value}</p>
    <p className="text-sm text-gray-400 mt-1">{description}</p>
  </div>
);

export default function FirewallView() {
  // State management
  const [firewallRules, setFirewallRules] = useState([]);
  const [newRule, setNewRule] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rulesPerPage] = useState(5);
  const [isConnected, setIsConnected] = useState(true);

  // Fetch firewall rules from API
  const fetchFirewallRules = async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:5050/firewall/rules");
      if (!res.ok) throw new Error("Failed to fetch rules");

      const data = await res.json();
      const allParsedRules = [];

      // Process rules from API response
      if (data.chains) {
        Object.entries(data.chains).forEach(([chainName, chainData]) => {
          if (chainData.rules && Array.isArray(chainData.rules)) {
            chainData.rules.forEach((r, index) => {
              const type =
                chainName === "INPUT"
                  ? "inbound"
                  : chainName === "FORWARD"
                  ? "internal"
                  : "outbound";

              const severity =
                r.target === "DROP"
                  ? "high"
                  : r.target === "REJECT"
                  ? "medium"
                  : "low";

              allParsedRules.push({
                id: `${chainName}-${index}-${Date.now()}`,
                rule: `${r.target} ${
                  r.prot?.toUpperCase() || "ALL"
                } traffic from ${r.source || "anywhere"} to ${
                  r.destination || "anywhere"
                } ${r.extra || ""}`.trim(),
                active: true,
                type,
                severity,
                chain: chainName,
                ruleNum: r.num,
              });
            });
          }
        });
      }

      setFirewallRules(allParsedRules);
      setIsConnected(true);
    } catch (error) {
      console.error("Failed to fetch firewall rules", error);
      setError("Failed to load firewall rules. Server might be offline.");
      setIsConnected(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial data fetch and periodic refresh
  useEffect(() => {
    fetchFirewallRules();
    const interval = setInterval(fetchFirewallRules, 30000);
    return () => clearInterval(interval);
  }, []);

  // Add new firewall rule (FIXED)
  const addRule = async () => {
    if (!newRule.trim()) return;

    try {
      // Parse rule components
      const portMatch = newRule.match(/(?:port|ports?)\s+(\d+)/i);
      const sourceMatch = newRule.match(/from\s+([\w\.\/:]+)/i);
      const destinationMatch = newRule.match(/to\s+([\w\.\/:]+)/i);
      const actionMatch = newRule.match(/^(block|allow|drop|reject)/i);

      if (!portMatch) {
        alert("Please specify a port (e.g. 'port 22')");
        return;
      }

      // Map action to iptables target
      const action = actionMatch?.[1].toLowerCase();
      let target;
      if (action === "block" || action === "drop") {
        target = "DROP";
      } else if (action === "allow") {
        target = "ACCEPT";
      } else if (action === "reject") {
        target = "REJECT";
      } else {
        target = "DROP"; // Default
      }

      // Handle "any" values
      const source =
        sourceMatch?.[1]?.toLowerCase() === "any"
          ? "0.0.0.0/0"
          : sourceMatch?.[1] || "0.0.0.0/0";

      const destination =
        destinationMatch?.[1]?.toLowerCase() === "any"
          ? "0.0.0.0/0"
          : destinationMatch?.[1] || "0.0.0.0/0";

      // Prepare payload
      const payload = {
        chain: "INPUT",
        target,
        protocol: "tcp",
        port: portMatch[1],
        source,
        destination,
      };

      // Send API request
      const res = await fetch("http://localhost:5050/firewall/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add rule");
      }

      // Refresh rules and reset form
      await fetchFirewallRules();
      setNewRule("");
      setCurrentPage(1);
    } catch (err) {
      console.error("Add rule failed:", err);
      setError(`Failed to add rule: ${err.message}`);
    }
  };

  // Delete firewall rule (unchanged)
  const deleteRule = async (id) => {
    const ruleToDelete = firewallRules.find((rule) => rule.id === id);
    if (!ruleToDelete) return;

    try {
      const res = await fetch(
        `http://localhost:5050/firewall/rules/${ruleToDelete.chain}/${ruleToDelete.ruleNum}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Delete failed");
      fetchFirewallRules();
      setCurrentPage(1);
    } catch (err) {
      console.error("Delete failed", err);
      setError(`Failed to delete rule: ${err.message}`);
    }
  };

  // Refresh rules manually (unchanged)
  const refreshRules = () => {
    fetchFirewallRules();
    setCurrentPage(1);
  };

  // Filter and paginate rules (unchanged)
  const filteredRules = firewallRules.filter(
    (rule) => activeTab === "all" || rule.type === activeTab
  );

  const indexOfLastRule = currentPage * rulesPerPage;
  const indexOfFirstRule = indexOfLastRule - rulesPerPage;
  const currentRules = filteredRules.slice(indexOfFirstRule, indexOfLastRule);
  const totalPages = Math.ceil(filteredRules.length / rulesPerPage);

  // Pagination controls (unchanged)
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // Calculate statistics (unchanged)
  const blockedIPs = firewallRules.filter(
    (r) => r.severity === "high" && r.type === "inbound"
  ).length;

  const highSeverityRules = firewallRules.filter(
    (r) => r.severity === "high"
  ).length;

  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-lg">
      {/* Status Header */}
      <header className="flex flex-wrap items-center justify-between mb-8 pb-4 border-b border-gray-700">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-cyan-400 flex items-center">
            <FiShield className="mr-3" />
            Firewall Management
          </h1>
          <StatusBadge isConnected={isConnected} />
        </div>

        <button
          onClick={refreshRules}
          className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          disabled={isRefreshing}
        >
          <FiRefreshCw
            className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh Rules
        </button>
      </header>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/80 text-red-200 rounded-lg flex items-center">
          <FiAlertTriangle className="mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Rule Creation Section */}
      <section className="mb-8 p-5 bg-gray-700 rounded-xl">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiPlus className="mr-2" /> Add New Rule
        </h2>

        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <input
            type="text"
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            placeholder="e.g., Block traffic on port 3389 from 192.168.1.0/24"
            className="flex-1 px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
            onKeyPress={(e) => e.key === "Enter" && addRule()}
            disabled={!isConnected}
          />
          <button
            onClick={addRule}
            disabled={!isConnected}
            className={`px-6 py-3 rounded-lg transition-all ${
              isConnected
                ? "bg-cyan-600 hover:bg-cyan-700"
                : "bg-gray-600 cursor-not-allowed"
            }`}
          >
            Add Rule
          </button>
        </div>

        <div className="text-sm text-gray-400 space-y-1">
          <p>
            Format: [Action] traffic from [Source] to [Destination] port [Port]
          </p>
          <p>
            Examples:
            <span className="block">
              • "Block traffic from 192.168.1.0/24 to any port 22"
            </span>
            <span className="block">
              • "Allow traffic from 10.0.0.5 to 192.168.1.10 port 80"
            </span>
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <nav className="mb-6">
        <div className="flex flex-wrap border-b border-gray-700">
          {["all", "inbound", "internal", "outbound"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`px-5 py-3 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      {/* Rules Table */}
      <section className="mb-8 bg-gray-700 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-5 py-4 text-left min-w-[300px]">
                  Rule Definition
                </th>
                <th className="px-5 py-4 text-left">Type</th>
                <th className="px-5 py-4 text-left">Severity</th>
                <th className="px-5 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isConnected && currentRules.length > 0 ? (
                currentRules.map((rule) => (
                  <tr
                    key={rule.id}
                    className="border-t border-gray-600 hover:bg-gray-600 transition-colors"
                  >
                    <td className="px-5 py-4">{rule.rule}</td>
                    <td className="px-5 py-4">
                      <RuleTypeBadge type={rule.type} />
                    </td>
                    <td className="px-5 py-4">
                      <SeverityBadge severity={rule.severity} />
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="px-4 py-2 text-sm bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-400">
                    {isConnected
                      ? "No firewall rules found"
                      : "Server disconnected - rules unavailable"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {isConnected && filteredRules.length > rulesPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 bg-gray-800 gap-4">
            <div className="text-sm text-gray-400">
              Showing {indexOfFirstRule + 1} to{" "}
              {Math.min(indexOfLastRule, filteredRules.length)} of{" "}
              {filteredRules.length} rules
            </div>

            <div className="flex items-center space-x-2">
              <PaginationButton onClick={prevPage} disabled={currentPage === 1}>
                <FiChevronLeft size={20} />
              </PaginationButton>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg ${
                      currentPage === number
                        ? "bg-cyan-600 text-white"
                        : "text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {number}
                  </button>
                )
              )}

              <PaginationButton
                onClick={nextPage}
                disabled={currentPage === totalPages}
              >
                <FiChevronRight size={20} />
              </PaginationButton>
            </div>
          </div>
        )}
      </section>

      {/* Statistics Section */}
      <section>
        <h2 className="text-xl font-semibold mb-5">Firewall Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard
            title="Blocked IPs"
            value={blockedIPs}
            description="Currently blocked"
            icon={<FiAlertTriangle className="mr-2 text-yellow-400" />}
          />

          <StatCard
            title="Total Rules"
            value={isConnected ? firewallRules.length : "N/A"}
            description={
              isConnected ? "Firewall rules configured" : "Server disconnected"
            }
          />

          <StatCard
            title="High Severity Rules"
            value={isConnected ? highSeverityRules : "N/A"}
            description="Critical protections"
          />
        </div>
      </section>
    </div>
  );
}
