import React from 'react';

export default function Loading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 md:py-12 animate-pulse">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="w-full lg:w-3/5 space-y-4">
          <div className="aspect-square bg-gray-200 rounded-2xl w-full"></div>
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-xl"></div>
            <div className="w-20 h-20 bg-gray-200 rounded-xl"></div>
            <div className="w-20 h-20 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-6">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3 pt-6 border-t border-gray-100">
            <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
            <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}