import React, { useState, useEffect, useRef } from "react";
import {
  FiAlertTriangle,
  FiActivity,
  FiBarChart2,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiLoader,
  FiWifi,
  FiFilter,
  FiInfo,
  FiX,
  FiShieldOff,
} from "react-icons/fi";

// Reusable components
const StatCard = ({ title, value, description, icon, color }) => (
  <div className={`bg-gray-700 p-5 rounded-xl border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold flex items-center">
        {icon}
        {title}
      </h3>
      <span className={`text-2xl font-mono ${color.replace("border", "text")}`}>
        {value}
      </span>
    </div>
    <p className="text-sm text-gray-400 mt-2">{description}</p>
  </div>
);

const SeverityBadge = ({ severity }) => {
  const severityText =
    severity === 4
      ? "critical"
      : severity === 3
      ? "high"
      : severity === 2
      ? "medium"
      : "low";

  return (
    <span
      className={`px-3 py-1 text-xs rounded-full font-medium ${
        severity === 4
          ? "bg-red-900 text-red-300"
          : severity === 3
          ? "bg-yellow-800 text-yellow-300"
          : severity === 2
          ? "bg-orange-800 text-orange-300"
          : "bg-gray-700 text-gray-300"
      }`}
    >
      {severityText}
    </span>
  );
};

const ActionBadge = ({ action }) => (
  <span
    className={`px-3 py-1 text-xs rounded-full font-medium ${
      action === "blocked"
        ? "bg-green-900 text-green-300"
        : action === "allowed"
        ? "bg-blue-900 text-blue-300"
        : "bg-yellow-800 text-yellow-300"
    }`}
  >
    {action || "detected"}
  </span>
);

const PaginationButton = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-lg flex items-center justify-center ${
      disabled
        ? "text-gray-600 cursor-not-allowed"
        : "text-gray-300 hover:bg-gray-700"
    }`}
  >
    {children}
  </button>
);

