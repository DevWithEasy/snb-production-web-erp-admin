"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useState } from "react";
import { FaBars, FaHome, FaTimes } from "react-icons/fa";
import { FiBook } from "react-icons/fi";
import { MdImportExport } from "react-icons/md";

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 relative">
        {/* Navigation - Fixed at top */}
        <nav className="bg-white shadow-sm h-[65px] fixed top-0 left-0 right-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex justify-between items-center h-full">
              <div className="flex items-center space-x-4">
                {/* Sidebar Toggle Button */}
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md hover:bg-gray-100 transition text-gray-600"
                  title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                >
                  {sidebarOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
                </button>
                <h1 className="text-xl font-semibold text-gray-900">
                  Dashboard
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  Welcome, {user?.name || user?.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition text-sm"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content - Below navbar */}
        <main className="flex pt-[65px] h-screen">
          {/* Sidebar */}
          <div
            className={`bg-white border-r border-gray-200 overflow-y-auto transition-all duration-300 ease-in-out ${
              sidebarOpen ? "w-64" : "w-0"
            }`}
          >
            <div className={`p-4 ${sidebarOpen ? "block" : "hidden"}`}>
              <nav className="space-y-2">
                <Link
                  href="/dashboard"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200 group"
                >
                  <FaHome className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                  <span className="ml-3 font-medium">Dashboard</span>
                </Link>
                <Link
                  href="/dashboard/recipe-update"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200 group"
                >
                  <FiBook className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                  <span className="ml-3 font-medium">Recipe Update</span>
                </Link>
                <Link
                  href="/dashboard/import-recipe"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200 group"
                >
                  <MdImportExport className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                  <span className="ml-3 font-medium">Import Recipe</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div
            className={`overflow-y-auto transition-all duration-300 ease-in-out ${
              sidebarOpen ? "w-[calc(100%-16rem)]" : "w-full"
            }`}
          >
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}