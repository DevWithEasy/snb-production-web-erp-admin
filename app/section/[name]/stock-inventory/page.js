"use client";

import ColumnVisibilityModal from "@/components/daily_consumption/ColumnVisibilityModal";
import DCFilterModal from "@/components/production_dc/DCFilterModal";
import { collection, getDocs } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { FaCalendarAlt, FaCog, FaBox, FaCube, FaBars, FaTimes } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/utils/firebaseConfig";
import formatNumber from "@/utils/formatNumber";
import getPeriodPath from "@/utils/getPeriodPath";

export default function StockInventory() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const section = params.name;

  const [materials, setMaterials] = useState({ rm: [], pm: [] });
  const [filteredMaterials, setFilteredMaterials] = useState({
    rm: [],
    pm: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Date filter modal state
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [startDate, setStartDate] = useState("1");
  const [endDate, setEndDate] = useState("31");

  // Settings modal state
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    opening: true,
    received: true,
    consumption: true,
    stock: true,
  });

  // Mobile card view state
  const [mobileView, setMobileView] = useState("card"); // 'card' or 'table'

  // Tooltip state
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const periodId = getPeriodPath(user?.current_period);

  const period_rm_collection_name = `${section}_rm_period_${periodId}`;
  const period_pm_collection_name = `${section}_pm_period_${periodId}`;

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setMobileView("card");
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Fetch from Firestore
  const fetchFromFirestore = useCallback(async (collectionName) => {
    try {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      let dataArray = [];
      snapshot.forEach((doc) => {
        dataArray.push({ id: doc.id, ...doc.data() });
      });
      return dataArray.sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
      console.error(`Fetch error for ${collectionName}:`, err);
      return [];
    }
  }, []);

  // Updated date filter with correct opening and closing logic
  const filterByDateRange = useCallback((item, startDate, endDate) => {
    const start = parseInt(startDate);
    const end = parseInt(endDate);

    function getTotal(data, start, end) {
      return (
        data
          ?.filter((day) => {
            if (start > 1) {
              return day.date < start;
            } else {
              return day.date >= start && day.date <= end;
            }
          })
          ?.reduce((acc, day) => acc + (Number(day.qty) || 0), 0) || 0
      );
    }

    //total filtered date
    const recieved_total = getTotal(item.recieved_days, start, end);
    const consumption_total = getTotal(item.consumption_days, start, end);

    if (start > 1) {
      const prev_recieved_total = getTotal(item.recieved_days, start, end);
      const prev_consumption_total = getTotal(
        item.consumption_days,
        start,
        end
      );
      const calOpening =
        Number(item.opening) + prev_recieved_total - prev_consumption_total;
      return {
        ...item,
        opening: calOpening,
        recieved_total: prev_recieved_total,
        consumption_total: prev_consumption_total,
        stock: calOpening + prev_recieved_total - prev_consumption_total,
      };
    } else {
      return {
        ...item,
        opening: item.opening,
        recieved_total,
        consumption_total,
        stock: Number(item.opening) + recieved_total - consumption_total,
      };
    }
  }, []);

  const processMaterialsData = useCallback(
    (data, start = 1, end = 31) => {
      const processItem = (item) => filterByDateRange(item, start, end);
      const rmProcessed = data.rm?.map(processItem) || [];
      const pmProcessed = data.pm?.map(processItem) || [];
      return { rm: rmProcessed, pm: pmProcessed };
    },
    [filterByDateRange]
  );

  const applyDateFilter = useCallback(() => {
    const start = Math.max(1, parseInt(startDate) || 1);
    const end = Math.min(31, parseInt(endDate) || 31);

    if (start > end) {
      alert("⚠️ Date Error: Please select start date smaller than end date");
      return;
    }

    setStartDate(start.toString());
    setEndDate(end.toString());

    const processed = processMaterialsData(materials, start, end);
    setFilteredMaterials(processed);
    setDateModalVisible(false);
  }, [startDate, endDate, materials, processMaterialsData]);

  const resetDateFilter = useCallback(() => {
    setStartDate("1");
    setEndDate("31");
    setFilteredMaterials(processMaterialsData(materials, 1, 31));
    setDateModalVisible(false);
  }, [materials, processMaterialsData]);

  // Show tooltip function
  const showTooltip = useCallback((content, event) => {
    const { clientX, clientY } = event;
    setTooltipContent(content);
    setTooltipPosition({ x: clientX, y: clientY });
    setTooltipVisible(true);

    // Auto hide after 3 seconds
    setTimeout(() => {
      setTooltipVisible(false);
    }, 3000);
  }, []);

  // Hide tooltip function
  const hideTooltip = useCallback(() => {
    setTooltipVisible(false);
  }, []);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch data directly from Firestore
      const [rmData, pmData] = await Promise.all([
        fetchFromFirestore(period_rm_collection_name),
        fetchFromFirestore(period_pm_collection_name),
      ]);

      if (rmData.length === 0 && pmData.length === 0) {
        setError("No materials found for this section and period.");
      }

      const processedData = processMaterialsData(
        { rm: rmData, pm: pmData },
        Number(startDate),
        Number(endDate)
      );

      // Use setTimeout to avoid synchronous state updates in useEffect
      setTimeout(() => {
        setMaterials({ rm: rmData, pm: pmData });
        setFilteredMaterials(processedData);
      }, 0);

      console.log("Loaded materials from Firestore successfully");
    } catch (err) {
      setError("Error fetching materials: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [
    section,
    user?.current_period,
    fetchFromFirestore,
    processMaterialsData,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    if (section && user?.current_period) {
      loadMaterials();
    }
  }, [section, user?.current_period, loadMaterials]);

  // Mobile Card View Component
  const MobileMaterialCard = ({ item, type }) => (
    <div
      onClick={() =>
        router.push(`/section/${section}/stock-inventory/${item.id}?type=${type}`)
      }
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 cursor-pointer hover:shadow-md transition-all duration-200 active:scale-[0.98]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <FaCube className="text-blue-600 text-sm" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 text-sm truncate">
              {item.name}
            </h3>
            <p className="text-xs text-gray-500 truncate">ID: {item.id}</p>
          </div>
        </div>
      </div>

      {/* Values Grid */}
      <div className="grid grid-cols-2 gap-3">
        {columnVisibility.opening && (
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Opening</div>
            <div className="font-semibold text-gray-700">
              {formatNumber(item.opening) || 0}
            </div>
          </div>
        )}
        
        {columnVisibility.received && (
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Received</div>
            <div className="font-semibold text-blue-600">
              {formatNumber(item.recieved_total) || 0}
            </div>
          </div>
        )}
        
        {columnVisibility.consumption && (
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Consumption</div>
            <div className="font-semibold text-red-600">
              {formatNumber(item.consumption_total || 0)}
            </div>
          </div>
        )}
        
        {columnVisibility.stock && (
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Stock</div>
            <div className={`font-semibold ${
              (item.stock || 0) > 0
                ? "text-green-600"
                : (item.stock || 0) < 0
                ? "text-red-600"
                : "text-gray-600"
            }`}>
              {formatNumber(item.stock || 0)}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderMaterialSection = (title, items, type, icon) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
      {/* Table Header */}
      <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-3">
            {icon}
            <h2 className="text-lg sm:text-xl font-bold">{title}</h2>
            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs sm:text-sm">
              {items.length} items
            </span>
          </div>
          <div className="text-blue-100 text-xs sm:text-sm">
            Period: {startDate}-{endDate}
          </div>
        </div>
      </div>

      {/* Mobile View Toggle */}
      {isMobile && (
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">View:</span>
            <div className="flex bg-white rounded-lg border border-gray-300 p-1">
              <button
                onClick={() => setMobileView("card")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  mobileView === "card"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setMobileView("table")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  mobileView === "table"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Card View */}
      {isMobile && mobileView === "card" && (
        <div className="p-4">
          {items && items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <MobileMaterialCard key={item.id} item={item} type={type} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FaBox className="text-gray-300 text-3xl mx-auto mb-2" />
              <div>No {title.toLowerCase()} found</div>
            </div>
          )}
        </div>
      )}

      {/* Table View (Desktop & Mobile Table Mode) */}
      {(!isMobile || mobileView === "table") && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-3 sm:p-4 font-semibold text-gray-700 min-w-[200px] sm:min-w-[300px] text-sm sm:text-base">
                  Material Name
                </th>
                {columnVisibility.opening && (
                  <th className="text-center p-3 sm:p-4 font-semibold text-gray-700 min-w-20 sm:min-w-[120px] text-sm sm:text-base">
                    Opening
                  </th>
                )}
                {columnVisibility.received && (
                  <th className="text-center p-3 sm:p-4 font-semibold text-gray-700 min-w-20 sm:min-w-[120px] text-sm sm:text-base">
                    Received
                  </th>
                )}
                {columnVisibility.consumption && (
                  <th className="text-center p-3 sm:p-4 font-semibold text-gray-700 min-w-20 sm:min-w-[120px] text-sm sm:text-base">
                    Consumption
                  </th>
                )}
                {columnVisibility.stock && (
                  <th className="text-center p-3 sm:p-4 font-semibold text-gray-700 min-w-20 sm:min-w-[120px] text-sm sm:text-base">
                    Stock
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items && items.length > 0 ? (
                items.map((item, index) => (
                  <tr
                    key={item.id}
                    onClick={() =>
                      router.push(
                        `/section/${section}/stock-inventory/${item.id}?type=${type}`
                      )
                    }
                    className="hover:bg-blue-50 cursor-pointer transition-colors duration-200 group"
                  >
                    {/* Material Name */}
                    <td className="px-3 py-2 sm:px-4 sm:py-3">
                      <div
                        className="flex items-center space-x-2 sm:space-x-3"
                        onMouseEnter={(e) => showTooltip(item.name, e)}
                        onMouseLeave={hideTooltip}
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors shrink-0">
                          <FaCube className="text-blue-600 text-xs sm:text-sm" />
                        </div>
                        <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors text-sm sm:text-base truncate min-w-0">
                          {item.name}
                        </div>
                      </div>
                    </td>

                    {/* Opening */}
                    {columnVisibility.opening && (
                      <td className="px-2 py-2 sm:px-4 sm:py-3 text-center">
                        <span className="text-gray-700 text-sm sm:text-base">
                          {formatNumber(item.opening) || 0}
                        </span>
                      </td>
                    )}

                    {/* Received */}
                    {columnVisibility.received && (
                      <td className="px-2 py-2 sm:px-4 sm:py-3 text-center">
                        <span className="text-blue-600 text-sm sm:text-base">
                          {formatNumber(item.recieved_total) || 0}
                        </span>
                      </td>
                    )}

                    {/* Consumption */}
                    {columnVisibility.consumption && (
                      <td className="px-2 py-2 sm:px-4 sm:py-3 text-center">
                        <span className="text-red-600 text-sm sm:text-base">
                          {formatNumber(item.consumption_total || 0)}
                        </span>
                      </td>
                    )}

                    {/* Stock */}
                    {columnVisibility.stock && (
                      <td className="px-2 py-2 sm:px-4 sm:py-3 text-center">
                        <span
                          className={`text-sm sm:text-base ${
                            (item.stock || 0) > 0
                              ? "text-green-600"
                              : (item.stock || 0) < 0
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {formatNumber(item.stock || 0)}
                        </span>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={
                      Object.values(columnVisibility).filter(Boolean).length + 1
                    }
                    className="p-6 sm:p-8 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <FaBox className="text-gray-300 text-3xl sm:text-4xl mb-2 sm:mb-3" />
                      <div className="text-base sm:text-lg font-medium text-gray-400">
                        No {title.toLowerCase()} found
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 mt-1">
                        {startDate !== "1" || endDate !== "31"
                          ? "Try adjusting your date filter"
                          : "No materials available for this period"}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Footer */}
      {items && items.length > 0 && !isMobile && (
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm text-gray-600 gap-2">
            <div>
              Showing <span className="font-semibold">{items.length}</span>{" "}
              materials
            </div>
            <div className="flex space-x-4 justify-center sm:justify-start">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span className="text-xs sm:text-sm">Received</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-600 rounded"></div>
                <span className="text-xs sm:text-sm">Consumption</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-600 rounded"></div>
                <span className="text-xs sm:text-sm">Stock</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 text-base sm:text-lg text-center">
          Loading materials inventory...
        </p>
        <p className="text-gray-400 text-sm mt-2 text-center">
          Please wait while we fetch your data
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 max-w-md w-full text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <FaBox className="text-red-600 text-lg sm:text-xl" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">
            Loading Error
          </h3>
          <p className="text-red-600 text-sm sm:text-base mb-4">{error}</p>
          <button
            onClick={loadMaterials}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto sm:p-4 lg:p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 truncate">
                {section &&
                  `${
                    section.charAt(0).toUpperCase() + section.slice(1)
                  } Inventory`}
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Manage and track your materials inventory
                {(startDate !== "1" || endDate !== "31") && (
                  <span className="text-blue-600 font-medium ml-1 sm:ml-2">
                    (Date Range: {startDate}-{endDate})
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => setDateModalVisible(true)}
                className="flex items-center space-x-1 sm:space-x-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
                title="Date Filter"
              >
                <FaCalendarAlt size={14} className="sm:w-4" />
                <span className="hidden sm:inline">Date Filter</span>
                <span className="sm:hidden">Filter</span>
              </button>
              <button
                onClick={() => setSettingsModalVisible(true)}
                className="flex items-center space-x-1 sm:space-x-2 bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
                title="Column Settings"
              >
                <FaCog size={14} className="sm:w-4" />
                <span className="hidden sm:inline">Columns</span>
                <span className="sm:hidden">Columns</span>
              </button>
            </div>
          </div>
        </div>

        {/* Date Filter Modal */}
        <DCFilterModal
          dateModalVisible={dateModalVisible}
          setDateModalVisible={setDateModalVisible}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          resetDateFilter={resetDateFilter}
          applyDateFilter={applyDateFilter}
        />

        {/* Settings Modal */}
        <ColumnVisibilityModal
          settingsModalVisible={settingsModalVisible}
          setSettingsModalVisible={setSettingsModalVisible}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
        />

        {/* Tooltip */}
        {tooltipVisible && (
          <div
            className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm max-w-xs shadow-lg"
            style={{
              top: tooltipPosition.y - 50,
              left: Math.max(10, tooltipPosition.x - 150),
            }}
          >
            {tooltipContent}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-8 border-transparent border-t-gray-900"></div>
          </div>
        )}

        {/* Content */}
        {filteredMaterials.rm.length > 0 || filteredMaterials.pm.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            {renderMaterialSection(
              "Raw Materials",
              filteredMaterials.rm,
              "rm",
              <FaBox className="text-white text-lg sm:text-xl" />
            )}
            {renderMaterialSection(
              "Packaging Materials",
              filteredMaterials.pm,
              "pm",
              <FaCube className="text-white text-lg sm:text-xl" />
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-12 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaBox className="text-gray-400 text-xl sm:text-2xl" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
              No Materials Found
            </h3>
            <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">
              No materials data available for the current filters. Try adjusting
              your date range or check your data.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={resetDateFilter}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Reset Date Filter
              </button>
              <button
                onClick={loadMaterials}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
              >
                Reload Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}