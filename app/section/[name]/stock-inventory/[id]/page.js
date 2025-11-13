'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/utils/firebaseConfig';
import formatNumber from '@/utils/formatNumber';
import getPeriodPath from '@/utils/getPeriodPath';
import getRMPMTotal from '@/utils/getRMPMTotal';
import { FaArrowLeft, FaEdit, FaCalculator, FaBox } from 'react-icons/fa';

export default function MaterialsDetails() {
  const { user } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  
  // Get the type from searchParams instead of router.query
  const type = searchParams.get('type');
  const { id, name } = params;
  const section = name;
  
  const [itemData, setItemData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [receivedQty, setReceivedQty] = useState("");
  const [consumptionQty, setConsumptionQty] = useState("");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(false);
  const [expression, setExpression] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const periodId = getPeriodPath(user?.current_period);
  const period_collection_name = `${section}_${type}_period_${periodId}`;
  
  console.log(period_collection_name)

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  async function getItem() {
    setLoading(true);
    try {
      const itemRef = doc(db, period_collection_name, id);
      const updatedDoc = await getDoc(itemRef);
      if (updatedDoc.exists()) {
        const updatedData = updatedDoc.data();
        setItemData({ id: updatedDoc.id, ...updatedData });
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      alert("Something Error: Item Not Found");
    }
  }

  useEffect(() => {
    if (id && type) { // Also check if type is available
      getItem();
    }
  }, [id, type, user?.current_period]); // Add type to dependencies

  const total_received = getRMPMTotal(
    itemData?.received_days || itemData?.recieved_days || []
  );
  const total_consumption = getRMPMTotal(itemData?.consumption_days || []);
  const Stock =
    (Number(itemData?.opening) || 0) + total_received - total_consumption;
  const adjustment = Stock - Number(itemData?.closing || 0);

  // received_days এবং consumption_days একত্রিত করে তারিখ অনুসারে সাজানো
  const allDates = [
    ...new Set([
      ...(itemData?.received_days || itemData?.recieved_days || []).map(
        (d) => d.date
      ),
      ...(itemData?.consumption_days || []).map((d) => d.date),
    ]),
  ].sort((a, b) => a - b);

  // Double click handler for desktop, single tap for mobile
  let lastTap = null;
  const handleDateClick = (date) => {
    if (isMobile) {
      // Single tap for mobile
      openEditModal(date);
    } else {
      // Double click for desktop
      const now = Date.now();
      const DOUBLE_CLICK_DELAY = 300;

      if (lastTap && now - lastTap < DOUBLE_CLICK_DELAY) {
        openEditModal(date);
      } else {
        lastTap = now;
      }
    }
  };

  // Open edit modal function
  const openEditModal = (date) => {
    const receivedDay = (
      itemData?.received_days ||
      itemData?.recieved_days ||
      []
    ).find((d) => d.date === date);

    const consumptionDay = (itemData?.consumption_days || []).find(
      (d) => d.date === date
    );

    setSelectedDate(date);
    setReceivedQty(receivedDay ? receivedDay.qty.toString() : "0");
    setConsumptionQty(consumptionDay ? consumptionDay.qty.toString() : "0");
    setModalVisible(true);
  };

  // Update Firestore data function
  const updateFirestoreData = async () => {
    if (!selectedDate) return;
    if (error) return;

    setUpdating(true);
    try {
      const itemRef = doc(db, period_collection_name, itemData?.id);

      // Current data
      const currentReceivedDays = itemData?.recieved_days || [];
      const currentConsumptionDays = itemData?.consumption_days || [];

      // Update data
      const updatedReceivedDays = currentReceivedDays.map((day) =>
        day.date !== selectedDate ? day : { ...day, qty: receivedQty || 0 }
      );
      
      let consumptionValue = consumptionQty;
      if (consumptionQty && !isNaN(eval(consumptionQty))) {
        consumptionValue = eval(consumptionQty).toFixed(2);
      }

      const updatedConsumptionDays = currentConsumptionDays.map((day) =>
        day.date !== selectedDate
          ? day
          : { ...day, qty: consumptionValue || 0 }
      );

      // Update to Firestore
      await updateDoc(itemRef, {
        recieved_days: updatedReceivedDays,
        consumption_days: updatedConsumptionDays,
      });

      const updatedDoc = await getDoc(itemRef);
      if (updatedDoc.exists()) {
        const updatedData = updatedDoc.data();
        setItemData({ id: updatedDoc.id, ...updatedData });
      }

      setModalVisible(false);
      setExpression('');
    } catch (error) {
      console.error("Error updating data:", error);
      alert("Error: Failed to update data. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  // Handle consumption quantity change
  const handleConsumptionChange = (value) => {
    try {
      if (value && !value.endsWith('.')) {
        const result = eval(value);
        setError(false);
        setExpression(`${value} = ${result.toFixed(2)}`);
      } else {
        setExpression('');
      }
    } catch (error) {
      setError(true);
      setExpression('');
    }
    setConsumptionQty(value);
  };

  // Add loading state for when type is not available yet
  if (!type) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-center">Loading parameters...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-center">Loading material details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto sm:p-4 lg:p-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <FaBox className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white break-words">
                    {itemData?.name || "Material Details"}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    {type?.toUpperCase()} • Section: {section}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Mobile Instructions */}
            {isMobile && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-blue-700 dark:text-blue-300 text-sm flex items-center">
                  <FaEdit className="mr-2" />
                  Tap on any date to edit values
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 transition-colors duration-300">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 sm:pb-3">
            Summary
          </h2>
          
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base">Opening:</span>
              <span className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base">{itemData?.opening || 0}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base">Total Received:</span>
              <span className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base">{formatNumber(total_received)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base">Total Consumption:</span>
              <span className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base">{formatNumber(total_consumption)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base">Floor Stock:</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold text-sm sm:text-base">{formatNumber(Stock)}</span>
            </div>

            {itemData?.closing !== null && (
              <div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base">Need Adjustment:</span>
                  <span 
                    className={`font-bold text-sm sm:text-base ${
                      adjustment > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    {formatNumber(adjustment)}
                  </span>
                </div>
                <p 
                  className={`mt-2 text-xs sm:text-sm italic ${
                    adjustment > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {adjustment > 0
                    ? `Add More ${Math.abs(adjustment).toFixed(2)} ${itemData?.unit} Consumption`
                    : `Reduce ${Math.abs(adjustment).toFixed(2)} ${itemData?.unit} Consumption`
                  } to adjust closing value of monthly closing
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Daily Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
              Daily Data
            </h2>
            {!isMobile && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 sm:mt-0">
                Double-click on any date to edit values
              </p>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-500 dark:bg-blue-600 text-white">
                  <th className="text-left p-2 sm:p-3 font-semibold text-sm sm:text-base">Date</th>
                  <th className="text-center p-2 sm:p-3 font-semibold text-sm sm:text-base">In</th>
                  <th className="text-center p-2 sm:p-3 font-semibold text-sm sm:text-base">Out</th>
                </tr>
              </thead>
              <tbody>
                {allDates.map((date, index) => {
                  const receivedDay = (
                    itemData?.received_days ||
                    itemData?.recieved_days ||
                    []
                  ).find((d) => d.date === date);
                  const consumptionDay = (itemData?.consumption_days || []).find(
                    (d) => d.date === date
                  );

                  return (
                    <tr 
                      key={date}
                      className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer active:bg-blue-50 dark:active:bg-blue-900/20 transition-colors ${
                        index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-800'
                      }`}
                      onClick={() => handleDateClick(date)}
                    >
                      <td className="p-2 sm:p-3 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                        <div className="flex items-center space-x-2">
                          <span>Date {date}</span>
                          {isMobile && (
                            <FaEdit className="text-blue-500 dark:text-blue-400 text-xs opacity-0 group-hover:opacity-100" />
                          )}
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 text-center text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                        {receivedDay ? receivedDay.qty : 0}
                      </td>
                      <td className="p-2 sm:p-3 text-center text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                        {consumptionDay ? consumptionDay.qty : 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {allDates.length === 0 && (
            <div className="text-center py-6 sm:py-8">
              <FaBox className="text-gray-300 dark:text-gray-600 text-3xl sm:text-4xl mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">No daily data available</p>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {modalVisible && (
          <div className="fixed inset-0 bg-gray-500/50 dark:bg-gray-900/80 bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto transition-colors duration-300">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 dark:text-white text-center">
                Edit Data for Date {selectedDate}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center text-sm mb-4">
                Period: {user?.current_period}
              </p>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                    Received Quantity:
                  </label>
                  <input
                    type="text"
                    value={receivedQty}
                    onChange={(e) => setReceivedQty(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                    placeholder="Enter received quantity"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                    Consumption Quantity:
                  </label>
                  <input
                    type="text"
                    value={consumptionQty}
                    onChange={(e) => handleConsumptionChange(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 ${
                      error 
                        ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-transparent' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-transparent'
                    }`}
                    placeholder="Enter consumption or expression"
                  />
                  {expression && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1 sm:mt-2 flex items-center">
                      <FaCalculator className="mr-1" />
                      {expression}
                    </p>
                  )}
                  {error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 sm:mt-2">Invalid expression</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    You can use expressions like: 10+5*2
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 sm:mt-6 gap-2">
                <button
                  onClick={() => {
                    setModalVisible(false);
                    setExpression("");
                  }}
                  disabled={updating}
                  className="px-3 sm:px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 transition-colors text-sm sm:text-base flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={updateFirestoreData}
                  disabled={updating || error}
                  className="px-4 sm:px-6 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base flex-1 flex items-center justify-center"
                >
                  {updating ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                      Updating...
                    </span>
                  ) : (
                    'Update'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Floating Action Button */}
        {isMobile && allDates.length > 0 && (
          <div className="fixed bottom-6 right-6 z-40">
            <div className="bg-blue-600 dark:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors duration-300">
              <FaEdit size={20} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}