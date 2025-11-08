"use client";

import CurrentPeriod from "@/components/CurrentPeriod";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  FaBook,
  FaBoxes,
  FaCalendarPlus,
  FaCopy,
  FaEdit,
  FaFileExport,
  FaFileImport,
  FaHome,
  FaPlus,
  FaUsers
} from "react-icons/fa";
import { FiSettings } from "react-icons/fi";

export default function Dashboard() {
  const { user, updateUserData } = useAuth();

  const routes = [
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

  const NavigationItem = ({ route, title, Icon }) => (
    <Link
      href={route}
      className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200 group border-b border-gray-100 last:border-b-0"
    >
      <Icon
        className="text-gray-500 group-hover:text-blue-600 transition-colors flex-shrink-0"
        size={16}
      />
      <span className="ml-3 font-medium">{title}</span>
    </Link>
  );

  return (
    <div className="h-[calc(100vh-65px)]">
      <CurrentPeriod user={user} onUserUpdate={updateUserData} />
      <div className="pb-10">
        {routes.map((route) => (
          <NavigationItem
            key={route.route}
            route={route.route}
            title={route.title}
            Icon={route.icon}
          />
        ))}
      </div>
    </div>
  );
}
