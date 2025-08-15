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
  FiTrash2,
  FiFilter,
  FiSave,
  FiX,
  FiBarChart,
  FiChevronsLeft,
  FiChevronsRight
} from "react-icons/fi";

// Enhanced StatusBadge component
const StatusBadge = ({ isConnected }) => (
  <div
    className={`ml-4 flex items-center px-3 py-1 rounded-full text-sm font-medium ${
      isConnected 
        ? "bg-green-900/30 text-green-400 border border-green-700/50" 
        : "bg-red-900/30 text-red-400 border border-red-700/50"
    }`}
  >
    <div
      className={`w-2 h-2 rounded-full mr-2 ${
        isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
      }`}
    ></div>
    {isConnected ? (
      <>
        <FiWifi className="mr-1" /> Connected
      </>
    ) : (
      <>
        <FiWifiOff className="mr-1" /> Disconnected
      </>
    )}
  </div>
);

// Enhanced SeverityBadge component
const SeverityBadge = ({ severity }) => (
  <span
    className={`px-2 py-1 rounded-full text-xs font-medium ${
      severity === "high"
        ? "bg-red-900/30 text-red-300 border border-red-700/50"
        : severity === "medium"
        ? "bg-yellow-800/30 text-yellow-300 border border-yellow-700/50"
        : "bg-green-900/30 text-green-300 border border-green-700/50"
    }`}
  >
    {severity}
  </span>
);

