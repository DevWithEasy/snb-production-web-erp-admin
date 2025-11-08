"use client";

import { useAuth } from "@/hooks/useAuth";
import Firebase from "@/utils/firebase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  async function saveUpdateUser(id){
     const docRef = await Firebase.getDocument('users', id)
     const userInfo = {id : docRef.id,...docRef.data()}
     localStorage.setItem('user', JSON.stringify(userInfo));
  }

  useEffect(() => {
    if (!loading) {
      if (user) {
        // ইউজার লগইন থাকলে ড্যাশবোর্ডে রিডাইরেক্ট
        saveUpdateUser(user.id)
        const timer = setTimeout(() => {
          router.push(user.role === "admin" ? "/dashboard" : `/section/${user.section}`);
        }, 3000);
        return () => {
          clearTimeout(timer);
        };
      } else {
        // ইউজার লগইন না থাকলে লগইন পেজে রিডাইরেক্ট
        const timer = setTimeout(() => {
          router.push("/auth");
        }, 3000);

        return () => {
          clearTimeout(timer);
        };
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center p-4">
      {/* Mobile App Splash Screen Container */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-screen">
        
        {/* Main Content - Centered like mobile app */}
        <div className="flex flex-col items-center justify-center flex-1 w-full px-6">
          {/* App Logo/Icon - Larger on mobile */}
          <div className="mb-8 transform transition-transform duration-300 hover:scale-105">
            <Image 
              src="/logo.png" 
              alt="S&B Production ERP" 
              width={100} 
              height={100} 
              className="w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32"
              priority
            />
          </div>

          {/* App Name */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 text-center">
            S&B Production ERP
          </h1>

          {/* Developer Info */}
          <p className="text-lg md:text-xl text-gray-600 mb-12 text-center">
            Developed By - Robi App Lab
          </p>
        </div>

        {/* Loading Indicator - Bottom positioned like mobile apps */}
        <div className="w-full px-6 pb-8">
          <div className="flex justify-center items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-center text-gray-500 text-sm mt-3">
            Loading...
          </p>
        </div>
      </div>

      {/* Mobile-specific styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .min-h-screen {
            min-height: 100vh;
            min-height: 100dvh; /* For mobile browsers */
          }
        }
        
        /* Prevent zoom on mobile */
        @media (max-width: 768px) {
          input, select, textarea {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}