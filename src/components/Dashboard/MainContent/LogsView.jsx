import React, { useState, useEffect, useMemo } from "react";
import {
  FiList,
  FiFilter,
  FiActivity,
  FiSearch,
  FiClock,
  FiAlertCircle,
  FiDownload,
  FiRefreshCw,
  FiLoader,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { subscribeToAlerts } from "../../../db/alerts/alerts";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function LogsView() {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Subscribe to Firebase alerts
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToAlerts(
      (alerts) => {
        try {
          const transformedLogs = alerts.map((alert) => {
            let severity = "medium";
            if (typeof alert.severity === "string") {
              severity = alert.severity.toLowerCase();
            } else if (typeof alert.severity === "number") {
              severity =
                alert.severity >= 4
                  ? "critical"
                  : alert.severity >= 3
                  ? "high"
                  : alert.severity >= 2
                  ? "medium"
                  : alert.severity >= 1
                  ? "low"
                  : "info";
            }

            let category = "system";
            if (typeof alert.category === "string") {
              category = alert.category.toLowerCase();
            }

            return {
              id: alert.id || Date.now().toString(),
              timestamp: alert.timestamp
                ? new Date(alert.timestamp)
                : new Date(),
              event: alert.title || alert.event || "Security Alert",
              source: alert.source || "Unknown",
              category: category,
              severity: severity,
              details:
                alert.description || alert.details || "No details available",
            };
          });

          setLogs(transformedLogs);
          setIsLoading(false);
        } catch (err) {
          console.error("Error transforming alerts:", err);
          setError("Failed to process alert data");
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Database error:", error);
        setError("Failed to load alerts from database");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const timeFilterMap = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
    };

    return logs
      .filter((log) => {
        const logTime = new Date(log.timestamp).getTime();
        const timeDiff = now.getTime() - logTime;
        return timeRange === "all" || timeDiff <= timeFilterMap[timeRange];
      })
      .filter((log) => {
        const matchesSearch =
          log.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.details.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          selectedCategory === "all" || log.category === selectedCategory;
        const matchesSeverity =
          selectedSeverity === "all" || log.severity === selectedSeverity;

        return matchesSearch && matchesCategory && matchesSeverity;
      });
  }, [logs, searchQuery, selectedCategory, selectedSeverity, timeRange]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const refreshLogs = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const exportLogs = () => {
    const csvContent = [
      "Timestamp,Event,Source,Category,Severity,Details",
      ...filteredLogs.map(
        (log) =>
          `"${log.timestamp.toLocaleString()}","${log.event}","${
            log.source
          }","${log.category}","${log.severity}","${log.details}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `security-logs-${new Date().toISOString()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLogChartData = () => {
    const timeSlots = Array(7)
      .fill(0)
      .map((_, i) => i * 4);
    const criticalData = Array(7).fill(0);
    const warningData = Array(7).fill(0);
    const infoData = Array(7).fill(0);

    filteredLogs.forEach((log) => {
      const logDate = new Date(log.timestamp);
      if (isNaN(logDate.getTime())) return;

      const hour = logDate.getHours();
      const timeSlot = Math.floor(hour / 4);

      if (timeSlot >= 0 && timeSlot < 7) {
        if (log.severity === "critical" || log.severity === "high") {
          criticalData[timeSlot]++;
        } else if (log.severity === "warning" || log.severity === "medium") {
          warningData[timeSlot]++;
        } else {
          infoData[timeSlot]++;
        }
      }
    });

    return {
      labels: timeSlots.map((slot) => `${slot.toString().padStart(2, "0")}:00`),
      datasets: [
        {
          label: "Critical Events",
          data: criticalData,
          borderColor: "#f87171",
          backgroundColor: "rgba(248, 113, 113, 0.2)",
          tension: 0.3,
        },
        {
          label: "Warnings",
          data: warningData,
          borderColor: "#fbbf24",
          backgroundColor: "rgba(251, 191, 36, 0.2)",
          tension: 0.3,
        },
        {
          label: "Info Events",
          data: infoData,
          borderColor: "#60a5fa",
          backgroundColor: "rgba(96, 165, 250, 0.2)",
          tension: 0.3,
        },
      ],
    };
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "text-red-400";
      case "high":
        return "text-orange-400";
      case "medium":
        return "text-yellow-400";
      case "warning":
        return "text-amber-400";
      default:
        return "text-blue-400";
    }
  };

  const getMostActiveCategory = () => {
    if (filteredLogs.length === 0) return "N/A";
    const categories = {};
    filteredLogs.forEach((log) => {
      categories[log.category] = (categories[log.category] || 0) + 1;
    });
    return Object.entries(categories).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  if (error) {
    return (
      <div className="p-4 m-4 bg-gray-800 rounded-lg text-red-400">
        <div className="flex items-center">
          <FiAlertCircle className="mr-2" />
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 m-4 bg-gray-800 rounded-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-cyan-400 flex items-center mb-4 md:mb-0">
          <FiList className="mr-2" /> Security Logs
        </h2>

        <div className="flex items-center space-x-4">
          <button
            onClick={exportLogs}
            className="flex items-center px-3 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
            disabled={isLoading || logs.length === 0}
          >
            <FiDownload className="mr-2" />
            <span className="hidden md:inline">Export</span>
          </button>

          <button
            onClick={refreshLogs}
            disabled={isLoading}
            className="flex items-center px-3 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <FiLoader className="mr-2 animate-spin" />
            ) : (
              <FiRefreshCw className="mr-2" />
            )}
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            className="pl-10 pr-4 py-2 w-full bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
          disabled={isLoading}
        >
          <option value="all">All Categories</option>
          <option value="authentication">Authentication</option>
          <option value="firewall">Firewall</option>
          <option value="network">Network</option>
          <option value="system">System</option>
          <option value="threat">Threat</option>
        </select>

        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
          disabled={isLoading}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>

        <select
          value={timeRange}
          onChange={(e) => {
            setTimeRange(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
          disabled={isLoading}
        >
          <option value="1h">Last hour</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="all">All time</option>
        </select>

        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
          disabled={isLoading}
        >
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="30">30 per page</option>
          <option value="50">50 per page</option>
        </select>
      </div>

      {/* Log Activity Chart */}
      <div className="bg-gray-700 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <FiActivity className="mr-2" /> Log Activity
          </h3>
          <span className="text-sm text-gray-400">
            {timeRange === "1h"
              ? "Last hour"
              : timeRange === "24h"
              ? "Last 24 hours"
              : timeRange === "7d"
              ? "Last 7 days"
              : "All time"}
          </span>
        </div>
        <div className="h-64">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <FiLoader className="animate-spin text-4xl text-cyan-400" />
            </div>
          ) : filteredLogs.length > 0 ? (
            <Line
              data={getLogChartData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                    labels: { color: "#d1d5db" },
                  },
                },
                scales: {
                  x: {
                    grid: { color: "rgba(55, 65, 81, 0.5)" },
                    ticks: { color: "#9ca3af" },
                  },
                  y: {
                    grid: { color: "rgba(55, 65, 81, 0.5)" },
                    ticks: { color: "#9ca3af" },
                  },
                },
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              No log data available
            </div>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-700 rounded-lg overflow-hidden">
        {isLoading && logs.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <FiLoader className="animate-spin inline-block text-2xl" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            No logs match your filters
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center">
                      <FiClock className="mr-2" /> Timestamp
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">Event</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Severity</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-gray-600 hover:bg-gray-600 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {log.timestamp.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{log.event}</div>
                      <div className="text-xs text-gray-400">{log.details}</div>
                    </td>
                    <td className="px-4 py-3 font-mono">{log.source}</td>
                    <td className="px-4 py-3 capitalize">{log.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`flex items-center ${getSeverityColor(
                          log.severity
                        )}`}
                      >
                        <FiAlertCircle className="mr-1" />
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 bg-gray-800 border-t border-gray-600">
              <div className="text-sm text-gray-400">
                Showing {paginatedLogs.length} of {filteredLogs.length} logs
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className="p-2 rounded-md bg-gray-700 disabled:opacity-50 hover:bg-gray-600"
                >
                  <FiChevronLeft />
                </button>
                <span className="px-3 py-1 bg-gray-700 rounded-md">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                  className="p-2 rounded-md bg-gray-700 disabled:opacity-50 hover:bg-gray-600"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Log Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Total Logs</h3>
          <p className="text-3xl font-mono">{filteredLogs.length}</p>
          <p className="text-sm text-gray-400">in current filters</p>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Critical Events</h3>
          <p className="text-3xl font-mono text-red-400">
            {filteredLogs.filter((l) => l.severity === "critical").length}
          </p>
          <p className="text-sm text-gray-400">in {timeRange}</p>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Most Active Category</h3>
          <p className="text-2xl font-mono capitalize">
            {getMostActiveCategory()}
          </p>
          <p className="text-sm text-gray-400">by event count</p>
        </div>
      </div>
    </div>
  );
}
