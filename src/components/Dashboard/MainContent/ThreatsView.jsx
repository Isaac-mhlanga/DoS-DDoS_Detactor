import React, { useState, useEffect, useRef } from "react";
import {
  FiAlertTriangle,
  FiActivity,
  FiBarChart2,
  FiClock,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiLoader,
  FiFilter,
  FiInfo,
  FiX,
  FiShieldOff,
} from "react-icons/fi";

// Reusable components
const StatCard = ({ title, value, description, icon, color }) => (
  <div
    className={`bg-gradient-to-br from-gray-800 to-gray-850 p-5 rounded-xl border border-gray-700 shadow-lg ${color}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center mb-2">
          <div className="p-2 rounded-lg bg-opacity-10 mr-3">{icon}</div>
          <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
        </div>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <span className={`text-3xl font-bold ${color.replace("border", "text")}`}>
        {value}
      </span>
    </div>
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

  const colors = {
    critical: "bg-red-500/20 text-red-400 border-red-500/50",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    low: "bg-gray-700/50 text-gray-300 border-gray-600",
  };

  return (
    <span
      className={`px-3 py-1 text-xs rounded-full border ${colors[severityText]}`}
    >
      {severityText}
    </span>
  );
};

const ActionBadge = ({ action }) => {
  const colors = {
    blocked: "bg-green-500/20 text-green-400 border-green-500/50",
    allowed: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    detected: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    dropped: "bg-red-500/20 text-red-400 border-red-500/50",
    rejected: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  };

  return (
    <span
      className={`px-3 py-1 text-xs rounded-full border ${
        colors[action] || colors.detected
      }`}
    >
      {action || "detected"}
    </span>
  );
};

const PaginationButton = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-lg flex items-center justify-center ${
      disabled
        ? "text-gray-600 cursor-not-allowed"
        : "text-gray-300 hover:bg-gray-700 transition-colors"
    }`}
  >
    {children}
  </button>
);

