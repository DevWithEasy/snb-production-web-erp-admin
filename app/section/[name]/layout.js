"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  FaBars, 
  FaTimes, 
  FaBox, 
  FaBook, 
  FaDoorOpen, 
  FaDoorClosed, 
  FaTruck, 
  FaIndustry, 
  FaSync, 
  FaFileAlt, 
  FaChartBar,
  FaClipboardList
} from "react-icons/fa";

export default function DashboardLayout({ children }) {
  const params = useParams();
  const { name } = params;
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-close sidebar on mobile by default
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when clicking on overlay (mobile)
  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const routes = [
    { title: "Materials", route: `/section/${name}/materials`, icon: FaBox },
    { title: "Recipes", route: `/section/${name}/recipes`, icon: FaBook },
    { title: "Opening Stock", route: `/section/${name}/opening`, icon: FaDoorOpen },
    { title: "Closing Stock", route: `/section/${name}/closing`, icon: FaDoorClosed },
    { title: "Received", route: `/section/${name}/recieved`, icon: FaTruck },
    { title: "Floor Consumption", route: `/section/${name}/consumption`, icon: FaIndustry },
    { title: "Consumption Update", route: `/section/${name}/consumption-update`, icon: FaSync },
    { title: "Production DC", route: `/section/${name}/production-dc`, icon: FaClipboardList },
    { title: "Daily Consumption Report", route: `/section/${name}/daily-consumption`, icon: FaFileAlt },
    { title: "Monthly Report", route: `/section/${name}/monthly-report`, icon: FaChartBar },
  ];

  const NavigationItem = ({ route, title, Icon }) => (
    <Link
      href={route}
      onClick={closeSidebar}
      className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200 group"
    >
      <Icon
        className="text-gray-400 group-hover:text-blue-600 transition-colors shrink-0"
        size={18}
      />
      <span className="ml-3 text-sm font-medium truncate">{title}</span>
    </Link>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 relative">
        {/* Navigation - Fixed at top */}
        <nav className="bg-white shadow-sm h-[65px] fixed top-0 left-0 right-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex justify-between items-center h-full">
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md hover:bg-gray-100 transition text-gray-600"
                  title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                >
                  {sidebarOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
                </button>
                <h1 className="text-lg md:text-xl font-semibold text-gray-900 truncate">
                  Dashboard
                </h1>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-gray-700 text-sm md:text-base hidden sm:inline truncate max-w-[120px] md:max-w-none">
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

        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-gray-500/50 bg-opacity-50 z-40"
            onClick={closeSidebar}
          />
        )}

        {/* Main Content - Below navbar */}
        <main className="flex pt-[65px] h-screen">
          {/* Sidebar */}
          <div
            className={`bg-white border-r border-gray-200 overflow-y-auto transition-all duration-300 ease-in-out fixed md:relative z-50 h-full ${
              sidebarOpen 
                ? isMobile 
                  ? "w-64 translate-x-0" 
                  : "w-64" 
                : isMobile 
                  ? "w-64 -translate-x-full" 
                  : "w-0"
            }`}
          >
            <div className={`p-4 ${sidebarOpen ? "block" : "hidden"}`}>
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
            className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${
              sidebarOpen && !isMobile ? "md:ml-0" : "ml-0"
            }`}
          >
            <div className="p-4 md:p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}