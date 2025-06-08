'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Metadata } from 'next';

export default function FreePage() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到主页，但保留SEO价值
    router.replace('/?utm_source=free_page&utm_medium=seo&utm_campaign=ghibli_filter_free');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F4E4BC] to-[#E8D5B7]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#2C3E50] mb-4">
          Free Ghibli Filter - No Sign Up Required
        </h1>
        <p className="text-xl text-[#34495E] mb-6">
          Transform your photos with our free Studio Ghibli filter
        </p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C4A484] mx-auto"></div>
        <p className="text-sm text-[#34495E] mt-4">Redirecting to the free Ghibli filter...</p>
      </div>
    </div>
  );
} 