// Enhanced RuleTypeBadge component
const RuleTypeBadge = ({ type }) => {
  const typeColors = {
    inbound: "bg-blue-600/20 text-blue-300 border border-blue-500/30",
    outbound: "bg-purple-600/20 text-purple-300 border border-purple-500/30",
    internal: "bg-cyan-600/20 text-cyan-300 border border-cyan-500/30"
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs capitalize ${typeColors[type] || "bg-gray-600"}`}>
      {type}
    </span>
  );
};

// Enhanced StatCard component
const StatCard = ({ title, value, description, icon, isLoading }) => (
  <div className="bg-gradient-to-br from-gray-800 to-gray-850 border border-gray-700 p-4 rounded-xl h-full">
    <h3 className="text-lg font-semibold mb-2 flex items-center text-gray-300">
      {icon}
      {title}
    </h3>
    <p className="text-3xl font-mono text-white">
      {isLoading ? "..." : value}
    </p>
    <p className="text-sm text-gray-400 mt-1">{description}</p>
  </div>
);

// Premium Pagination Component
const PremiumPagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  onPrev,
  onNext,
  onFirst,
  onLast
}) => {
  const maxVisiblePages = 5; // Maximum pages to show in the pagination bar
  let startPage, endPage;
  
  if (totalPages <= maxVisiblePages) {
    // Show all pages
    startPage = 1;
    endPage = totalPages;
  } else {
    // Calculate start and end pages
    const maxPagesBeforeCurrent = Math.floor(maxVisiblePages / 2);
    const maxPagesAfterCurrent = Math.ceil(maxVisiblePages / 2) - 1;
    
    if (currentPage <= maxPagesBeforeCurrent) {
      // Near the start
      startPage = 1;
      endPage = maxVisiblePages;
    } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
      // Near the end
      startPage = totalPages - maxVisiblePages + 1;
      endPage = totalPages;
    } else {
      // Somewhere in the middle
      startPage = currentPage - maxPagesBeforeCurrent;
      endPage = currentPage + maxPagesAfterCurrent;
    }
  }
  
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-1">
        <button
          onClick={onFirst}
          disabled={currentPage === 1}
          className={`p-1.5 rounded-lg ${
            currentPage === 1
              ? "text-gray-600 cursor-not-allowed"
              : "text-gray-300 hover:bg-gray-700"
          }`}
          title="First Page"
        >
          <FiChevronsLeft size={18} />
        </button>
        
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          className={`p-1.5 rounded-lg ${
            currentPage === 1
              ? "text-gray-600 cursor-not-allowed"
              : "text-gray-300 hover:bg-gray-700"
          }`}
          title="Previous Page"
        >
          <FiChevronLeft size={18} />
        </button>
      </div>
      
      <div className="flex items-center">
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`mx-1 w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
              currentPage === page
                ? "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            {page}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            <span className="mx-1 text-gray-500">...</span>
            <button
              onClick={() => onPageChange(totalPages)}
              className={`mx-1 w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
                currentPage === totalPages
                  ? "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>
      
      <div className="flex items-center space-x-1">
        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          className={`p-1.5 rounded-lg ${
            currentPage === totalPages
              ? "text-gray-600 cursor-not-allowed"
              : "text-gray-300 hover:bg-gray-700"
          }`}
          title="Next Page"
        >
          <FiChevronRight size={18} />
        </button>
        
        <button
          onClick={onLast}
          disabled={currentPage === totalPages}
          className={`p-1.5 rounded-lg ${
            currentPage === totalPages
              ? "text-gray-600 cursor-not-allowed"
              : "text-gray-300 hover:bg-gray-700"
          }`}
          title="Last Page"
        >
          <FiChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default function FirewallView() {
  // State management
  const [firewallRules, setFirewallRules] = useState([]);
  const [newRule, setNewRule] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rulesPerPage] = useState(10); // Increased per page for better UX
  const [isConnected, setIsConnected] = useState(true);
  const [isAddingRule, setIsAddingRule] = useState(false);

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

  // Add new firewall rule
  const addRule = async () => {
    if (!newRule.trim()) return;

    setIsAddingRule(true);
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
    } finally {
      setIsAddingRule(false);
    }
  };

  // Delete firewall rule
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

  // Refresh rules manually
  const refreshRules = () => {
    fetchFirewallRules();
    setCurrentPage(1);
  };

  // Filter and paginate rules
  const filteredRules = firewallRules.filter(
    (rule) => activeTab === "all" || rule.type === activeTab
  );

  const indexOfLastRule = currentPage * rulesPerPage;
  const indexOfFirstRule = indexOfLastRule - rulesPerPage;
  const currentRules = filteredRules.slice(indexOfFirstRule, indexOfLastRule);
  const totalPages = Math.ceil(filteredRules.length / rulesPerPage);

  // Pagination controls
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const firstPage = () => setCurrentPage(1);
  const lastPage = () => setCurrentPage(totalPages);

  // Calculate statistics
  const blockedIPs = firewallRules.filter(
    (r) => r.severity === "high" && r.type === "inbound"
  ).length;

  const highSeverityRules = firewallRules.filter(
    (r) => r.severity === "high"
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-850 p-6">
      {/* Status Header */}
      <header className="flex flex-wrap items-center justify-between mb-8 pb-6 border-b border-gray-700">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <FiShield className="mr-3 text-cyan-400" />
            Firewall Management
          </h1>
          <StatusBadge isConnected={isConnected} />
        </div>

        <button
          onClick={refreshRules}
          className="flex items-center px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
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
        <div className="mb-6 p-4 bg-red-900/40 text-red-200 rounded-lg flex items-center border border-red-700/50">
          <FiAlertTriangle className="mr-3 flex-shrink-0 text-xl" />
          <span>{error}</span>
          <button 
            className="ml-auto text-gray-400 hover:text-gray-200"
            onClick={() => setError(null)}
          >
            <FiX />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2">
          {/* Rule Creation Section */}
          <div className="mb-6 p-5 bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-300">
              <FiPlus className="mr-2 text-green-400" /> Add New Rule
            </h2>

            <div className="flex flex-col md:flex-row gap-3 mb-3">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="e.g., Block traffic on port 3389 from 192.168.1.0/24"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 text-white"
                onKeyPress={(e) => e.key === "Enter" && addRule()}
                disabled={!isConnected}
              />
              <button
                onClick={addRule}
                disabled={!isConnected || isAddingRule}
                className={`px-6 py-3 rounded-lg transition-all flex items-center justify-center ${
                  isConnected && !isAddingRule
                    ? "bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600"
                    : "bg-gray-800 cursor-not-allowed"
                }`}
              >
                {isAddingRule ? (
                  <>
                    <FiRefreshCw className="animate-spin mr-2" /> Adding...
                  </>
                ) : (
                  "Add Rule"
                )}
              </button>
            </div>

            <div className="text-sm text-gray-400 space-y-1">
             
              <p className="mt-2 text-gray-300">Examples:</p>
              <div className="bg-gray-800/50 p-3 rounded-lg mt-2 border border-gray-700">
                <p className="text-xs font-mono text-cyan-300 mb-1">• "Block traffic from 192.168.1.0/24 to any port 22"</p>
                <p className="text-xs font-mono text-cyan-300">• "Allow traffic from 10.0.0.5 to 192.168.1.10 port 80"</p>
              </div>
            </div>
          </div>

          {/* Rules Table */}
          <div className="mb-6 bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
            {/* Filter Tabs */}
            <div className="flex flex-wrap border-b border-gray-700 bg-gray-800/50">
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
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/30">
                  <tr>
                    <th className="px-5 py-4 text-left min-w-[300px] text-gray-400">
                      Rule Definition
                    </th>
                    <th className="px-5 py-4 text-left text-gray-400">Type</th>
                    <th className="px-5 py-4 text-left text-gray-400">Severity</th>
                    <th className="px-5 py-4 text-left text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isConnected && currentRules.length > 0 ? (
                    currentRules.map((rule) => (
                      <tr
                        key={rule.id}
                        className="border-t border-gray-700 hover:bg-gray-800/20 transition-colors"
                      >
                        <td className="px-5 py-4 text-white font-mono text-sm">{rule.rule}</td>
                        <td className="px-5 py-4">
                          <RuleTypeBadge type={rule.type} />
                        </td>
                        <td className="px-5 py-4">
                          <SeverityBadge severity={rule.severity} />
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="px-3 py-1.5 text-sm flex items-center bg-red-700/30 hover:bg-red-700/40 rounded-lg transition-colors border border-red-600/30"
                          >
                            <FiTrash2 className="mr-1" /> Delete
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

            {/* Enhanced Pagination Controls */}
            {isConnected && filteredRules.length > rulesPerPage && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 bg-gray-800/30 gap-4 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Showing {indexOfFirstRule + 1} to{" "}
                  {Math.min(indexOfLastRule, filteredRules.length)} of{" "}
                  {filteredRules.length} rules
                </div>

                <div className="w-full sm:w-auto">
                  <PremiumPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={paginate}
                    onPrev={prevPage}
                    onNext={nextPage}
                    onFirst={firstPage}
                    onLast={lastPage}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column */}
        <div>
          {/* Statistics Section */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl border border-gray-700 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-5 text-gray-300 flex items-center">
              <FiBarChart className="mr-2 text-purple-400" /> Firewall Statistics
            </h2>
            <div className="grid grid-cols-1 gap-5">
              <StatCard
                title="Blocked IPs"
                value={blockedIPs}
                description="Currently blocked"
                icon={<FiAlertTriangle className="mr-2 text-yellow-400" />}
                isLoading={isRefreshing}
              />

              <StatCard
                title="Total Rules"
                value={isConnected ? firewallRules.length : "N/A"}
                description={
                  isConnected ? "Firewall rules configured" : "Server disconnected"
                }
                isLoading={isRefreshing}
              />

              <StatCard
                title="High Severity Rules"
                value={isConnected ? highSeverityRules : "N/A"}
                description="Critical protections"
                isLoading={isRefreshing}
              />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}