"use client";

import React, { useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

export default function Dashboard() {
  return (
    <div className="h-[calc(100vh-65px)] flex justify-center items-center">
      <Image src="/logo.png" alt="icon" width={100} height={100} />
    </div>
  );
}
