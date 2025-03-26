"use client";

import React, { useState, useEffect } from 'react';
import { FiCookie, FiRefreshCw } from 'react-icons/fi';

export default function CookiesSection() {
  const [cookies, setCookies] = useState<Record<string, string>>({});
  
  const getCookies = () => {
    const cookieString = document.cookie;
    const cookiePairs = cookieString.split(';');
    const cookies: Record<string, string> = {};
    
    for (const cookie of cookiePairs) {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        try {
          cookies[name] = decodeURIComponent(value);
        } catch (e) {
          cookies[name] = value;
        }
      }
    }
    
    return cookies;
  };
  
  useEffect(() => {
    setCookies(getCookies());
  }, []);
  
  const refreshCookies = () => {
    setCookies(getCookies());
  };
  
  const formatCookieValue = (name: string, value: string) => {
    // For sensitive cookies, truncate the value
    if (['userInfo', 'authToken'].includes(name)) {
      try {
        // Try to parse JSON for better display
        const parsedValue = JSON.parse(value);
        return JSON.stringify(parsedValue, null, 2).substring(0, 50) + '...';
      } catch (e) {
        // If not JSON, just truncate
        return value.substring(0, 20) + '...';
      }
    }
    
    // For other cookies, show the full value
    return value;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold flex items-center">
          <FiCookie className="mr-2" />
          Cookies
        </h3>
        <button
          onClick={refreshCookies}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
        >
          <FiRefreshCw className="mr-1" />
          Refresh
        </button>
      </div>
      
      {Object.keys(cookies).length > 0 ? (
        <div className="space-y-3">
          {Object.entries(cookies).map(([name, value]) => (
            <div key={name} className="bg-gray-700 p-3 rounded-lg">
              <div className="font-semibold text-blue-300 mb-1">{name}</div>
              <div className="text-gray-300 break-all font-mono text-sm">
                {formatCookieValue(name, value)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400">
          No cookies found in this browser session.
        </div>
      )}
    </div>
  );
} 