const ThreatsView = () => {
  // State management
  const [events, setEvents] = useState([]);
  const [timeRange, setTimeRange] = useState("24h");
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

      // Refresh events to update status
      fetchEvents();
    } catch (error) {
      alert(`Error blocking IP: ${error.message}`);
    } finally {
      setIsBlocking(false);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchEvents();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      if (isMounted.current) {
        fetchEvents(true);
      }
    }, 10000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [eventType, timeRange]);

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
  const severityCounts = {
    critical: events.filter((e) => e.severity === 4).length,
    high: events.filter((e) => e.severity === 3).length,
    medium: events.filter((e) => e.severity === 2).length,
    blocked: events.filter(
      (e) => e.action === "blocked" || e.action === "dropped"
    ).length,
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

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-850 rounded-xl shadow-lg">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-gray-700">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-cyan-400 flex items-center">
            <FiAlertTriangle className="mr-3 text-cyan-400" />
            Threat Defense System
          </h1>
          <div className="ml-4 flex items-center text-sm text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
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
            onClick={fetchEvents}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2.5 bg-gray-800 rounded-lg hover:bg-gray-700/60 disabled:opacity-50 transition-colors border border-gray-700"
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
      <section className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="relative">
          <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
            disabled={isRefreshing}
          >
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
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
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
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
        <div className="mb-6 p-4 bg-red-900/80 text-red-200 rounded-lg flex items-center border border-red-700">
          <FiAlertTriangle className="mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-300 mb-4">
          Threat Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isRefreshing ? (
            Array(4)
              .fill()
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-gray-800 to-gray-850 p-5 rounded-xl border border-gray-700 h-[120px] flex items-center justify-center"
                >
                  <FiLoader className="animate-spin text-cyan-400 text-2xl" />
                </div>
              ))
          ) : (
            <>
              <StatCard
                title="Critical Threats"
                value={severityCounts.critical}
                description="Auto-blocked by system"
                icon={<FiActivity className="text-red-400" />}
                color="border-l-red-500"
              />

              <StatCard
                title="Total Events"
                value={events.length}
                description={`Detected in ${formatTimeRange()}`}
                icon={<FiAlertTriangle className="text-yellow-400" />}
                color="border-l-yellow-500"
              />

              <StatCard
                title="Blocked"
                value={severityCounts.blocked}
                description="Successfully mitigated"
                icon={<FiBarChart2 className="text-green-400" />}
                color="border-l-green-500"
              />

              <StatCard
                title="High Severity"
                value={severityCounts.high}
                description="Requires attention"
                icon={<FiShieldOff className="text-orange-400" />}
                color="border-l-orange-500"
              />
            </>
          )}
        </div>
      </section>

      {/* Events Table Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-300 mb-4">
          Security Events
        </h2>
        <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-5 py-4 text-left text-gray-300 min-w-[300px]">
                    Signature
                  </th>
                  <th className="px-5 py-4 text-left text-gray-300">
                    Source IP
                  </th>
                  <th className="px-5 py-4 text-left text-gray-300">
                    Destination IP
                  </th>
                  <th className="px-5 py-4 text-left text-gray-300">Type</th>
                  <th className="px-5 py-4 text-left text-gray-300">
                    Severity
                  </th>
                  <th className="px-5 py-4 text-left text-gray-300">Action</th>
                  <th className="px-5 py-4 text-left text-gray-300 flex items-center">
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
                        className="border-t border-gray-700"
                      >
                        {Array(7)
                          .fill()
                          .map((__, idx) => (
                            <td key={idx} className="px-5 py-4">
                              <div
                                className="h-4 bg-gray-700 rounded animate-pulse"
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
                      className={`border-t border-gray-700 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                        event.severity >= 3 ? "bg-red-900/20" : ""
                      }`}
                      onClick={() => showEventDetails(event)}
                    >
                      <td className="px-5 py-4 font-medium text-white">
                        {event.signature || "Unknown event"}
                      </td>
                      <td className="px-5 py-4 font-mono text-cyan-300">
                        {event.src_ip || "N/A"}
                      </td>
                      <td className="px-5 py-4 font-mono text-purple-300">
                        {event.dest_ip || "N/A"}
                      </td>
                      <td className="px-5 py-4 capitalize text-gray-300">
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
                  className={`px-4 py-2 rounded-lg min-w-[40px] flex items-center justify-center transition-colors ${
                    pageNum === currentPage
                      ? "bg-cyan-600 text-white"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-700">
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
                  className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Event Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="bg-gradient-to-br from-gray-800 to-gray-850 p-5 rounded-xl border border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    Source IP
                  </h4>
                  <p className="font-mono text-lg break-all bg-gray-800/50 p-3 rounded-lg">
                    {eventDetails.src_ip}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-850 p-5 rounded-xl border border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    Destination IP
                  </h4>
                  <p className="font-mono text-lg break-all bg-gray-800/50 p-3 rounded-lg">
                    {eventDetails.dest_ip}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-850 p-5 rounded-xl border border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    Protocol
                  </h4>
                  <p className="text-lg font-medium bg-gray-800/50 p-3 rounded-lg">
                    {eventDetails.proto || "N/A"}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-850 p-5 rounded-xl border border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    Event Type
                  </h4>
                  <p className="text-lg font-medium bg-gray-800/50 p-3 rounded-lg capitalize">
                    {eventDetails.event_type}
                  </p>
                </div>
              </div>

              {/* Event Details */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">
                  Signature
                </h4>
                <p className="text-lg bg-gray-800/50 p-4 rounded-xl break-all font-medium border border-gray-700">
                  {eventDetails.signature || "No signature available"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div className="bg-gradient-to-br from-gray-800 to-gray-850 p-5 rounded-xl border border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    Action
                  </h4>
                  <div className="flex justify-center">
                    <ActionBadge action={eventDetails.action} />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-850 p-5 rounded-xl border border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    Severity
                  </h4>
                  <div className="flex justify-center">
                    <SeverityBadge severity={eventDetails.severity} />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-850 p-5 rounded-xl border border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    Timestamp
                  </h4>
                  <p className="text-sm text-center font-medium text-gray-300">
                    {formatTimestamp(eventDetails.timestamp)}
                  </p>
                </div>
              </div>

              {/* Block IP Section */}
              {eventDetails.src_ip && eventDetails.src_ip !== "N/A" && (
                <div className="mb-6 p-5 bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl border border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center">
                    <FiShieldOff className="mr-2" /> Block Malicious Source
                  </h4>
                  <button
                    onClick={() => blockIp(eventDetails.src_ip)}
                    disabled={isBlocking}
                    className={`w-full py-4 rounded-xl flex items-center justify-center transition-colors ${
                      isBlocking
                        ? "bg-red-800 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    } text-lg font-medium`}
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
              <div className="bg-gradient-to-br from-gray-800 to-gray-850 p-5 rounded-xl border border-gray-700">
                <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center">
                  <FiInfo className="mr-2" /> Raw Event Data
                </h4>
                <pre className="text-sm overflow-x-auto max-h-96 bg-gray-800/50 p-4 rounded-lg">
                  {JSON.stringify(eventDetails, null, 2)}
                </pre>
              </div>

              {/* Modal Footer */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={closeEventDetails}
                  className="px-5 py-2.5 bg-cyan-600 rounded-lg hover:bg-cyan-700 font-medium transition-colors"
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
