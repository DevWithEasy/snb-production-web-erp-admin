"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  FaBars,
  FaBook,
  FaBoxes,
  FaCalendarPlus,
  FaCopy,
  FaEdit,
  FaFileExport,
  FaFileImport,
  FaHome,
  FaPlus,
  FaTimes,
  FaUsers,
  FaMobile,
  FaTablet,
} from "react-icons/fa";
import { FiSettings } from "react-icons/fi";

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deviceType, setDeviceType] = useState("desktop");

  // Check device type
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;

      if (width < 768) {
        setDeviceType("mobile");
        setSidebarOpen(false);
      } else if (width >= 768 && width < 1024) {
        setDeviceType("tablet");
        setSidebarOpen(true); // Tablet এ sidebar open রাখি
      } else {
        setDeviceType("desktop");
        setSidebarOpen(true);
      }
    };

    // Initial check
    checkDevice();

    // Add resize listener
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const routes = [
    {
      title: "Dashboard",
      route: "/dashboard",
      icon: FaHome,
    },
    {
      title: "Recipes",
      route: "/user-area/recipes",
      icon: FaBook,
    },
    {
      title: "Daily Consumption",
      route: "/user-area/daily-consumption",
      icon: FaBook,
    },
  ];

  // Memoized navigation items to prevent unnecessary re-renders
  const NavigationItem = ({ route, title, Icon }) => (
    <Link
      href={route}
      className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200 group"
    >
      <Icon
        className="text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0"
        size={16}
      />
      <span className="ml-3 text-sm font-medium truncate">{title}</span>
    </Link>
  );

  // Mobile restriction view - শুধুমাত্র mobile (768px এর নিচে) এর জন্য
  if (deviceType === "mobile") {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Mobile Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 p-4 rounded-full">
                <FaMobile className="text-red-600 text-4xl" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Desktop & Tablet Version Only
            </h1>

            {/* Message */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              This dashboard is optimized for desktop and tablet devices. Please
              use a computer, laptop, or tablet for the best experience.
            </p>

            {/* App Suggestion */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-3">
                <FaTablet className="text-blue-600 text-xl mr-2" />
                <h3 className="text-lg font-semibold text-blue-800">
                  Mobile App Available
                </h3>
              </div>
              <p className="text-blue-700 text-sm">
                For mobile access, please use our dedicated mobile application
                which is specially designed for smaller screens.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium"
              >
                Log Out
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Retry Anyway
              </button>
            </div>

            {/* Technical Info */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Screen width:{" "}
                {typeof window !== "undefined" ? window.innerWidth : 0}px
                <br />
                Device: {deviceType}
                <br />
                Minimum required: Tablet (768px+)
              </p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Tablet and Desktop view
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 relative">
        {/* Navigation - Fixed at top */}
        <nav className="bg-white shadow-sm h-[65px] fixed top-0 left-0 right-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex justify-between items-center h-full">
              <div className="flex items-center space-x-4">
                {/* Sidebar Toggle Button - Tablet এও দেখাবে */}
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md hover:bg-gray-100 transition text-gray-600"
                  title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                >
                  {sidebarOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
                </button>
                <h1 className="text-xl font-semibold text-gray-900">
                  Dashboard {deviceType === "tablet" && "(Tablet)"}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 hidden sm:inline">
                  Welcome, {user?.name || user?.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition text-sm whitespace-nowrap"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content - Below navbar */}
        <main className="flex pt-[65px] h-screen">
          {/* Sidebar - Tablet এ compact version */}
          <div
            className={`bg-white border-r border-gray-200 overflow-y-auto transition-all duration-300 ease-in-out [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-scrollbar]:hidden ${
              sidebarOpen ? (deviceType === "tablet" ? "w-48" : "w-64") : "w-0"
            }`}
          >
            <div className={`p-3 ${sidebarOpen ? "block" : "hidden"}`}>
              {/* Device Indicator - শুধুমাত্র development এর জন্য */}
              {process.env.NODE_ENV === "development" && (
                <div className="mb-3 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded text-center">
                  {deviceType.toUpperCase()}
                </div>
              )}

              <nav className="space-y-1">
                {routes.map((route) => (
                  <NavigationItem
                    key={route.route}
                    route={route.route}
                    title={route.title}
                    Icon={route.icon}
                  />
                ))}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div
            className={`overflow-y-auto transition-all duration-300 ease-in-out ${
              sidebarOpen
                ? deviceType === "tablet"
                  ? "w-[calc(100%-12rem)]"
                  : "w-[calc(100%-16rem)]"
                : "w-full"
            }`}
          >
            {/* Tablet optimization notice */}
            {deviceType === "tablet" && (
              <div className="bg-yellow-50 border-b border-yellow-200 p-2">
                <div className="flex items-center justify-center text-yellow-700 text-sm">
                  <FaTablet className="mr-2" />
                  <span>Tablet View - For best experience use desktop</span>
                </div>
              </div>
            )}

            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
