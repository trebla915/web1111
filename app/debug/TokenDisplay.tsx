"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { FiRefreshCw, FiTrash2, FiCheck, FiX, FiSmartphone } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface Token {
  token: string;
  createdAt: any;
  lastUsed?: any;
  deviceInfo?: {
    model?: string;
    os?: string;
    appVersion?: string;
  };
}

export default function TokenDisplay() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [testToken, setTestToken] = useState('');
  const [testingToken, setTestingToken] = useState(false);

  const fetchTokens = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/debug/user-tokens?userId=${user.uid}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tokens');
      }
      
      const data = await response.json();
      if (data.success && data.tokens) {
        setTokens(data.tokens);
      } else {
        setTokens([]);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
      toast.error('Failed to load push tokens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTokens();
    }
  }, [user]);

  const handleDeleteToken = async (token: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this token?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/debug/delete-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete token');
      }
      
      // Remove the token from the list
      setTokens(tokens.filter(t => t.token !== token));
      toast.success('Token deleted successfully');
    } catch (error) {
      console.error('Error deleting token:', error);
      toast.error('Failed to delete token');
    }
  };

  const handleTestToken = async () => {
    if (!testToken.trim()) {
      toast.error('Please enter a token to test');
      return;
    }
    
    try {
      setTestingToken(true);
      const response = await fetch('/api/notifications/test-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: testToken }),
      });
      
      if (!response.ok) {
        throw new Error('Token test failed');
      }
      
      const data = await response.json();
      if (data.success) {
        if (data.valid) {
          toast.success('Token is valid');
        } else {
          toast.error('Token appears to be invalid');
        }
      } else {
        toast.error(data.error || 'Token test failed');
      }
    } catch (error) {
      console.error('Error testing token:', error);
      toast.error('Failed to test token');
    } finally {
      setTestingToken(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold flex items-center">
          <FiSmartphone className="mr-2" />
          Push Notification Tokens
        </h3>
        <button
          onClick={fetchTokens}
          disabled={loading}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm disabled:opacity-50"
        >
          <FiRefreshCw className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      {/* Token Test Section */}
      <div className="mb-6 p-4 bg-gray-700 rounded-lg">
        <h4 className="text-md font-medium mb-3">Test Push Token</h4>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={testToken}
            onChange={(e) => setTestToken(e.target.value)}
            placeholder="Enter push token to test"
            className="flex-1 p-2 bg-gray-900 rounded-lg text-white border border-gray-600"
          />
          <button
            onClick={handleTestToken}
            disabled={testingToken || !testToken.trim()}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50 flex items-center"
          >
            {testingToken ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Testing...
              </span>
            ) : (
              <>Test Token</>
            )}
          </button>
        </div>
      </div>
      
      {/* Tokens List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          No push tokens found for this user. Tokens are registered when a user enables push notifications on their device.
        </div>
      ) : (
        <div className="space-y-4">
          {tokens.map((token, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="max-w-lg overflow-hidden">
                  <div className="font-mono text-xs text-gray-300 break-all mb-2">
                    {token.token.substring(0, 20)}...{token.token.substring(token.token.length - 10)}
                  </div>
                  <div className="flex flex-wrap gap-y-1 gap-x-4 text-xs text-gray-400">
                    <span>Created: {formatDate(token.createdAt)}</span>
                    {token.lastUsed && <span>Last Used: {formatDate(token.lastUsed)}</span>}
                    {token.deviceInfo?.model && (
                      <span>Device: {token.deviceInfo.model} ({token.deviceInfo.os || 'Unknown OS'})</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteToken(token.token)}
                  className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-full"
                  title="Delete Token"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 