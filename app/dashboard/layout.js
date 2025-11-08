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
} from "react-icons/fa";
import { FiSettings } from "react-icons/fi";

// Navigation Item Component - Declared outside
const NavigationItem = ({ route, title, Icon, onClick }) => (
  <Link
    href={route}
    onClick={onClick}
    className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200 group border-b border-gray-100 last:border-b-0"
  >
    <Icon
      className="text-gray-500 group-hover:text-blue-600 transition-colors flex-shrink-0"
      size={16}
    />
    <span className="ml-3 font-medium">{title}</span>
  </Link>
);

// Mobile Sidebar Component - Declared outside
const MobileSidebar = ({ 
  mobileMenuOpen, 
  closeMobileMenu, 
  user, 
  routes, 
  handleLogout 
}) => (
  <>
    {/* Backdrop */}
    {mobileMenuOpen && (
      <div 
        className="fixed inset-0 bg-gray-500/50 bg-opacity-50 z-40 lg:hidden"
        onClick={closeMobileMenu}
      />
    )}
    
    {/* Sidebar */}
    <div className={`
      fixed top-0 left-0 h-full bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out
      ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      w-80 lg:hidden
    `}>
      {/* Mobile Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white">
        <div>
          <h2 className="text-xl font-bold">Admin Dashboard</h2>
          <p className="text-blue-100 text-sm">Welcome, {user?.name || user?.username}</p>
        </div>
        <button
          onClick={closeMobileMenu}
          className="p-2 rounded-md hover:bg-blue-700 transition"
        >
          <FaTimes size={20} />
        </button>
      </div>

      {/* Navigation Items */}
      <div className="p-4 h-[calc(100%-80px)] overflow-y-auto">
        <nav className="space-y-1">
          {routes.map((route) => (
            <NavigationItem
              key={route.route}
              route={route.route}
              title={route.title}
              Icon={route.icon}
              onClick={closeMobileMenu}
            />
          ))}
        </nav>

        {/* Logout Button */}
        <div className="mt-8 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center"
          >
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  </>
);

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deviceType, setDeviceType] = useState("desktop");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check device type
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;

      if (width < 768) {
        setDeviceType("mobile");
        setSidebarOpen(false);
      } else if (width >= 768 && width < 1024) {
        setDeviceType("tablet");
        setSidebarOpen(true);
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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const routes = [
    {
      title: "Dashboard",
      route: "/dashboard",
      icon: FaHome,
    },
    {
      title: "Sections",
      route: "/dashboard/sections",
      icon: FiSettings,
    },
    {
      title: "Users",
      route: "/dashboard/users",
      icon: FaUsers,
    },
    {
      title: "Add Period",
      route: "/dashboard/add-period",
      icon: FaCalendarPlus,
    },
    {
      title: "Add Materials",
      route: "/dashboard/add-materials",
      icon: FaPlus,
    },
    {
      title: "Manage Materials",
      route: "/dashboard/manage-materials",
      icon: FaBoxes,
    },
    {
      title: "Manage Products",
      route: "/dashboard/manage-products",
      icon: FaBook,
    },
    {
      title: "Recipe Update",
      route: "/dashboard/recipe-update",
      icon: FaEdit,
    },
    {
      title: "Import Recipe",
      route: "/dashboard/import-recipe",
      icon: FaFileImport,
    },
    {
      title: "Export Code",
      route: "/dashboard/export-code",
      icon: FaFileExport,
    },
    {
      title: "Period Opening Copy",
      route: "/dashboard/period-opening-copy",
      icon: FaCopy,
    },
    {
      title: "User Area",
      route: "/dashboard/users-section",
      icon: FaCopy,
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 relative">
        {/* Navigation - Fixed at top */}
        <nav className="bg-white shadow-sm h-16 lg:h-[65px] fixed top-0 left-0 right-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex justify-between items-center h-full">
              {/* Left Section */}
              <div className="flex items-center space-x-4">
                {/* Mobile Menu Button */}
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-md hover:bg-gray-100 transition text-gray-600 lg:hidden"
                  title="Open Menu"
                >
                  <FaBars size={20} />
                </button>

                {/* Desktop Sidebar Toggle */}
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md hover:bg-gray-100 transition text-gray-600 hidden lg:block"
                  title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                >
                  {sidebarOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
                </button>

                <div className="flex flex-col">
                  <h1 className="text-lg lg:text-xl font-semibold text-gray-900">
                    Admin Dashboard
                    {deviceType === "tablet" && (
                      <span className="text-sm text-gray-500 ml-2">(Tablet)</span>
                    )}
                  </h1>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    System Administration Panel
                  </p>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 text-sm lg:text-base hidden sm:inline">
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

        {/* Mobile Sidebar */}
        <MobileSidebar 
          mobileMenuOpen={mobileMenuOpen}
          closeMobileMenu={closeMobileMenu}
          user={user}
          routes={routes}
          handleLogout={handleLogout}
        />

        {/* Main Content - Below navbar */}
        <main className="flex pt-16 lg:pt-[65px] h-screen">
          {/* Desktop/Tablet Sidebar */}
          <div
            className={`
              bg-white border-r border-gray-200 overflow-y-auto transition-all duration-300 ease-in-out 
              hidden lg:block
              ${sidebarOpen ? (deviceType === "tablet" ? "w-48" : "w-64") : "w-0"}
            `}
          >
            <div className={`p-4 ${sidebarOpen ? "block" : "hidden"}`}>
              {/* Device Indicator - শুধুমাত্র development এর জন্য */}
              {process.env.NODE_ENV === "development" && (
                <div className="mb-4 px-3 py-2 bg-blue-100 text-blue-700 text-xs rounded text-center">
                  {deviceType.toUpperCase()} MODE
                </div>
              )}

              <nav className="space-y-2">
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
            className={`
              flex-1 overflow-y-auto transition-all duration-300 ease-in-out
              ${sidebarOpen && deviceType !== "mobile" ? 
                (deviceType === "tablet" ? "lg:w-[calc(100%-12rem)]" : "lg:w-[calc(100%-16rem)]") : 
                "w-full"
              }
            `}
          >
            {/* Tablet optimization notice */}
            {deviceType === "tablet" && (
              <div className="bg-yellow-50 border-b border-yellow-200 p-3">
                <div className="flex items-center justify-center text-yellow-700 text-sm">
                  <span>Tablet View - Swipe or use menu button for navigation</span>
                </div>
              </div>
            )}

            {/* Mobile optimization notice */}
            {deviceType === "mobile" && (
              <div className="bg-blue-50 border-b border-blue-200 p-3">
                <div className="flex items-center justify-center text-blue-700 text-sm">
                  <span>Mobile View - Tap menu button for admin navigation</span>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}