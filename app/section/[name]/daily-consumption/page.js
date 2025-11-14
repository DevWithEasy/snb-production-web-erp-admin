"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import ColumnVisibilityModal from "@/components/daily_consumption/ColumnVisibilityModal";
import DatePicker from "@/components/daily_consumption/DatePicker";
import SectionSelector from "@/components/daily_consumption/SectionSelector";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/utils/firebaseConfig";
import formatNumber from "@/utils/formatNumber";
import generateDailyExcel from "@/utils/generateDailyExcel";
import { generateDailyPDF } from "@/utils/generateDailyPdf";
import getPeriodPath from "@/utils/getPeriodPath";
import getPeriodText from "@/utils/getPeriodText";
import { collection, getDocs } from "firebase/firestore";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaFileDownload,
  FaFileExcel,
  FaFilePdf,
} from "react-icons/fa";

export default function DailyConsumption() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const section = params.name;

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
      item.recieved_days?.find((day) => day.date === findDate)?.qty || 0;
    const consumption_total =
      item.consumption_days?.find((day) => day.date === findDate)?.qty || 0;

    if (date > 1) {
      const prev_recieved_total = getTotal(item.recieved_days, findDate);
      const prev_consumption_total = getTotal(item.consumption_days, findDate);
      const calOpening =
        Number(item.opening) + prev_recieved_total - prev_consumption_total;

      return {
        ...item,
        opening: formatNumber(calOpening),
        recieved_total: formatNumber(recieved_total),
        consumption_total: formatNumber(consumption_total),
        stock: formatNumber(
          calOpening + Number(recieved_total) - Number(consumption_total)
        ),
      };
    } else {
      return {
        ...item,
        opening: item.opening,
        recieved_total: formatNumber(recieved_total),
        consumption_total: formatNumber(consumption_total),
        stock: formatNumber(
          Number(item.opening) +
            Number(recieved_total) -
            Number(consumption_total)
        ),
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
      output: formatNumber(output),
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

  // তারিখ পরিবর্তন করলে শুধু ফিল্টারিং হবে, ডেটা লোড হবে না
  const applyDateFilter = (date) => {
    setDate(date.toString());

    // শুধু ফিল্টারিং করুন
    if (products) {
      const processedProduct = processProductsData(products, date);
      setFilteredProducts(processedProduct);
    }

    if (materials.rm.length > 0 || materials.pm.length > 0) {
      const processed = processMaterialsData(materials, date);
      setFilteredMaterials(processed);
    }

    setDateModalVisible(false);
  };

  // useCallback দিয়ে loadData function তৈরি করুন (শুধু একবার কল হবে)
  const loadData = useCallback(async () => {
    if (!section || !user?.current_period) return;

    setLoading(true);
    setError(null);
    try {
      const [productsData, rmData, pmData] = await Promise.all([
        fetchFromFirestore(period_products_collection_name),
        fetchFromFirestore(period_rm_collection_name),
        fetchFromFirestore(period_pm_collection_name),
      ]);

      if (productsData.length === 0) {
        setError("No Products Found. Reload this screen");
      }

      if (rmData.length === 0 && pmData.length === 0) {
        setError("No materials found for this section and period.");
      }

      // মূল ডেটা সেট করুন (সম্পূর্ণ মাসের ডেটা)
      setProducts(productsData);
      setMaterials({ rm: rmData, pm: pmData });

      // বর্তমান তারিখ অনুযায়ী ফিল্টারড ডেটা সেট করুন
      const processProducts = processProductsData(productsData, Number(date));
      const processedData = processMaterialsData(
        { rm: rmData, pm: pmData },
        Number(date)
      );

      setFilteredProducts(processProducts);
      setFilteredMaterials(processedData);

      console.log("Loaded all data from Firestore successfully");
    } catch (err) {
      setError("Error fetching materials: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [section, user?.current_period, date]); // date dependency রাখুন যাতে প্রথম লোডে সঠিক ডেটা ফিল্টার হয়

  // শুধুমাত্র প্রথমবার এবং section/user পরিবর্তন হলে ডেটা লোড করুন
  useEffect(() => {
    if (section && user?.current_period) {
      loadData();
    }
  }, [section, user?.current_period, loadData]);

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

  // Render section selector if no section is selected
  if (!section) {
    return (
      <ProtectedRoute>
        <div className="h-[calc(100vh-65px)] bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
                Daily Consumption Report
              </h1>
              <SectionSelector
                sections={sections}
                onSectionSelect={(selectedSection) => {
                  router.push(
                    `/section/daily-consumption?section=${selectedSection}`
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
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 mt-6">{title}</h3>
      <div className="w-full text-xs sm:text-sm md:text-sm overflow-x-auto">
        <table className="w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm transition-colors duration-300">
          <thead>
            <tr className="bg-blue-600 dark:bg-blue-700 text-white">
              <td className="p-2 text-center font-medium">Name</td>
              {columnVisibility.opening && (
                <td className="p-2 text-right font-medium">Opening</td>
              )}
              {columnVisibility.received && (
                <td className="p-2 text-right font-medium">Received</td>
              )}
              {columnVisibility.consumption && (
                <td className="p-2 text-right font-medium">Consumption</td>
              )}
              {columnVisibility.stock && (
                <td className="p-2 text-right font-medium">Stock</td>
              )}
            </tr>
          </thead>
          <tbody>
            {items &&
              items.length > 0 &&
              items.map((item, index) => (
                <tr 
                  key={index} 
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <td className="p-2 text-gray-900 dark:text-gray-100">{item.name || ""}</td>
                  {columnVisibility.opening && (
                    <td className="p-2 text-right text-gray-700 dark:text-gray-300">{item.opening || 0}</td>
                  )}
                  {columnVisibility.received && (
                    <td className="p-2 text-right text-gray-700 dark:text-gray-300">{item.recieved_total || 0}</td>
                  )}
                  {columnVisibility.consumption && (
                    <td className="p-2 text-right text-gray-700 dark:text-gray-300">{item.consumption_total || 0}</td>
                  )}
                  {columnVisibility.stock && (
                    <td className="p-2 text-right text-gray-700 dark:text-gray-300">{item.stock || 0}</td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderProductSection = (title, items) => (
    <>
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 mt-6">{title}</h3>
      <div className="w-full text-xs sm:text-sm md:text-sm overflow-x-auto">
        <table className="w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm transition-colors duration-300">
          <thead>
            <tr className="bg-blue-600 dark:bg-blue-700 text-white">
              <td className="p-2 text-center font-medium">Product name</td>
              <td className="p-2 text-right font-medium">Carton Weight (kg)</td>
              <td className="p-2 text-right font-medium">Batch</td>
              <td className="p-2 text-right font-medium">Carton</td>
              <td className="p-2 text-right font-medium">Output (Kg)</td>
            </tr>
          </thead>
          <tbody>
            {items &&
              items.length > 0 &&
              items.map((item, index) => (
                <tr 
                  key={index} 
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <td className="p-2 text-gray-900 dark:text-gray-100">{item.name || ""}</td>
                  <td className="p-2 text-right text-gray-700 dark:text-gray-300">{item.carton_weight || 0}</td>
                  <td className="p-2 text-right text-gray-700 dark:text-gray-300">{item.batch || 0}</td>
                  <td className="p-2 text-right text-gray-700 dark:text-gray-300">{item.carton || 0}</td>
                  <td className="p-2 text-right text-gray-700 dark:text-gray-300">{item.output || 0}</td>
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center transition-colors duration-300">
          <div className="w-8 h-8 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading sections...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 text-lg mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Header */}
        <div className="flex justify-end items-center space-x-2 p-4 sm:px-6 lg:px-8">
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
            className="p-2 text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Export to Excel"
          >
            {generatingExcel ? (
              <div className="w-5 h-5 border-2 border-green-600 dark:border-green-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FaFileExcel size={18} />
            )}
          </button>

          <button
            onClick={() =>
              generateDailyPDF(
                setGeneratingPdf,
                processData(),
                section,
                user,
                date,
                false
              )
            }
            disabled={generatingPdf}
            className="p-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Export to PDF"
          >
            {generatingPdf ? (
              <div className="w-5 h-5 border-2 border-red-600 dark:border-red-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FaFilePdf size={18} />
            )}
          </button>

          <button
            onClick={() =>
              generateDailyPDF(
                setGeneratingPdf,
                processData(),
                section,
                user,
                date,
                true
              )
            }
            disabled={generatingPdf}
            className="p-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Export to PDF"
          >
            {generatingPdf ? (
              <div className="w-5 h-5 border-2 border-red-600 dark:border-red-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FaFileDownload size={18} />
            )}
          </button>

          <button
            onClick={() => setDateModalVisible(true)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Select Date"
          >
            <FaCalendarAlt size={18} />
          </button>
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
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-2">
              S&B Nice Nice Food Valley Ltd.
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {section.charAt(0).toUpperCase() + section.slice(1)} Section
            </p>
            <p className="text-gray-600 dark:text-gray-400">
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
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
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
            className="fixed bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm max-w-xs z-50 shadow-lg transition-colors duration-300"
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