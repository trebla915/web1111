"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { sendPushNotification, getNotificationHistory, sendPushNotificationToUsers } from "@/lib/services/notifications";
import { FiSend, FiUsers, FiClock, FiInfo, FiCheckCircle, FiX, FiBell, FiAlertTriangle, FiRefreshCw } from "react-icons/fi";

interface NotificationHistoryItem {
  id: string;
  title: string;
  message: string;
  status: string;
  sentAt: any;
  targetedUsers?: string[];
}

export default function PushNotificationsTab() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [targetSpecificUsers, setTargetSpecificUsers] = useState(false);
  const [targetUserIds, setTargetUserIds] = useState("");
  const [additionalData, setAdditionalData] = useState("");
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch notification history on load or when showHistory changes
  useEffect(() => {
    if (showHistory) {
      loadNotificationHistory();
    }
  }, [showHistory]);

  const loadNotificationHistory = async () => {
    try {
      setHistoryLoading(true);
      const history = await getNotificationHistory(15);
      setNotificationHistory(history);
    } catch (error) {
      console.error("Error loading notification history:", error);
      toast.error("Failed to load notification history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!title || !message) {
      toast.error("Both title and message are required.");
      return;
    }

    try {
      setLoading(true);
      
      // Create notification payload
      const notificationPayload: any = {
        title,
        message
      };
      
      // Parse additional data if provided
      if (additionalData.trim()) {
        try {
          const parsedData = JSON.parse(additionalData);
          if (Object.keys(parsedData).length > 0) {
            notificationPayload.data = parsedData;
          }
        } catch (error) {
          toast.error("Invalid JSON in additional data field");
          setLoading(false);
          return;
        }
      }
      
      let response;
      
      // Check if targeting specific users
      if (targetSpecificUsers) {
        if (!targetUserIds.trim()) {
          toast.error("Please enter at least one user ID");
          setLoading(false);
          return;
        }
        
        // Split user IDs by comma, trim whitespace, and filter out empty strings
        const userIds = targetUserIds
          .split(',')
          .map(id => id.trim())
          .filter(id => id.length > 0);
        
        if (userIds.length === 0) {
          toast.error("Please enter valid user IDs");
          setLoading(false);
          return;
        }
        
        try {
          response = await sendPushNotificationToUsers(userIds, notificationPayload);
          toast.success(`Push notification sent to ${userIds.length} users!`);
        } catch (error: any) {
          console.error("Error sending targeted notification:", error);
          if (error.message && error.message.includes("API error")) {
            toast.error(error.message);
          } else {
            toast.error(`Failed to send notification to users: ${error.message || 'Unknown error'}`);
          }
          setLoading(false);
          return;
        }
      } else {
        // Send to all users
        try {
          response = await sendPushNotification(notificationPayload);
          toast.success("Push notification sent to all users!");
        } catch (error: any) {
          console.error("Error sending global notification:", error);
          if (error.message && error.message.includes("API error")) {
            toast.error(error.message);
          } else {
            toast.error(`Failed to send notification: ${error.message || 'Unknown error'}`);
          }
          setLoading(false);
          return;
        }
      }
      
      // Clear form
      setTitle("");
      setMessage("");
      setAdditionalData("");
      setTargetUserIds("");
      
      // Refresh history if it's visible
      if (showHistory) {
        loadNotificationHistory();
      }
    } catch (error: any) {
      console.error("Error in notification process:", error);
      toast.error(`Notification error: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-cyan-300 digital-glow-soft">Send Push Notification</h2>
      
      <div className="max-w-3xl mx-auto bg-zinc-900 border border-cyan-900/30 p-6 rounded-lg mb-8 relative">
        <div className="absolute inset-0 noise opacity-5 rounded-lg"></div>
        <div className="relative z-10">
          <div className="mb-4">
            <label htmlFor="notificationTitle" className="block text-sm font-medium mb-2 text-cyan-200">
              Notification Title <span className="text-cyan-500">*</span>
            </label>
            <div className="relative">
              <input
                id="notificationTitle"
                type="text"
                className="w-full p-3 bg-zinc-800/80 rounded-lg text-white border border-cyan-900/50 focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                placeholder="Enter notification title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="absolute inset-0 pointer-events-none rounded-lg"></div>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="notificationMessage" className="block text-sm font-medium mb-2 text-cyan-200">
              Notification Message <span className="text-cyan-500">*</span>
            </label>
            <div className="relative">
              <textarea
                id="notificationMessage"
                rows={5}
                className="w-full p-3 bg-zinc-800/80 rounded-lg text-white border border-cyan-900/50 focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
                placeholder="Enter notification message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="absolute inset-0 pointer-events-none rounded-lg"></div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <input
                id="targetUsers"
                type="checkbox"
                className="mr-2 h-4 w-4 accent-cyan-500 bg-zinc-800 border border-cyan-900/50"
                checked={targetSpecificUsers}
                onChange={(e) => setTargetSpecificUsers(e.target.checked)}
              />
              <label htmlFor="targetUsers" className="text-sm font-medium text-cyan-200">
                Target specific users
              </label>
            </div>
            
            {targetSpecificUsers && (
              <div className="ml-6 mb-4 bg-cyan-900/10 p-3 rounded-lg border border-cyan-900/30">
                <label htmlFor="userIds" className="block text-sm font-medium mb-2 text-cyan-200">
                  User IDs (comma-separated)
                </label>
                <div className="relative">
                  <textarea
                    id="userIds"
                    rows={2}
                    className="w-full p-3 bg-zinc-800/80 rounded-lg text-white border border-cyan-900/50 focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
                    placeholder="user1, user2, user3"
                    value={targetUserIds}
                    onChange={(e) => setTargetUserIds(e.target.value)}
                  />
                  <div className="absolute inset-0 pointer-events-none rounded-lg"></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="additionalData" className="block text-sm font-medium mb-2 text-cyan-200">
              Additional Data (JSON - optional)
            </label>
            <div className="relative">
              <textarea
                id="additionalData"
                rows={3}
                className="w-full p-3 bg-zinc-800/80 rounded-lg text-white border border-cyan-900/50 focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none font-mono text-sm"
                placeholder={`{\n  "key": "value",\n  "actionType": "open_event",\n  "eventId": "abc123"\n}`}
                value={additionalData}
                onChange={(e) => setAdditionalData(e.target.value)}
              />
              <div className="absolute inset-0 pointer-events-none rounded-lg"></div>
            </div>
          </div>
          
          <button
            onClick={handleSendNotification}
            disabled={loading}
            className="w-full p-3 bg-gradient-to-r from-cyan-800 to-cyan-600 hover:from-cyan-700 hover:to-cyan-500 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border border-cyan-500/50 relative overflow-hidden group"
          >
            <div className="absolute inset-0 flex justify-center items-center bg-gradient-to-r from-cyan-600/0 via-cyan-600/30 to-cyan-600/0 opacity-0 group-hover:opacity-100 transform translate-y-full group-hover:translate-y-0 transition-all duration-500"></div>
            {loading ? (
              <span className="flex items-center justify-center relative z-10">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              <span className="relative z-10 flex items-center">
                <FiBell className="mr-2" />
                Send Notification
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Notification History Toggle */}
      <div className="max-w-3xl mx-auto">
        <button
          className="flex items-center text-lg font-medium mb-4 text-cyan-400 hover:text-cyan-300 transition-colors"
          onClick={() => setShowHistory(!showHistory)}
        >
          <FiClock className="mr-2" />
          {showHistory ? "Hide" : "Show"} Notification History
        </button>
        
        {/* Notification History Section */}
        {showHistory && (
          <div className="bg-zinc-900 border border-cyan-900/30 rounded-lg p-4 relative">
            <div className="absolute inset-0 noise opacity-5 rounded-lg"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-semibold mb-4 flex items-center text-cyan-300">
                <FiClock className="mr-2" />
                Recent Notifications
              </h3>
              
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-cyan-400">Loading history...</p>
                </div>
              ) : notificationHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <FiAlertTriangle size={64} className="text-cyan-900/50 mb-4" />
                  <p className="text-xl font-medium mb-6">No notifications sent yet</p>
                  <button
                    onClick={loadNotificationHistory}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-900/30 to-cyan-800/20 hover:from-cyan-800/30 hover:to-cyan-700/20 border border-cyan-600/30 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FiRefreshCw />
                    <span>Refresh</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {notificationHistory.map((notification) => (
                    <div key={notification.id} className="bg-zinc-800/80 p-5 rounded-lg border border-cyan-900/30 relative group hover:border-cyan-700/50 transition-all">
                      <div className="absolute inset-0 noise opacity-5 rounded-lg"></div>
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-semibold text-cyan-200">{notification.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs border ${
                            notification.status === 'sent' 
                              ? 'bg-green-900/40 text-green-400 border-green-500/50' 
                              : 'bg-yellow-900/40 text-yellow-400 border-yellow-500/50'
                          }`}>
                            {notification.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-3 pb-3 border-b border-cyan-900/20">{notification.message}</p>
                        <div className="text-sm text-gray-400">
                          <p className="flex items-center">
                            <FiClock className="mr-2 text-gray-500" /> 
                            Sent: {formatTimestamp(notification.sentAt)}
                          </p>
                          {notification.targetedUsers && (
                            <p className="flex items-center mt-2">
                              <FiUsers className="mr-2 text-gray-500" /> 
                              Target: {notification.targetedUsers.length} specific users
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Hover effect bottom gradient line */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/40 to-cyan-500/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8 max-w-3xl mx-auto bg-zinc-900 border border-cyan-900/30 p-6 rounded-lg relative">
        <div className="absolute inset-0 noise opacity-5 rounded-lg"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-cyan-300">
            <FiInfo className="mr-2" />
            Push Notification Tips
          </h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start p-2 rounded-lg hover:bg-cyan-900/10 transition-colors">
              <FiCheckCircle className="text-cyan-400 mt-1 mr-3 flex-shrink-0" />
              <span>Keep titles short and attention-grabbing (under 50 characters)</span>
            </li>
            <li className="flex items-start p-2 rounded-lg hover:bg-cyan-900/10 transition-colors">
              <FiCheckCircle className="text-cyan-400 mt-1 mr-3 flex-shrink-0" />
              <span>Make messages clear and actionable (under 150 characters)</span>
            </li>
            <li className="flex items-start p-2 rounded-lg hover:bg-cyan-900/10 transition-colors">
              <FiCheckCircle className="text-cyan-400 mt-1 mr-3 flex-shrink-0" />
              <span>Avoid sending too many notifications in a short period</span>
            </li>
            <li className="flex items-start p-2 rounded-lg hover:bg-cyan-900/10 transition-colors">
              <FiCheckCircle className="text-cyan-400 mt-1 mr-3 flex-shrink-0" />
              <span>Include additional data (like event IDs) to enable deep linking</span>
            </li>
            <li className="flex items-start p-2 rounded-lg hover:bg-cyan-900/10 transition-colors">
              <FiCheckCircle className="text-cyan-400 mt-1 mr-3 flex-shrink-0" />
              <span>Target specific user groups when relevant instead of sending to all users</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 