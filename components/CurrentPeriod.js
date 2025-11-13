"use client";
import { doc, updateDoc } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { db } from '@/utils/firebaseConfig';

export default function CurrentPeriod({ user, onUserUpdate }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get current month and year
  const currentDate = useMemo(() => new Date(), []);
  const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
  const currentYear = currentDate.getFullYear().toString();
  const currentPeriod = `${currentMonth}, ${currentYear}`;

  // Check if user's current period matches actual current period
  const isPeriodMismatched = useMemo(() => {
    if (!user?.current_period) return true;
    return user.current_period !== currentPeriod;
  }, [user?.current_period, currentPeriod]);

  const handlePeriodSelect = async (period) => {
    if (period === user.current_period) {
      setModalVisible(false);
      return;
    }

    setLoading(true);
    try {
      // Update Firestore
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        current_period: period
      });

      // Update local state
      const updatedUser = {
        ...user,
        current_period: period
      };
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update parent component state via callback
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
      
      setModalVisible(false);
      alert('Success: Period updated successfully');
    } catch (error) {
      console.error('Error updating period:', error);
      alert('Error: Failed to update period');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Warning Message */}
      {isPeriodMismatched && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 rounded mb-4 transition-colors duration-300">
          <div className="flex">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                Warning: Current period doesn&apos;t match actual month and year
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                Selected: {user?.current_period} | Actual: {currentPeriod}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg mb-4 transition-colors duration-300">
        {/* Current Period Button */}
        <button 
          onClick={() => setModalVisible(true)}
          className="flex flex-col items-center hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded transition-colors duration-200"
        >
          <span className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase">Current Period</span>
          <span className={`text-sm font-semibold italic ${
            isPeriodMismatched 
              ? 'text-red-600 dark:text-red-400 underline' 
              : 'text-blue-600 dark:text-blue-400'
          }`}>
            {user?.current_period}
          </span>
          {isPeriodMismatched && (
            <span className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
              Should be: {currentPeriod}
            </span>
          )}
        </button>
        
        {/* Current Date Display */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase">Current Date</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {currentDate.toDateString()}
          </span>
        </div>
      </div>

      {/* Period Selection Modal */}
      {modalVisible && (
        <div className="fixed inset-0 bg-gray-500/50 dark:bg-gray-900/80 bg-opacity-50 flex items-center justify-center z-50 p-4 transition-colors duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md max-h-[70vh] flex flex-col transition-colors duration-300">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white text-center">Select Period</h2>
            </div>
            
            {/* Current Period Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-500 mx-4 mt-4 rounded transition-colors duration-300">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Actual Current Period: {currentPeriod}
              </p>
              {isPeriodMismatched && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 italic">
                  ⚠️ Your selected period doesn&apos;t match current period
                </p>
              )}
            </div>
            
            {/* Periods List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-300">Updating period...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {user?.periods?.map((item) => {
                    const isCurrentPeriod = item === currentPeriod;
                    const isSelected = item === user.current_period;
                    
                    return (
                      <button
                        key={item}
                        onClick={() => handlePeriodSelect(item)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors duration-200 ${
                          isSelected 
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700' 
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        } ${
                          isCurrentPeriod 
                            ? 'border-l-4 border-l-green-500 dark:border-l-green-400 bg-green-50 dark:bg-green-900/20' 
                            : ''
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`font-medium ${
                            isSelected 
                              ? 'text-blue-700 dark:text-blue-300' 
                              : isCurrentPeriod 
                                ? 'text-green-700 dark:text-green-300' 
                                : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {item}
                          </span>
                          <div className="flex flex-col items-end space-y-1">
                            {isCurrentPeriod && (
                              <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-800/30 px-2 py-1 rounded">
                                📅 Current
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800/30 px-2 py-1 rounded">
                                ✓ Selected
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setModalVisible(false)}
                className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}