const ThreatsView = () => {
  // State management
  const [events, setEvents] = useState([]);
  const [timeRange, setTimeRange] = useState("24h");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [eventType, setEventType] = useState("alert");
  const [eventDetails, setEventDetails] = useState(null);
  const [eventTypes] = useState([
    "alert",
    "dns",
    "http",
    "tls",
    "flow",
    "fileinfo",
  ]);
  const [error, setError] = useState(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const [threatLog, setThreatLog] = useState("");

  // Track if component is mounted
  const isMounted = useRef(true);

  // Fetch events from server
  const fetchEvents = async (isAutoRefresh = false) => {
    if (isAutoRefresh) {
      setIsAutoRefreshing(true);
    } else {
      setIsRefreshing(true);
    }

    setError(null);
    try {
      const params = new URLSearchParams({
        event_type: eventType,
        time_range: timeRange,
        search: searchQuery,
      });

      const res = await fetch(
        `http://localhost:5050/suricata/events?${params}`
      );
      if (!res.ok) throw new Error("Failed to fetch events");

      const data = await res.json();
      if (isMounted.current) {
        setEvents(data.events || []);
        setLastUpdated(new Date());
        if (!isAutoRefresh) {
          setCurrentPage(1);
        }
      }
    } catch (error) {
      if (isMounted.current) {
        console.error("Error fetching events:", error);
        setError(error.message);
      }
    } finally {
      if (isMounted.current) {
        if (isAutoRefresh) {
          setIsAutoRefreshing(false);
        } else {
          setIsRefreshing(false);
        }
      }
    }
  };

  // Fetch threat log
  const fetchThreatLog = async () => {
    try {
      const res = await fetch("http://localhost:5050/suricata/threat-log");
      if (!res.ok) throw new Error("Failed to fetch threat log");

      const data = await res.json();
      if (isMounted.current) {
        setThreatLog(data.log || "No threats logged yet");
      }
    } catch (error) {
      console.error("Error fetching threat log:", error);
    }
  };

  // Block an IP address
  const blockIp = async (ip) => {
    if (!ip || ip === "N/A") return;

    setIsBlocking(true);
    try {
      const res = await fetch("http://localhost:5050/firewall/block-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to block IP");
      }

      const data = await res.json();
      alert(data.message);

      // Refresh threat log to show new blocked IP
      fetchThreatLog();
    } catch (error) {
      alert(`Error blocking IP: ${error.message}`);
    } finally {
      setIsBlocking(false);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchEvents();
    fetchThreatLog();

    // Auto-refresh every 30 seconds (silent)
    const interval = setInterval(() => {
      if (isMounted.current) {
        fetchEvents(true);
        fetchThreatLog();
      }
    }, 30000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [eventType, timeRange, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(events.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentItems = events.slice(startIdx, startIdx + itemsPerPage);

  const paginate = (page) => {
    if (page < 1) page = 1;
    else if (page > totalPages) page = totalPages;
    setCurrentPage(page);
  };

  // Helpers
  const getSeverityText = (sev) => {
    switch (sev) {
      case 4:
        return "critical";
      case 3:
        return "high";
      case 2:
        return "medium";
      case 1:
      default:
        return "low";
    }
  };

  const severityCounts = {
    critical: events.filter((e) => e.severity === 4).length,
    high: events.filter((e) => e.severity === 3).length,
    medium: events.filter((e) => e.severity === 2).length,
    blocked: events.filter((e) => e.action === "blocked").length,
  };

  const formatTimeRange = () => {
    switch (timeRange) {
      case "5m":
        return "last 5 minutes";
      case "15m":
        return "last 15 minutes";
      case "30m":
        return "last 30 minutes";
      case "1h":
        return "last hour";
      case "24h":
        return "last 24 hours";
      case "7d":
        return "last 7 days";
      default:
        return "all time";
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  const showEventDetails = (event) => {
    setEventDetails(event);
  };

  const closeEventDetails = () => {
    setEventDetails(null);
  };

  // Calculate statistics
  const activeBlocks = threatLog.split("BLOCKED").length - 1;

  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-lg">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-4 border-b border-gray-700">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-cyan-400 flex items-center">
            <FiAlertTriangle className="mr-3" />
            Threat Defense System
          </h1>
          <div className="ml-4 flex items-center text-sm text-gray-400">
            <FiWifi className="text-green-500 mr-1" />
            {`Connected ${
              lastUpdated
                ? `• Last updated: ${lastUpdated.toLocaleTimeString()}`
                : ""
            }`}
            {isAutoRefreshing && (
              <FiRefreshCw className="ml-2 text-gray-500 animate-spin" />
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              fetchEvents();
              fetchThreatLog();
            }}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
            aria-label="Refresh events"
          >
            <FiRefreshCw
              className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Filters Section */}
      <section className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
            disabled={isRefreshing}
          >
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isRefreshing}
          />
        </div>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
          disabled={isRefreshing}
        >
          <option value="5m">Last 5 minutes</option>
          <option value="15m">Last 15 minutes</option>
          <option value="30m">Last 30 minutes</option>
          <option value="1h">Last hour</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
        </select>

        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
          disabled={isRefreshing}
        >
          {[5, 10, 15, 20, 30, 50].map((n) => (
            <option key={n} value={n}>
              Show {n} per page
            </option>
          ))}
        </select>
      </section>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/80 text-red-200 rounded-lg flex items-center">
          <FiAlertTriangle className="mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Threat Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isRefreshing ? (
            Array(4)
              .fill()
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-700 p-5 rounded-xl border-l-4 border-gray-600 h-[120px] flex items-center justify-center"
                >
                  <FiLoader className="animate-spin text-gray-400 text-2xl" />
                </div>
              ))
          ) : (
            <>
              <StatCard
                title="Critical Threats"
                value={severityCounts.critical}
                description="Auto-blocked by system"
                icon={<FiActivity className="mr-2 text-red-400" />}
                color="border-red-500"
              />

              <StatCard
                title="Total Events"
                value={events.length}
                description={`Detected in ${formatTimeRange()}`}
                icon={<FiAlertTriangle className="mr-2 text-yellow-400" />}
                color="border-yellow-500"
              />

              <StatCard
                title="Blocked"
                value={severityCounts.blocked}
                description="Successfully mitigated"
                icon={<FiBarChart2 className="mr-2 text-green-400" />}
                color="border-green-500"
              />

              <StatCard
                title="Active Blocks"
                value={activeBlocks}
                description="Malicious IPs blocked"
                icon={<FiShieldOff className="mr-2 text-cyan-400" />}
                color="border-cyan-500"
              />
            </>
          )}
        </div>
      </section>

      {/* Threat Log Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiAlertTriangle className="mr-2" /> Threat Block Log
        </h2>
        <div className="bg-gray-700 rounded-xl p-5">
          <div className="bg-gray-800 p-4 rounded-lg max-h-40 overflow-y-auto font-mono text-sm whitespace-pre-wrap">
            {threatLog || "No threats blocked yet"}
          </div>
        </div>
      </section>

      {/* Events Table Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Security Events</h2>
        <div className="bg-gray-700 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-5 py-4 text-left min-w-[300px]">
                    Signature
                  </th>
                  <th className="px-5 py-4 text-left">Source IP</th>
                  <th className="px-5 py-4 text-left">Destination IP</th>
                  <th className="px-5 py-4 text-left">Type</th>
                  <th className="px-5 py-4 text-left">Severity</th>
                  <th className="px-5 py-4 text-left">Action</th>
                  <th className="px-5 py-4 text-left flex items-center">
                    <FiClock className="mr-2" /> Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {isRefreshing ? (
                  Array(itemsPerPage)
                    .fill()
                    .map((_, i) => (
                      <tr
                        key={`loading-${i}`}
                        className="border-t border-gray-600"
                      >
                        {Array(7)
                          .fill()
                          .map((__, idx) => (
                            <td key={idx} className="px-5 py-4">
                              <div
                                className="h-4 bg-gray-600 rounded animate-pulse"
                                style={{
                                  width:
                                    idx === 0
                                      ? "75%"
                                      : idx >= 4
                                      ? "50px"
                                      : "50%",
                                }}
                              />
                            </td>
                          ))}
                      </tr>
                    ))
                ) : events.length > 0 ? (
                  currentItems.map((event) => (
                    <tr
                      key={event.id}
                      className={`border-t border-gray-600 hover:bg-gray-600 transition-colors cursor-pointer ${
                        event.severity >= 3 ? "bg-red-900/20" : ""
                      }`}
                      onClick={() => showEventDetails(event)}
                    >
                      <td className="px-5 py-4 font-medium">
                        {event.signature || "Unknown event"}
                      </td>
                      <td className="px-5 py-4 font-mono">
                        {event.src_ip || "N/A"}
                      </td>
                      <td className="px-5 py-4 font-mono">
                        {event.dest_ip || "N/A"}
                      </td>
                      <td className="px-5 py-4 capitalize">
                        {event.event_type}
                      </td>
                      <td className="px-5 py-4">
                        <SeverityBadge severity={event.severity} />
                      </td>
                      <td className="px-5 py-4">
                        <ActionBadge action={event.action} />
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {formatTimestamp(event.timestamp)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-8 text-center text-gray-400"
                    >
                      No events found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pagination Section */}
      {events.length > 0 && (
        <section className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="text-sm text-gray-400">
            Showing{" "}
            {Math.min((currentPage - 1) * itemsPerPage + 1, events.length)} to{" "}
            {Math.min(currentPage * itemsPerPage, events.length)} of{" "}
            {events.length} events
          </div>

          <div className="flex items-center gap-1">
            <PaginationButton
              onClick={() => paginate(1)}
              disabled={currentPage === 1}
            >
              <FiChevronsLeft size={20} />
            </PaginationButton>

            <PaginationButton
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <FiChevronLeft size={20} />
            </PaginationButton>

            {[...Array(Math.min(5, totalPages)).keys()].map((i) => {
              const pageNum = i + 1 + Math.max(0, currentPage - 3);
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => paginate(pageNum)}
                  className={`px-4 py-2 rounded-lg min-w-[40px] flex items-center justify-center ${
                    pageNum === currentPage
                      ? "bg-cyan-600 text-white"
                      : "bg-gray-700 hover:bg-gray-600"
                  } transition-colors`}
                >
                  {pageNum}
                </button>
              );
            })}

            <PaginationButton
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <FiChevronRight size={20} />
            </PaginationButton>

            <PaginationButton
              onClick={() => paginate(totalPages)}
              disabled={currentPage === totalPages}
            >
              <FiChevronsRight size={20} />
            </PaginationButton>
          </div>
        </section>
      )}

      {/* Event Details Modal */}
      {eventDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-cyan-400">
                    Event Details
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Detailed information about security event
                  </p>
                </div>
                <button
                  onClick={closeEventDetails}
                  className="text-gray-400 hover:text-white text-2xl p-2 rounded-full hover:bg-gray-700"
                >
                  <FiX />
                </button>
              </div>

              {/* Event Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="bg-gray-700 p-5 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    Source IP
                  </h4>
                  <p className="font-mono text-lg break-all bg-gray-800 p-3 rounded-lg">
                    {eventDetails.src_ip}
                  </p>
                </div>

                <div className="bg-gray-700 p-5 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    Destination IP
                  </h4>
                  <p className="font-mono text-lg break-all bg-gray-800 p-3 rounded-lg">
                    {eventDetails.dest_ip}
                  </p>
                </div>

                <div className="bg-gray-700 p-5 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    Protocol
                  </h4>
                  <p className="text-lg font-medium bg-gray-800 p-3 rounded-lg">
                    {eventDetails.proto || "N/A"}
                  </p>
                </div>

                <div className="bg-gray-700 p-5 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    Event Type
                  </h4>
                  <p className="text-lg font-medium bg-gray-800 p-3 rounded-lg capitalize">
                    {eventDetails.event_type}
                  </p>
                </div>
              </div>

              {/* Event Details */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">
                  Signature
                </h4>
                <p className="text-lg bg-gray-700 p-4 rounded-xl break-all font-medium">
                  {eventDetails.signature || "No signature available"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div className="bg-gray-700 p-5 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    Action
                  </h4>
                  <div className="flex justify-center">
                    <ActionBadge action={eventDetails.action} />
                  </div>
                </div>

                <div className="bg-gray-700 p-5 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    Severity
                  </h4>
                  <div className="flex justify-center">
                    <SeverityBadge severity={eventDetails.severity} />
                  </div>
                </div>

                <div className="bg-gray-700 p-5 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    Timestamp
                  </h4>
                  <p className="text-sm text-center font-medium">
                    {formatTimestamp(eventDetails.timestamp)}
                  </p>
                </div>
              </div>

              {/* Block IP Section */}
              {eventDetails.src_ip && eventDetails.src_ip !== "N/A" && (
                <div className="mb-6 p-5 bg-gray-700 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center">
                    <FiShieldOff className="mr-2" /> Block Malicious Source
                  </h4>
                  <button
                    onClick={() => blockIp(eventDetails.src_ip)}
                    disabled={isBlocking}
                    className={`w-full py-4 rounded-xl flex items-center justify-center ${
                      isBlocking
                        ? "bg-red-800 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    } transition-colors text-lg font-medium`}
                  >
                    <FiShieldOff className="mr-3" />
                    {isBlocking
                      ? "Blocking..."
                      : `Block IP ${eventDetails.src_ip}`}
                  </button>
                  <p className="text-sm text-gray-400 mt-3">
                    This will add a firewall rule to block all traffic from this
                    IP address
                  </p>
                </div>
              )}

              {/* Raw Event Data */}
              <div className="bg-gray-700 p-5 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center">
                  <FiInfo className="mr-2" /> Raw Event Data
                </h4>
                <pre className="text-sm overflow-x-auto max-h-96 bg-gray-800 p-4 rounded-lg">
                  {JSON.stringify(eventDetails, null, 2)}
                </pre>
              </div>

              {/* Modal Footer */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={closeEventDetails}
                  className="px-5 py-2.5 bg-cyan-600 rounded-lg hover:bg-cyan-700 font-medium"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreatsView;
