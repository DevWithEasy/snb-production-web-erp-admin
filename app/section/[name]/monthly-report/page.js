"use client";

import { useParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FaFileExcel,
  FaPrint,
  FaIndustry,
  FaBoxes,
  FaDownload,
  FaFilePdf,
} from "react-icons/fa";
import PmMateView from "@/components/monthly_report/PmMateView";
import ProductView from "@/components/monthly_report/ProductView";
import RawMateView from "@/components/monthly_report/RawMateView";
import SummaryView from "@/components/monthly_report/SummaryView";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/utils/firebaseConfig";
import formatNumber from "@/utils/formatNumber";
import generateMonthlyExcel from "@/utils/generateMonthlyExcel";
import { generateMonthlyPDF } from "@/utils/generateMonthlyPdf";
import getPeriodPath from "@/utils/getPeriodPath";
import Image from "next/image";
import getPercenteage from "@/utils/getPercentage";

export default function MonthlyReport() {
  const { user } = useAuth();
  const params = useParams();
  const section = params.name;

  const [products, setProducts] = useState(null);
  const [materials, setMaterials] = useState({ rm: [], pm: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);

  const periodId = getPeriodPath(user?.current_period);

  const period_products_collection_name = `${section}_products_period_${periodId}`;
  const period_rm_collection_name = `${section}_rm_period_${periodId}`;
  const period_pm_collection_name = `${section}_pm_period_${periodId}`;

  const fetchFromFirestore = async (collectionName) => {
    try {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      const dataArray = [];
      snapshot.forEach((doc) => dataArray.push({ id: doc.id, ...doc.data() }));
      return dataArray.sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
      console.error(`Error fetching collection ${collectionName}:`, err);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [recipeData, rmData, pmData] = await Promise.all([
          fetchFromFirestore(period_products_collection_name),
          fetchFromFirestore(period_rm_collection_name),
          fetchFromFirestore(period_pm_collection_name),
        ]);

        setProducts(recipeData);
        setMaterials({ rm: rmData, pm: pmData });

        if (rmData.length === 0 && pmData.length === 0) {
          setError("No materials found for this section and period.");
        }

        console.log("Loaded all data from Firestore");
      } catch (err) {
        setError("Error fetching data: " + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (section && user?.current_period) {
      fetchData();
    }
  }, [section, user?.current_period]);

  const actualRMConsumptionBatchWise = products?.map((product) => {
    const totalBatch = product?.batch?.reduce(
      (acc, curr) => acc + Number(curr.qty),
      0
    );
    return product.rm.map((r) => {
      return {
        id: r.id,
        qty: Number(r.qty) * totalBatch,
      };
    });
  });

  const actualRMConsumptionCartonWise = products?.map((product) => {
    const totalCarton = product?.carton?.reduce(
      (acc, curr) => acc + Number(curr.qty),
      0
    );
    return product.carton_rm.map((r) => {
      return {
        id: r.id,
        qty: Number(r.qty) * totalCarton,
      };
    });
  });

  const actualPMConsumptionCartonWise = products?.map((product) => {
    const totalCarton = product?.carton?.reduce(
      (acc, curr) => acc + Number(curr.qty),
      0
    );
    return product.carton_pm.map((r) => {
      return {
        id: r.id,
        qty: Number(r.qty) * totalCarton,
      };
    });
  });

  function mergeArrays(arrays) {
    const mergedMap = new Map();

    arrays.forEach((array) => {
      array.forEach((item) => {
        const key = item.id;

        if (mergedMap.has(key)) {
          const existing = mergedMap.get(key);
          existing.qty += item?.qty;
        } else {
          mergedMap.set(key, { ...item });
        }
      });
    });

    return Array.from(mergedMap.values());
  }

  function processLossPercent(total, diff) {
    return (diff / total) * 100;
  }

  function gainLoss(total, diff, type) {
    const value = diff / total;
    const findValue = getPercenteage(type, true);
    return value > findValue ? true : false;
  }

  function lossGainQuantity(total, diff, type) {
    if (diff === 0) {
      return diff;
    } else if(diff < 0){
      return -(diff)
    } else {
      const findValue = getPercenteage(type, true);
      const acceptValue = total * findValue;
      const value = acceptValue - diff;
      return value;
    }
  }

  function processData() {
    if (!products) return {};

    //production calculation
    const products_data = products.map((product) => {
      const info = product?.info;
      const total_batch = product?.batch?.reduce(
        (acc, curr) => acc + Number(curr.qty),
        0
      );
      const total_carton = product?.carton?.reduce(
        (acc, curr) => acc + Number(curr.qty),
        0
      );

      const carton_weight =
        (Number(info?.net_weight || 0) *
          Number(info?.total_packet_per_carton)) /
        1000;

      const total_carton_weight = total_carton * carton_weight;
      return {
        id: product.id,
        name: product.name,
        total_batch,
        total_carton,
        carton_weight,
        total_carton_weight,
      };
    });

    //rm & pm consumption calculation
    const batch_rm_consumption = mergeArrays(actualRMConsumptionBatchWise);
    const carton_rm_consumption = mergeArrays(actualRMConsumptionCartonWise);
    const carton_pm_consumption = mergeArrays(actualPMConsumptionCartonWise);

    const rm_data = materials?.rm
      .map((item) => {
        const recieved = item?.recieved_days?.reduce(
          (acc, curr) => acc + Number(curr.qty),
          0
        );
        const actual_rm_batch_consumption =
          batch_rm_consumption.find((rm) => rm.id === item.id)?.qty || 0;
        const actual_rm_carton_consumption =
          carton_rm_consumption.find((rm) => rm.id === item.id)?.qty || 0;

        const consumption =
          Number(item?.opening) + recieved - Number(item?.closing);

        const rm_bacth_diff = actual_rm_batch_consumption - consumption;
        const rm_carton_diff = actual_rm_carton_consumption - consumption;

        const rm_bacth_diff_value = rm_bacth_diff * item.price || 0;
        const rm_carton_diff_value = rm_carton_diff * item.price || 0;

        const gen_item = {
          id: item.id,
          name: item.name,
          unit: item.unit,
          opening: item.opening,
          recieved,
          consumption,
          closing: item.closing,
          actual_rm_batch_consumption,
          actual_rm_carton_consumption,
          rm_bacth_diff,
          rm_bacth_diff_value,
          rm_carton_diff,
          rm_carton_diff_value,
        };
        return gen_item;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const pm_data = materials?.pm
      .map((item) => {
        const recieved = item?.recieved_days?.reduce(
          (acc, curr) => acc + Number(curr?.qty),
          0
        );

        const actual_pm_carton_consumption =
          carton_pm_consumption.find((rm) => rm.id === item.id)?.qty || 0;

        const consumption =
          Number(item?.opening) + recieved - Number(item?.closing);

        const pm_carton_diff = consumption - actual_pm_carton_consumption;

        const loss_percent = processLossPercent(consumption, pm_carton_diff);
        const status = gainLoss(consumption, pm_carton_diff, item.type);
        const lossGainQty = lossGainQuantity(
          consumption,
          pm_carton_diff,
          item.type
        );
        const lossGainValue = lossGainQty * Number(item.price) || 0;

        const gen_item = {
          id: item.id,
          name: item.name,
          unit: item.unit,
          opening: item.opening,
          recieved,
          consumption,
          closing: item.closing,
          actual_pm_carton_consumption,
          pm_carton_diff,
          loss_percent,
          status,
          lgQty: lossGainQty,
          lgValue: lossGainValue,
        };
        return gen_item;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    //process loss calculation
    const total_input = rm_data?.reduce(
      (acc, curr) => acc + curr?.consumption,
      0
    );
    const total_output = products_data?.reduce(
      (acc, curr) => acc + curr?.total_carton_weight,
      0
    );
    const process_loss = total_input - total_output;
    const loss_percent = processLossPercent(total_input, process_loss);

    const rm_batch_diff_price_value = rm_data.reduce(
      (acc, e) => acc + e.rm_bacth_diff_value,
      0
    );
    const rm_carton_diff_price_value = rm_data.reduce(
      (acc, e) => acc + e.rm_carton_diff_value,
      0
    );
    const pm_carton_diff_price_value = pm_data.reduce(
      (acc, e) => acc + e.lgValue,
      0
    );

    const bacth_carton_diff_total_value =
      rm_batch_diff_price_value + pm_carton_diff_price_value;
    const carton_diff_total_value =
      rm_carton_diff_price_value + pm_carton_diff_price_value;

    return {
      products_data,
      rm_data,
      pm_data,
      total_input: formatNumber(total_input),
      total_output: formatNumber(total_output),
      process_loss: formatNumber(process_loss),
      loss_percent: formatNumber(loss_percent),
      lossGain: {
        rm_batch_diff_price_value,
        rm_carton_diff_price_value,
        pm_carton_diff_price_value,
        bacth_carton_diff_total_value,
        carton_diff_total_value,
      },
    };
  }

  const handleGenerateExcel = async () => {
    await generateMonthlyExcel(
      setGeneratingExcel,
      processData(),
      section,
      user
    );
  };

  const handleGeneratePDF = async (save = true) => {
    await generateMonthlyPDF(
      setGeneratingPdf,
      processData(),
      section,
      user,
      save
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-5 transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Loading products and materials...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-5 transition-colors duration-300">
        <p className="text-red-500 dark:text-red-400 text-center mb-4">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          Reload
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        {/* Header with Export Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
            {section &&
              `${
                section.charAt(0).toUpperCase() + section.slice(1)
              } Monthly Report`}
          </h1>
          <div className="flex gap-2 md:gap-4">
            <button
              onClick={handleGenerateExcel}
              disabled={generatingExcel}
              className="flex items-center gap-2 bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white px-3 md:px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm md:text-base"
            >
              {generatingExcel ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <FaFileExcel className="text-lg" />
              )}
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={generatingPdf}
              className="flex items-center gap-2 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white px-3 md:px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm md:text-base"
            >
              {generatingPdf ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <FaDownload className="text-lg" />
              )}
            </button>
            <button
              onClick={() => handleGeneratePDF(false)}
              disabled={generatingPdf}
              className="flex items-center gap-2 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white px-3 md:px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm md:text-base"
            >
              {generatingPdf ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <FaFilePdf className="text-lg" />
              )}
            </button>
          </div>
        </div>

        {/* Company Header */}
        <div className="text-center mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors duration-300">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-full overflow-hidden">
            <Image
              src="/logo.png"
              alt="Company Logo"
              width={80}
              height={80}
              className="object-cover"
            />
          </div>
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-red-600 dark:text-red-500 mb-2">
            S&B Nice Nice Food Valley Ltd.
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            {section &&
              `${section.charAt(0).toUpperCase() + section.slice(1)} Section`}
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Monthly Consumption of {user?.current_period}
          </p>
        </div>

        {/* Report Sections */}
        <SummaryView summary={processData()} />
        <ProductView products={processData()?.products_data} />
        <RawMateView materials={processData()?.rm_data} />
        <PmMateView materials={processData()?.pm_data} />
      </div>
    </div>
  );
}
