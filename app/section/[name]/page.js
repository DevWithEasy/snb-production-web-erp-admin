"use client";

import CurrentPeriod from "@/components/CurrentPeriod";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FaBook,
  FaBox,
  FaChartBar,
  FaClipboardList,
  FaDoorClosed,
  FaDoorOpen,
  FaFileAlt,
  FaIndustry,
  FaSync,
  FaTruck,
} from "react-icons/fa";

export default function Dashboard() {
  const { user, updateUserData } = useAuth();
  const params = useParams();
  const { name } = params;
  const routes = [
    {
      title: "Materials",
      route: `/section/${name}/materials`,
      icon: FaBox,
    },
    {
      title: "Recipes",
      route: `/section/${name}/recipes`,
      icon: FaBook,
    },
    {
      title: "Opening Stock",
      route: `/section/${name}/opening`,
      icon: FaDoorOpen,
    },
    {
      title: "Closing Stock",
      route: `/section/${name}/closing`,
      icon: FaDoorClosed,
    },
    {
      title: "Received",
      route: `/section/${name}/recieved`,
      icon: FaTruck,
    },
    {
      title: "Floor Consumption",
      route: `/section/${name}/consumption`,
      icon: FaIndustry,
    },
    {
      title: "Consumption Update",
      route: `/section/${name}/consumption-update`,
      icon: FaSync,
    },
    {
      title: "Production DC",
      route: `/section/${name}/production-dc`,
      icon: FaClipboardList,
    },
    {
      title: "Stock Inventory",
      route: `/section/${name}/stock-inventory`,
      icon: FaFileAlt,
    },
    {
      title: "Daily Consumption Report",
      route: `/section/${name}/daily-consumption`,
      icon: FaFileAlt,
    },
    {
      title: "Monthly Report",
      route: `/section/${name}/monthly-report`,
      icon: FaChartBar,
    },
  ];

  const NavigationItem = ({ route, title, Icon }) => (
    <Link
      href={route}
      className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all duration-200 group border-b border-gray-100 dark:border-gray-700 last:border-b-0"
    >
      <Icon
        className="text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0"
        size={16}
      />
      <span className="ml-3 font-medium">{title}</span>
    </Link>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors duration-300 overflow-auto">
      <div className="p-6">
        <CurrentPeriod user={user} onUserUpdate={updateUserData} />
        <div className="pb-10 mt-6">
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
    </div>
  );
}