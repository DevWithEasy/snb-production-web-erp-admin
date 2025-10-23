'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // ইউজার লগইন থাকলে ড্যাশবোর্ডে রিডাইরেক্ট
        const timer = setTimeout(() => {
          router.push('/dashboard');
        }, 3000);

        return () => {
          clearTimeout(timer);
        };
      } else {
        // ইউজার লগইন না থাকলে লগইন পেজে রিডাইরেক্ট
        const timer = setTimeout(() => {
          router.push('/auth');
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
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        
        {/* Hero Section */}
        <div className="flex flex-col justify-center items-center">
          {/* App Logo/Icon */}
          <Image src='/logo.png' alt='icon' width={100} height={100}/>

          {/* Welcome Message */}
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 mt-10">
            S&B Production ERP
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
            Developed By - Robi App Lab
          </p>
        </div>
      </div>
    </div>
  );
}