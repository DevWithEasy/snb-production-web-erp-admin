"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/utils/firebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import SectionSelector from "@/components/daily_consumption/SectionSelector";
import DatePicker from "@/components/daily_consumption/DatePicker";
import ColumnVisibilityModal from "@/components/daily_consumption/ColumnVisibilityModal";
import { generateDailyPDF } from "@/utils/generateDailyPdf";
import generateDailyExcel from "@/utils/generateDailyExcel";
import formatNumber from "@/utils/formatNumber";
import getPeriodPath from "@/utils/getPeriodPath";
import getPeriodText from "@/utils/getPeriodText";
import Image from "next/image";
import {
  FaFileExcel,
  FaFilePdf,
  FaCalendarAlt,
  FaCog,
  FaArrowLeft,
} from "react-icons/fa";

export default function DailyConsumption() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = searchParams.get("section");

  const [products, setProducts] = useState(null);
  const [materials, setMaterials] = useState({ rm: [], pm: [] });
  const [filteredMaterials, setFilteredMaterials] = useState({
    rm: [],
    pm: [],
  });
  const [filteredProducts, setFilteredProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sections, setSections] = useState([]);

  // Date filter modal state
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [date, setDate] = useState("1");

  // Settings modal state
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    opening: true,
    received: true,
    consumption: true,
    stock: true,
  });

  // Tooltip state
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);

  const periodId = getPeriodPath(user?.current_period);

  const period_products_collection_name = section
    ? `${section}_products_period_${periodId}`
    : null;
  const period_rm_collection_name = section
    ? `${section}_rm_period_${periodId}`
    : null;
  const period_pm_collection_name = section
    ? `${section}_pm_period_${periodId}`
    : null;

  // Fetch sections
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const sectionsData = await getDocs(collection(db, "sections"));
        const sectionsArray = sectionsData.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setSections(sectionsArray);
      } catch (error) {
        console.error("Error fetching sections:", error);
      }
    };
    fetchSections();
  }, []);

  // Fetch from Firestore
  const fetchFromFirestore = async (collectionName) => {
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
  };

  const filterByDateRange = (item, date = 1) => {
    const findDate = parseInt(date);

    function getTotal(data, date) {
      return (
        data
          ?.filter((day) => {
            if (date > 1) {
              return day.date < date;
            } else {
              return day.date === date;
            }
          })
          ?.reduce((acc, day) => acc + (Number(day.qty) || 0), 0) || 0
      );
    }

    const recieved_total =
      item.recieved_days.find((day) => day.date === findDate)?.qty || 0;
    const consumption_total =
      item.consumption_days.find((day) => day.date === findDate)?.qty || 0;

    if (date > 1) {
      const prev_recieved_total = getTotal(item.recieved_days, findDate);
      const prev_consumption_total = getTotal(item.consumption_days, findDate);
      const calOpening =
        Number(item.opening) + prev_recieved_total - prev_consumption_total;

      return {
        ...item,
        opening: formatNumber(calOpening),
        recieved_total : formatNumber(recieved_total),
        consumption_total : formatNumber(consumption_total),
        stock: formatNumber(calOpening + Number(recieved_total) - Number(consumption_total)),
      };
    } else {
      return {
        ...item,
        opening: item.opening,
        recieved_total : formatNumber(recieved_total),
        consumption_total : formatNumber(consumption_total),
        stock:
          formatNumber(Number(item.opening) +
          Number(recieved_total) -
          Number(consumption_total)),
      };
    }
  };

  const filterProductByDateRange = (item, date = 1) => {
    const findDate = parseInt(date);

    const batch = item?.batch.find((day) => day.date === findDate) || {
      qty: 0,
    };
    const carton = item?.carton.find((day) => day.date === findDate) || {
      qty: 0,
    };
    const carton_weight =
      Number(item?.info?.net_weight) *
      Number(item?.info?.total_packet_per_carton || 1);
    const output = (Number(carton.qty) * carton_weight) / 1000;

    return {
      name: item?.name,
      carton_weight: (carton_weight / 1000).toFixed(2),
      batch: batch.qty || 0,
      carton: carton.qty || 0,
      output : formatNumber(output),
    };
  };

  const processProductsData = (products, date = 1) => {
    const processItem = (item) => filterProductByDateRange(item, date);
    const productsProcessed = products?.map(processItem) || [];
    return productsProcessed;
  };

  const processMaterialsData = (data, date) => {
    const processItem = (item) => filterByDateRange(item, date);
    const rmProcessed = data.rm?.map(processItem) || [];
    const pmProcessed = data.pm?.map(processItem) || [];
    return { rm: rmProcessed, pm: pmProcessed };
  };

  const applyDateFilter = (date) => {
    setDate(date.toString());
    const processedProduct = processProductsData(products, date);
    const processed = processMaterialsData(materials, date);
    setFilteredProducts(processedProduct);
    setFilteredMaterials(processed);
    setDateModalVisible(false);
  };

  // useCallback দিয়ে loadMaterials function তৈরি করুন
  const loadMaterials = useCallback(async () => {
    if (!section) return;

    setLoading(true);
    setError(null);
    try {
      const [products, rmData, pmData] = await Promise.all([
        fetchFromFirestore(period_products_collection_name),
        fetchFromFirestore(period_rm_collection_name),
        fetchFromFirestore(period_pm_collection_name),
      ]);

      if (products.length === 0) {
        setError("No Products Found. Reload this screen");
      }

      if (rmData.length === 0 && pmData.length === 0) {
        setError("No materials found for this section and period.");
      }

      const processProducts = processProductsData(products, Number(date));
      const processedData = processMaterialsData(
        { rm: rmData, pm: pmData },
        Number(date)
      );

      // Batch state updates
      setProducts(products);
      setFilteredProducts(processProducts);
      setMaterials({ rm: rmData, pm: pmData });
      setFilteredMaterials(processedData);

      console.log("Loaded materials from Firestore successfully");
    } catch (err) {
      setError("Error fetching materials: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [
    section,
    period_products_collection_name,
    period_rm_collection_name,
    period_pm_collection_name,
    date,
  ]);

  function formatMonthNumber(num) {
    return num < 10 ? "0" + num : num.toString();
  }

  const processData = () => {
    return {
      products_data: filteredProducts || [],
      rm_data: filteredMaterials.rm || [],
      pm_data: filteredMaterials.pm || [],
      date: date,
      period: user?.current_period,
      section: section,
    };
  };

  // Effect কে fix করুন
  useEffect(() => {
    if (section && user?.current_period) {
      // setTimeout ব্যবহার করে next tick এ loadMaterials call করুন
      const timer = setTimeout(() => {
        loadMaterials();
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [section, user?.current_period, loadMaterials]);

  // Alternative solution: useEffect কে separate করুন
  useEffect(() => {
    if (section && user?.current_period) {
      const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
          const [products, rmData, pmData] = await Promise.all([
            fetchFromFirestore(period_products_collection_name),
            fetchFromFirestore(period_rm_collection_name),
            fetchFromFirestore(period_pm_collection_name),
          ]);

          if (products.length === 0) {
            setError("No Products Found. Reload this screen");
          }

          if (rmData.length === 0 && pmData.length === 0) {
            setError("No materials found for this section and period.");
          }

          const processProducts = processProductsData(products, Number(date));
          const processedData = processMaterialsData(
            { rm: rmData, pm: pmData },
            Number(date)
          );

          // Single batch update
          setProducts(products);
          setFilteredProducts(processProducts);
          setMaterials({ rm: rmData, pm: pmData });
          setFilteredMaterials(processedData);
        } catch (err) {
          setError("Error fetching materials: " + err.message);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [section, user?.current_period, date]);

  // Render section selector if no section is selected
  if (!section) {
    return (
      <ProtectedRoute>
        <div className="h-[calc(100vh-65px)] bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Daily Consumption Report
              </h1>
              <SectionSelector
                sections={sections}
                onSectionSelect={(selectedSection) => {
                  router.push(
                    `/user-area/daily-consumption?section=${selectedSection}`
                  );
                }}
                title="Please select a section to view daily consumption"
              />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const renderMaterialSection = (title, items, type) => (
    <>
      <h3 className="text-lg font-bold text-gray-800 mb-3 mt-6">{title}</h3>
      <div className="w-full">
        <table className="w-full bg-white">
          <thead>
            <tr className="bg-blue-600 text-white">
              <td className="p-2 text-center">Name</td>
              <td className="p-2 text-right">Opening</td>
              <td className="p-2 text-right">Recieved</td>
              <td className="p-2 text-right">Consumption</td>
              <td className="p-2 text-right">Stock</td>
            </tr>
          </thead>
          <tbody>
            {items &&
              items.length > 0 &&
              items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="p-2">{item.name || ""}</td>
                  <td className="p-2 text-right">{item.opening || 0}</td>
                  <td className="p-2 text-right">{item.recieved_total || 0}</td>
                  <td className="p-2 text-right">
                    {item.consumption_total || 0}
                  </td>
                  <td className="p-2 text-right">{item.stock || 0}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderProductSection = (title, items) => (
    <>
      <h3 className="text-lg font-bold text-gray-800 mb-3 mt-6">{title}</h3>
      <div className="w-full">
        <table className="w-full bg-white">
          <thead>
            <tr className="bg-blue-600 text-white">
              <td className="p-2 text-center">Product name</td>
              <td className="p-2 text-right">Carton Weight (kg)</td>
              <td className="p-2 text-right">Batch</td>
              <td className="p-2 text-right">Carton</td>
              <td className="p-2 text-right">Output (Kg)</td>
            </tr>
          </thead>
          <tbody>
            {items &&
              items.length > 0 &&
              items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="p-2">{item.name || ""}</td>
                  <td className="p-2 text-right">{item.carton_weight || 0}</td>
                  <td className="p-2 text-right">{item.batch || 0}</td>
                  <td className="p-2 text-right">{item.carton || 0}</td>
                  <td className="p-2 text-right">{item.output || 0}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-gray-600">Loading sections...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-lg mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaArrowLeft className="text-gray-600" />
                </button>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    {section?.charAt(0).toUpperCase() + section?.slice(1)}{" "}
                    Section
                  </h1>
                  <p className="text-sm text-gray-600">
                    {formatMonthNumber(date)}{" "}
                    {getPeriodText(user?.current_period)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() =>
                    generateDailyExcel(
                      setGeneratingExcel,
                      processData(),
                      section,
                      user,
                      date
                    )
                  }
                  disabled={generatingExcel}
                  className="p-2 text-green-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Export to Excel"
                >
                  {generatingExcel ? (
                    <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FaFileExcel size={20} />
                  )}
                </button>

                <button
                  onClick={() =>
                    generateDailyPDF(
                      setGeneratingPdf,
                      processData(),
                      section,
                      user,
                      date
                    )
                  }
                  disabled={generatingPdf}
                  className="p-2 text-red-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Export to PDF"
                >
                  {generatingPdf ? (
                    <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FaFilePdf size={20} />
                  )}
                </button>

                <button
                  onClick={() => setDateModalVisible(true)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Select Date"
                >
                  <FaCalendarAlt size={20} />
                </button>

                {/* <button
                  onClick={() => setSettingsModalVisible(true)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Settings"
                >
                  <FaCog size={20} />
                </button> */}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Company Header */}
          <div className="text-center mb-8">
            <Image
              src="/logo.png"
              alt="Company Logo"
              width={80}
              height={80}
              className="mx-auto mb-4 rounded-full"
            />
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              S&B Nice Nice Food Valley Ltd.
            </h2>
            <p className="text-gray-600">
              {section.charAt(0).toUpperCase() + section.slice(1)} Section
            </p>
            <p className="text-gray-600">
              Daily Consumption of {formatMonthNumber(date)}{" "}
              {user?.current_period}
            </p>
          </div>

          {/* Products Section */}
          {filteredProducts &&
            filteredProducts.length > 0 &&
            renderProductSection("Finished Products", filteredProducts)}

          {/* Materials Sections */}
          {filteredMaterials.rm.length > 0 &&
            renderMaterialSection("Raw Materials", filteredMaterials.rm, "rm")}

          {filteredMaterials.pm.length > 0 &&
            renderMaterialSection(
              "Packaging Materials",
              filteredMaterials.pm,
              "pm"
            )}

          {filteredProducts?.length === 0 &&
            filteredMaterials.rm.length === 0 &&
            filteredMaterials.pm.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No data available for the selected date
              </div>
            )}
        </div>

        {/* Modals */}
        <DatePicker
          dateModalVisible={dateModalVisible}
          setDateModalVisible={setDateModalVisible}
          date={date}
          setDate={setDate}
          applyDateFilter={applyDateFilter}
        />

        <ColumnVisibilityModal
          settingsModalVisible={settingsModalVisible}
          setSettingsModalVisible={setSettingsModalVisible}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
        />

        {/* Tooltip */}
        {tooltipVisible && (
          <div
            className="fixed bg-gray-900 text-white px-3 py-2 rounded-lg text-sm max-w-xs z-50 shadow-lg"
            style={{
              top: tooltipPosition.y - 50,
              left: Math.max(10, tooltipPosition.x - 150),
            }}
          >
            {tooltipContent}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
