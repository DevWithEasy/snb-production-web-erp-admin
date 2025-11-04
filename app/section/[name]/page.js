"use client";

import CurrentPeriod from "@/components/CurrentPeriod";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

export default function Dashboard() {
  const { user, updateUserData } = useAuth();

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col justify-center items-center">
      <Image src="/logo.png" alt="icon" width={100} height={100} />
      <CurrentPeriod user={user} onUserUpdate={updateUserData} />
    </div>
  );
}
